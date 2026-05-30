<?php
// api/teacher/create-homework.php — Create a new homework with all sections
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/notify.php';
require_once __DIR__ . '/../../lib/lib/push.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);
csrf_validate();
ensure_publish_schedule_support($pdo);

$student_id   = (int)($_POST['student_id']         ?? 0);
$title        = trim((string)($_POST['title']       ?? ''));
$hw_date      = trim((string)($_POST['hw_date']     ?? ''));
$publish_time = trim((string)($_POST['publish_time'] ?? ''));
$status       = trim((string)($_POST['status']      ?? 'draft'));
$media_url    = trim((string)($_POST['media_url']   ?? ''));
$media_instr  = trim((string)($_POST['media_instructions'] ?? ''));
$reading_text = trim((string)($_POST['reading_text'] ?? ''));
$mcqJson      = trim((string)($_POST['mcq_questions']     ?? '[]'));
$writingJson  = trim((string)($_POST['writing_questions'] ?? '[]'));
$speakingJson = trim((string)($_POST['speaking_questions'] ?? '[]'));

if ($student_id <= 0) json_err('Invalid student ID');
if ($title === '')    json_err('Title is required');
if ($hw_date === '')  json_err('Date is required');

$validStatus = ['draft', 'published', 'closed'];
if (!in_array($status, $validStatus, true)) $status = 'draft';
$publish_at = normalize_publish_at($hw_date, $publish_time);
if ($status === 'published' && !$publish_at) json_err('Invalid publish date/time');

$check = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$check->execute([$student_id]);
if (!$check->fetch()) json_err('Student not found', 404);

$mcqQuestions     = json_decode($mcqJson, true)     ?: [];
$writingQuestions = json_decode($writingJson, true)  ?: [];
$speakingQuestions= json_decode($speakingJson, true) ?: [];

$pdo->beginTransaction();
try {
    $pdo->prepare("
        INSERT INTO homeworks (student_id, title, hw_date, publish_at, status, media_url, media_instructions, reading_text, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ")->execute([$student_id, $title, $hw_date, $publish_at, $status, $media_url ?: null, $media_instr ?: null, $reading_text ?: null]);
    $homework_id = (int)$pdo->lastInsertId();

    if ($mcqQuestions) {
        $ins = $pdo->prepare("
            INSERT INTO homework_mcq_questions
                   (homework_id, q_order, question_text, opt_a, opt_b, opt_c, opt_d, correct_option)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($mcqQuestions as $i => $q) {
            $ins->execute([
                $homework_id, $i + 1,
                trim((string)($q['question_text'] ?? '')),
                trim((string)($q['option_a'] ?? '')),
                trim((string)($q['option_b'] ?? '')),
                trim((string)($q['option_c'] ?? '')) ?: null,
                trim((string)($q['option_d'] ?? '')) ?: null,
                strtolower(trim((string)($q['correct_option'] ?? 'a'))),
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
                trim((string)($q['prompt'] ?? '')),
                (int)($q['min_sentences'] ?? 3),
                trim((string)($q['focus_area'] ?? '')) ?: null,
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
                trim((string)($q['prompt'] ?? '')),
                (int)($q['time_limit'] ?? 60),
                trim((string)($q['tips'] ?? '')) ?: null,
            ]);
        }
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Failed to save homework: ' . $e->getMessage());
}

if ($status === 'published' && strtotime((string)$publish_at) <= time()) {
    try {
        notify_student_publication($pdo, $student_id, [
            'kind'          => 'Homework',
            'title'         => $title,
            'headline'      => 'New homework published',
            'body'          => 'Your homework "' . $title . '" is ready for you.',
            'action_label'  => 'Start Homework',
            'action_url'    => '/student/homework.php?homework_id=' . $homework_id,
            'delivery_type' => 'homework',
            'delivery_id'   => $homework_id,
        ]);
    } catch (Throwable) {}

    try {
        $student = push_student_row($pdo, $student_id);
        $waMessage = whatsapp_homework_message($student, $title);
        push_notify_teacher(
            $pdo,
            'Send homework on WhatsApp',
            'Homework "' . $title . '" is ready. Open WhatsApp or copy the message.',
            '/teacher/homework.php',
            (string)($student['whatsapp'] ?? ''),
            $waMessage
        );
    } catch (Throwable) {}
}

json_ok([
    'homework_id'      => $homework_id,
    'title'            => $title,
    'publish_at'       => $publish_at,
    'effective_status' => effective_publish_status($status, $publish_at, $hw_date),
]);
