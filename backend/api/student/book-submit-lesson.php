<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
csrf_validate();
interactive_books_ensure_schema($pdo);

$studentId = (int)$_SESSION['student_id'];
$lessonId = (int)($_POST['lesson_id'] ?? 0);
$lesson = interactive_books_lesson($pdo, $lessonId);
if (!$lesson || !interactive_books_student_can_access($pdo, $studentId, (int)$lesson['book_id'])) {
    json_err('Lesson not found', 404);
}

$content = interactive_books_lesson_content((int)$lesson['lesson_number'], (string)($lesson['slug'] ?? ''));
$selfCheck = (array)($_POST['self_check'] ?? []);
$selfCheckMin = (int)($content['self_check_min'] ?? 3);
if (!empty($content['self_check']) && count(array_filter($selfCheck, 'is_string')) < $selfCheckMin) {
    json_err('Please complete at least ' . $selfCheckMin . ' self-check items.');
}

// Validate speaking
if (!empty($content['speaking_tasks'])) {
    foreach ($content['speaking_tasks'] as $task) {
        $key = (string)($task['key'] ?? '');
        if ($key !== '' && trim((string)($_POST['speaking_tasks'][$key]['audio_url'] ?? '')) === '') {
            json_err('All speaking recordings are required.');
        }
    }
} else {
    $audioUrl = trim((string)($_POST['speaking_audio_url'] ?? ''));
    if (!empty($content['speaking_title']) && $audioUrl === '') {
        json_err('Speaking recording is required.');
    }
}

// Validate writing min sentences
$writing = trim((string)($_POST['writing_task'] ?? ''));
$minSentences = (int)($content['min_sentences'] ?? 0);
if ($minSentences > 0) {
    $sentenceCount = count(array_filter(preg_split('/[.!؟\n]+/u', $writing) ?: [], static fn($x) => trim((string)$x) !== ''));
    if ($sentenceCount < $minSentences) json_err('Please write at least ' . $minSentences . ' Arabic sentences.');
}

$built = interactive_books_build_answers_json($_POST, (int)$lesson['lesson_number'], (string)($lesson['slug'] ?? ''));
$submissionId = interactive_books_get_or_create_submission($pdo, $studentId, (int)$lesson['book_id'], $lessonId);

$pdo->beginTransaction();
try {
    $pdo->prepare("
        UPDATE book_lesson_submissions
        SET status = 'submitted', answers_json = ?, auto_score = ?, submitted_at = NOW(), updated_at = NOW()
        WHERE id = ? AND student_id = ?
    ")->execute([
        json_encode($built['answers'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        $built['auto_score'],
        $submissionId,
        $studentId,
    ]);

    $speakingUrl = trim((string)($_POST['speaking_audio_url'] ?? ''));
    if ($speakingUrl !== '') {
        $pdo->prepare("UPDATE book_speaking_submissions SET submission_id = ? WHERE student_id = ? AND lesson_id = ? AND audio_url = ?")
            ->execute([$submissionId, $studentId, $lessonId, $speakingUrl]);
    }

    $studentName = interactive_books_student_name($pdo, $studentId);
    interactive_books_notify_teacher($pdo, $submissionId, $studentName);
    $pdo->commit();
} catch (Throwable) {
    $pdo->rollBack();
    json_err('Could not submit lesson.');
}

json_ok(['submission_id' => $submissionId, 'auto_score' => $built['auto_score']]);
