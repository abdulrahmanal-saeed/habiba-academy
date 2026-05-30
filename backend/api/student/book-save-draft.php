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

$built = interactive_books_build_answers_json($_POST, (int)$lesson['lesson_number'], (string)($lesson['slug'] ?? ''));
$submissionId = interactive_books_get_or_create_submission($pdo, $studentId, (int)$lesson['book_id'], $lessonId);
$stmt = $pdo->prepare("
    UPDATE book_lesson_submissions
    SET status = 'in_progress', answers_json = ?, auto_score = ?, updated_at = NOW()
    WHERE id = ? AND student_id = ?
");
$stmt->execute([
    json_encode($built['answers'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    $built['auto_score'],
    $submissionId,
    $studentId,
]);

json_ok(['submission_id' => $submissionId, 'auto_score' => $built['auto_score']]);
