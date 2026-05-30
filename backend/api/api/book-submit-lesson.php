<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/interactive-books.php';
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

$writing = trim((string)($_POST['writing_task'] ?? ''));
$selfCheck = (array)($_POST['self_check'] ?? []);
$content = interactive_books_lesson_content((int)$lesson['lesson_number'], (string)($lesson['slug'] ?? ''));
if (!empty($content['speaking_tasks'])) {
    foreach (($content['speaking_tasks'] ?? []) as $task) {
        $key = (string)($task['key'] ?? '');
        if ($key !== '' && trim((string)($_POST['speaking_tasks'][$key]['audio_url'] ?? '')) === '') {
            json_err('All speaking recordings are required.');
        }
    }
} else {
    $audioUrl = trim((string)($_POST['speaking_audio_url'] ?? ''));
    if ($audioUrl === '') json_err('Speaking recording is required.');
}
$selfCheckMin = (int)($content['self_check_min'] ?? 3);
if (count(array_filter($selfCheck, 'is_string')) < $selfCheckMin) json_err('Please complete at least ' . $selfCheckMin . ' self-check items.');
$minSentences = (int)($content['min_sentences'] ?? 3);
if ($minSentences > 0 && count(array_filter(preg_split('/[.!؟\n]+/u', $writing) ?: [], static fn($x) => trim((string)$x) !== '')) < $minSentences) {
    json_err('Please write at least ' . $minSentences . ' Arabic sentences.');
}
foreach (($content['writing_tasks'] ?? []) as $task) {
    $key = (string)($task['key'] ?? '');
    if ($key === '') continue;
    $taskAnswer = trim((string)($_POST['writing_tasks'][$key] ?? ''));
    $taskMin = (int)($task['min_sentences'] ?? 3);
    if (count(array_filter(preg_split('/[.!؟\n]+/u', $taskAnswer) ?: [], static fn($x) => trim((string)$x) !== '')) < $taskMin) {
        json_err('Please complete ' . (string)($task['title'] ?? 'all writing tasks') . '.');
    }
}
foreach (($content['mcq'] ?? []) as $q) {
    if (trim((string)($_POST['mcq'][$q['id']] ?? '')) === '') json_err('Please answer all MCQ questions.');
}
foreach (($content['number_recognition'] ?? []) as $q) {
    if (trim((string)($_POST['number_recognition'][$q['id']] ?? '')) === '') json_err('Please answer all number recognition questions.');
}
foreach (($content['time_recognition'] ?? []) as $q) {
    if (trim((string)($_POST['time_recognition'][$q['id']] ?? '')) === '') json_err('Please answer all time recognition questions.');
}
foreach (($content['direction_recognition'] ?? []) as $q) {
    if (trim((string)($_POST['direction_recognition'][$q['id']] ?? '')) === '') json_err('Please answer all direction recognition questions.');
}
foreach (($content['work_sentence_practice'] ?? []) as $q) {
    if (trim((string)($_POST['work_sentence_practice'][$q['id']] ?? '')) === '') json_err('Please answer all work sentence practice questions.');
}
foreach (($content['pain_sentence_practice'] ?? []) as $q) {
    if (trim((string)($_POST['pain_sentence_practice'][$q['id']] ?? '')) === '') json_err('Please answer all pain sentence practice questions.');
}
foreach (($content['topic_recognition'] ?? []) as $q) {
    if (trim((string)($_POST['topic_recognition'][$q['id']] ?? '')) === '') json_err('Please answer all topic recognition questions.');
}
foreach (($content['topic_category'] ?? []) as $q) {
    if (trim((string)($_POST['topic_category'][$q['id']] ?? '')) === '') json_err('Please answer all topic category questions.');
}
foreach (($content['category_practice'] ?? []) as $q) {
    if (trim((string)($_POST['category_practice'][$q['id']] ?? '')) === '') json_err('Please complete all category practice questions.');
}
foreach (($content['listening_review'] ?? []) as $q) {
    if (trim((string)($_POST['listening_review'][$q['id']] ?? '')) === '') json_err('Please answer all listening review questions.');
}
foreach (($content['reading_comprehension'] ?? []) as $q) {
    if (trim((string)($_POST['reading_comprehension'][$q['id']] ?? '')) === '') json_err('Please answer all reading comprehension questions.');
}
foreach (($content['price_recognition'] ?? []) as $q) {
    if (trim((string)($_POST['price_recognition'][$q['id']] ?? '')) === '') json_err('Please answer all price recognition questions.');
}
foreach (($content['color_recognition'] ?? []) as $q) {
    if (trim((string)($_POST['color_recognition'][$q['id']] ?? '')) === '') json_err('Please answer all color recognition questions.');
}
foreach (($content['matching'] ?? []) as $q) {
    if (trim((string)($_POST['matching'][$q['id']] ?? '')) === '') json_err('Please complete all matching questions.');
}
foreach (($content['daily_action_matching'] ?? []) as $q) {
    if (trim((string)($_POST['daily_action_matching'][$q['id']] ?? '')) === '') json_err('Please complete all daily action matching questions.');
}
foreach (($content['direction_matching'] ?? []) as $q) {
    if (trim((string)($_POST['direction_matching'][$q['id']] ?? '')) === '') json_err('Please complete all direction matching questions.');
}
foreach (($content['job_matching'] ?? []) as $q) {
    if (trim((string)($_POST['job_matching'][$q['id']] ?? '')) === '') json_err('Please complete all job matching questions.');
}
foreach (($content['workplace_matching'] ?? []) as $q) {
    if (trim((string)($_POST['workplace_matching'][$q['id']] ?? '')) === '') json_err('Please complete all workplace matching questions.');
}
foreach (($content['body_matching'] ?? []) as $q) {
    if (trim((string)($_POST['body_matching'][$q['id']] ?? '')) === '') json_err('Please complete all body matching questions.');
}
foreach (($content['health_phrase_matching'] ?? []) as $q) {
    if (trim((string)($_POST['health_phrase_matching'][$q['id']] ?? '')) === '') json_err('Please complete all health phrase matching questions.');
}
foreach (($content['conversation_phrase_matching'] ?? []) as $q) {
    if (trim((string)($_POST['conversation_phrase_matching'][$q['id']] ?? '')) === '') json_err('Please complete all conversation phrase matching questions.');
}
foreach (($content['vocabulary_matching'] ?? []) as $q) {
    if (trim((string)($_POST['vocabulary_matching'][$q['id']] ?? '')) === '') json_err('Please complete all vocabulary matching questions.');
}
foreach (($content['description_matching'] ?? []) as $q) {
    if (trim((string)($_POST['description_matching'][$q['id']] ?? '')) === '') json_err('Please complete all description matching questions.');
}
foreach (($content['sequence_practice'] ?? []) as $q) {
    if (trim((string)($_POST['sequence_practice'][$q['id']] ?? '')) === '') json_err('Please complete all sequence practice questions.');
}
foreach (($content['complete_sentence'] ?? []) as $q) {
    if (trim((string)($_POST['complete_sentence'][$q['id']] ?? '')) === '') json_err('Please complete all sentence questions.');
}
foreach (($content['complete_conversation'] ?? []) as $q) {
    if (trim((string)($_POST['complete_conversation'][$q['id']] ?? '')) === '') json_err('Please complete all conversation questions.');
}
foreach (($content['arrange_words'] ?? []) as $q) {
    if (trim((string)($_POST['arrange_words'][$q['id']] ?? '')) === '') json_err('Please complete all arrange-words questions.');
}
foreach (($content['listening_numbers'] ?? []) as $q) {
    if (trim((string)($_POST['listening_numbers'][$q['id']] ?? '')) === '') json_err('Please answer all listening number questions.');
}

