<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

interactive_books_ensure_schema($pdo);

// Ensure content_json column exists
try {
    $cols = $pdo->query("SHOW COLUMNS FROM book_lessons")->fetchAll(PDO::FETCH_COLUMN) ?: [];
    if (!in_array('content_json', $cols, true)) {
        $pdo->exec("ALTER TABLE book_lessons ADD COLUMN content_json LONGTEXT NULL AFTER slug");
    }
} catch (Throwable) {}

$stmt = $pdo->query("
    SELECT b.*, COUNT(bl.id) AS lesson_count
    FROM books b
    LEFT JOIN book_lessons bl ON bl.book_id = b.id
    GROUP BY b.id
    ORDER BY b.id ASC
");
$books = [];
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
    $lessonStmt = $pdo->prepare("
        SELECT id, lesson_number, unit_type, title_en, title_ar, slug, status,
               CASE WHEN content_json IS NOT NULL AND content_json != '' THEN 1 ELSE 0 END AS has_content
        FROM book_lessons WHERE book_id = ? ORDER BY COALESCE(sort_order, lesson_number) ASC
    ");
    $lessonStmt->execute([(int)$row['id']]);
    $lessons = array_map(static function (array $l): array {
        return [
            'id' => (int)$l['id'],
            'lesson_number' => (int)$l['lesson_number'],
            'unit_type' => (string)$l['unit_type'],
            'title_en' => (string)$l['title_en'],
            'title_ar' => (string)$l['title_ar'],
            'slug' => (string)$l['slug'],
            'status' => (string)$l['status'],
            'has_content' => (bool)$l['has_content'],
        ];
    }, $lessonStmt->fetchAll(PDO::FETCH_ASSOC) ?: []);

    $books[] = [
        'id' => (int)$row['id'],
        'title_en' => (string)$row['title_en'],
        'title_ar' => (string)$row['title_ar'],
        'slug' => (string)$row['slug'],
        'level' => (string)$row['level'],
        'status' => (string)$row['status'],
        'lesson_count' => (int)$row['lesson_count'],
        'lessons' => $lessons,
    ];
}

json_ok(['books' => $books]);
