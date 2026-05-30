<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$body = (array)(json_decode(file_get_contents('php://input'), true) ?: []);

$lessonId = isset($body['lesson_id']) ? (int)$body['lesson_id'] : 0;
$bookId   = isset($body['book_id'])   ? (int)$body['book_id']   : 0;

if (!$lessonId && !$bookId) json_err('lesson_id or book_id required', 400);

if ($lessonId) {
    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE id = ? LIMIT 1");
    $stmt->execute([$lessonId]);
    if (!$stmt->fetch()) json_err('Lesson not found', 404);

    $pdo->prepare("DELETE FROM book_lessons WHERE id = ?")->execute([$lessonId]);
    json_ok(['deleted' => 'lesson', 'lesson_id' => $lessonId]);
}

// Delete entire book
$stmt = $pdo->prepare("SELECT id FROM books WHERE id = ? LIMIT 1");
$stmt->execute([$bookId]);
if (!$stmt->fetch()) json_err('Book not found', 404);

$pdo->beginTransaction();
try {
    $pdo->prepare("DELETE FROM book_lessons WHERE book_id = ?")->execute([$bookId]);
    $pdo->prepare("DELETE FROM books WHERE id = ?")->execute([$bookId]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Delete failed', 500);
}

json_ok(['deleted' => 'book', 'book_id' => $bookId]);
