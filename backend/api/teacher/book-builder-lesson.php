<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

interactive_books_ensure_schema($pdo);
$lessonId = (int)($_GET['lesson_id'] ?? 0);
if (!$lessonId) json_err('lesson_id required', 400);

$stmt = $pdo->prepare("
    SELECT bl.*, b.title_en AS book_title_en
    FROM book_lessons bl
    JOIN books b ON b.id = bl.book_id
    WHERE bl.id = ?
    LIMIT 1
");
$stmt->execute([$lessonId]);
$lesson = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$lesson) json_err('Lesson not found', 404);

$contentJson = (string)($lesson['content_json'] ?? '');
$content = $contentJson !== '' ? (json_decode($contentJson, true) ?: []) : null;

// Fall back to PHP file content if no builder content yet
if ($content === null) {
    $content = interactive_books_lesson_content((int)$lesson['lesson_number'], (string)($lesson['slug'] ?? ''));
}

json_ok([
    'lesson' => [
        'id' => (int)$lesson['id'],
        'book_id' => (int)$lesson['book_id'],
        'lesson_number' => (int)$lesson['lesson_number'],
        'unit_type' => (string)$lesson['unit_type'],
        'title_en' => (string)$lesson['title_en'],
        'title_ar' => (string)$lesson['title_ar'],
        'slug' => (string)$lesson['slug'],
        'status' => (string)$lesson['status'],
        'book_title_en' => (string)$lesson['book_title_en'],
        'has_content' => $contentJson !== '',
    ],
    'content' => $content,
]);