$built = interactive_books_build_answers_json($_POST, (int)$lesson['lesson_number'], (string)($lesson['slug'] ?? ''));
$submissionId = interactive_books_get_or_create_submission($pdo, $studentId, (int)$lesson['book_id'], $lessonId);
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare("
        UPDATE book_lesson_submissions
        SET status = 'submitted', answers_json = ?, auto_score = ?, submitted_at = NOW(), updated_at = NOW()
        WHERE id = ? AND student_id = ?
    ");
    $stmt->execute([
        json_encode($built['answers'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        $built['auto_score'],
        $submissionId,
        $studentId,
    ]);

    if (!empty($content['speaking_tasks'])) {
        foreach (($content['speaking_tasks'] ?? []) as $task) {
            $key = (string)($task['key'] ?? '');
            $audioUrl = trim((string)($_POST['speaking_tasks'][$key]['audio_url'] ?? ''));
            if ($key !== '' && $audioUrl !== '') {
                $pdo->prepare("
                    UPDATE book_speaking_submissions
                    SET submission_id = ?
                    WHERE student_id = ? AND lesson_id = ? AND audio_url = ?
                ")->execute([$submissionId, $studentId, $lessonId, $audioUrl]);
            }
        }
    } else {
        $audioUrl = trim((string)($_POST['speaking_audio_url'] ?? ''));
        $pdo->prepare("
            UPDATE book_speaking_submissions
            SET submission_id = ?
            WHERE student_id = ? AND lesson_id = ? AND audio_url = ?
        ")->execute([$submissionId, $studentId, $lessonId, $audioUrl]);
    }

    $studentName = interactive_books_student_name($pdo, $studentId);
    interactive_books_notify_teacher($pdo, $submissionId, $studentName);
    learning_audit($pdo, 'book_lesson_submitted', 'book_lesson_submission', $submissionId, [
        'student_id' => $studentId,
        'book_id' => (int)$lesson['book_id'],
        'lesson_id' => $lessonId,
        'auto_score' => $built['auto_score'],
    ], [], 'student', $studentId);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Could not submit lesson.');
}

json_ok(['submission_id' => $submissionId, 'auto_score' => $built['auto_score']]);
