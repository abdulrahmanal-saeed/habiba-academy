<?php
// api/teacher/update-homework.php — Update homework (only if not yet submitted)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/notify.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);
csrf_validate();
ensure_publish_schedule_support($pdo);

$homework_id  = (int)($_POST['homework_id']         ?? 0);
$title        = trim((string)($_POST['title']        ?? ''));
$hw_date      = trim((string)($_POST['hw_date']      ?? ''));
$publish_time = trim((string)($_POST['publish_time'] ?? ''));
$status       = trim((string)($_POST['status']       ?? 'draft'));
$media_url    = trim((string)($_POST['media_url']    ?? ''));
$media_instr  = trim((string)($_POST['media_instructions'] ?? ''));
$reading_text = trim((string)($_POST['reading_text'] ?? ''));
$mcqJson      = trim((string)($_POST['mcq_questions']     ?? '[]'));
$writingJson  = trim((string)($_POST['writing_questions'] ?? '[]'));
$speakingJson = trim((string)($_POST['speaking_questions'] ?? '[]'));

if ($homework_id <= 0) json_err('Invalid homework ID');
if ($title === '')     json_err('Title is required');
if ($hw_date === '')   json_err('Date is required');

$validStatus = ['draft','published','closed'];
if (!in_array($status, $validStatus, true)) $status = 'draft';
$publish_at = normalize_publish_at($hw_date, $publish_time);
if ($status === 'published' && !$publish_at) json_err('Invalid publish date/time');

$check = $pdo->prepare("
    SELECT h.id, h.student_id, h.status FROM homeworks h
    WHERE h.id = ?
      AND (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id AND is_submitted = 1) = 0
");
$check->execute([$homework_id]);
$existing = $check->fetch();
if (!$existing) json_err('Homework not found or already submitted', 404);

$mcqQuestions     = json_decode($mcqJson, true)     ?: [];
$writingQuestions = json_decode($writingJson, true)  ?: [];
$speakingQuestions= json_decode($speakingJson, true) ?: [];

$pdo->beginTransaction();
try {
    $pdo->prepare("
        UPDATE homeworks
        SET title = ?, hw_date = ?, publish_at = ?, status = ?,
            media_url = ?, media_instructions = ?, reading_text = ?
        WHERE id = ?
    ")->execute([$title, $hw_date, $publish_at, $status, $media_url ?: null, $media_instr ?: null, $reading_text ?: null, $homework_id]);

    $pdo->prepare("DELETE FROM homework_mcq_questions      WHERE homework_id = ?")->execute([$homework_id]);
    $pdo->prepare("DELETE FROM homework_writing_questions  WHERE homework_id = ?")->execute([$homework_id]);
    $pdo->prepare("DELETE FROM homework_speaking_questions WHERE homework_id = ?")->execute([$homework_id]);

    if ($mcqQuestions) {
        $ins = $pdo->prepare("
            INSERT INTO homework_mcq_questions
                   (homework_id, q_order, question_text, opt_a, opt_b, opt_c, opt_d, correct_option)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($mcqQuestions as $i => $q) {
            $ins->execute([
                $homework_id, $i + 1,
                trim($q['question_text'] ?? ''),
                trim($q['option_a'] ?? ''),
                trim($q['option_b'] ?? ''),
                trim($q['option_c'] ?? '') ?: null,
                trim($q['option_d'] ?? '') ?: null,
                strtolower(trim($q['correct_option'] ?? 'a')),
            ]);
        }
    }

    if ($writingQuestions) {
        $ins = $pdo->prepare("
            INSERT INTO homework_writing_questions (homework_id, q_order, prompt, min_sentences, focus)
            VALUES (?, ?, ?, ?, ?)
        ");
        foreach ($writingQuestions as $i => $q) {
            $ins->execute([
                $homework_id, $i + 1,
                trim($q['prompt'] ?? ''),
                (int)($q['min_sentences'] ?? 3),
                trim($q['focus_area'] ?? '') ?: null,
            ]);
        }
    }

    if ($speakingQuestions) {
        $ins = $pdo->prepare("
            INSERT INTO homework_speaking_questions (homework_id, q_order, prompt, time_limit_seconds, tips)
            VALUES (?, ?, ?, ?, ?)
        ");
        foreach ($speakingQuestions as $i => $q) {
            $ins->execute([
                $homework_id, $i + 1,
                trim($q['prompt'] ?? ''),
                (int)($q['time_limit'] ?? 60),
                trim($q['tips'] ?? '') ?: null,
            ]);
        }
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Failed to update homework: ' . $e->getMessage());
}

if ($status === 'published' && strtotime((string)$publish_at) <= time()) {
    try {
        notify_student_publication($pdo, (int)$existing['student_id'], [
            'kind'          => 'Homework',
            'title'         => $title,
            'headline'      => 'Homework updated',
            'body'          => 'Your homework "' . $title . '" is now ready on the website.',
            'action_label'  => 'Open Homework',
            'action_url'    => '/student/homework.php?homework_id=' . $homework_id,
            'delivery_type' => 'homework',
            'delivery_id'   => $homework_id,
        ]);
    } catch (Throwable) {}
}

json_ok([
    'homework_id'      => $homework_id,
    'title'            => $title,
    'publish_at'       => $publish_at,
    'effective_status' => effective_publish_status($status, $publish_at, $hw_date),
]);
