<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);

interactive_books_ensure_schema($pdo);
$studentId = (int)$_SESSION['student_id'];
$lessonId = (int)($_GET['lesson_id'] ?? 0);

$lesson = interactive_books_lesson($pdo, $lessonId);
if (!$lesson || !interactive_books_student_can_access($pdo, $studentId, (int)$lesson['book_id'])) {
    json_err('Lesson not found', 404);
}

interactive_books_touch_access($pdo, $studentId, (int)$lesson['book_id']);

// Prefer teacher-authored content (content_json) over the static PHP file content.
$contentJson = (string)($lesson['content_json'] ?? '');
$content = $contentJson !== '' ? (json_decode($contentJson, true) ?: null) : null;
if ($content === null) {
    $content = interactive_books_lesson_content((int)$lesson['lesson_number'], (string)($lesson['slug'] ?? ''));
}

// Prev/next lesson navigation within the same book.
$bookLessons = interactive_books_published_lessons($pdo, (int)$lesson['book_id']);
$prevLessonId = null;
$nextLessonId = null;
foreach ($bookLessons as $i => $row) {
    if ((int)$row['id'] === $lessonId) {
        $prevLessonId = isset($bookLessons[$i - 1]) ? (int)$bookLessons[$i - 1]['id'] : null;
        $nextLessonId = isset($bookLessons[$i + 1]) ? (int)$bookLessons[$i + 1]['id'] : null;
        break;
    }
}

$submission = interactive_books_current_submission($pdo, $studentId, $lessonId);
$answers = $submission ? (interactive_books_submission_answers($submission)['answers'] ?? []) : [];

json_ok([
    'lesson' => [
        'id' => (int)$lesson['id'],
        'lesson_number' => (int)$lesson['lesson_number'],
        'unit_type' => (string)$lesson['unit_type'],
        'title_en' => (string)$lesson['title_en'],
        'title_ar' => (string)$lesson['title_ar'],
        'slug' => (string)$lesson['slug'],
        'book_title_en' => (string)$lesson['book_title_en'],
        'book_level' => (string)$lesson['book_level'],
        'book_id' => (int)$lesson['book_id'],
        'submission_status' => $submission ? (string)$submission['status'] : null,
        'auto_score' => $submission ? (float)$submission['auto_score'] : null,
        'submission_id' => $submission ? (int)$submission['id'] : null,
        'prev_lesson_id' => $prevLessonId,
        'next_lesson_id' => $nextLessonId,
    ],
    'content' => $content,
    'submission' => $submission ? [
        'id' => (int)$submission['id'],
        'status' => (string)$submission['status'],
        'answers_json' => (string)$submission['answers_json'],
        'auto_score' => (float)$submission['auto_score'],
        'teacher_score' => $submission['teacher_score'] !== null ? (float)$submission['teacher_score'] : null,
        'final_feedback' => $submission['final_feedback'] ? (string)$submission['final_feedback'] : null,
        'submitted_at' => $submission['submitted_at'] ? (string)$submission['submitted_at'] : null,
        'reviewed_at' => $submission['reviewed_at'] ? (string)$submission['reviewed_at'] : null,
    ] : null,
    'answers' => $answers,
]);
