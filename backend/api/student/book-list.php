<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);

interactive_books_ensure_schema($pdo);
$studentId = (int)$_SESSION['student_id'];

$stmt = $pdo->prepare("
    SELECT
        b.id, b.title_en, b.title_ar, b.slug, b.level, b.status, b.price,
        COALESCE(sba.access_status, 'locked') AS access_status,
        COUNT(DISTINCT bl.id) AS total_lessons,
        COUNT(DISTINCT CASE WHEN bls.status IN ('feedback_sent','completed') THEN bls.lesson_id END) AS completed_lessons
    FROM books b
    LEFT JOIN student_book_access sba ON sba.book_id = b.id AND sba.student_id = ?
    LEFT JOIN book_lessons bl ON bl.book_id = b.id AND bl.status = 'published'
    LEFT JOIN book_lesson_submissions bls ON bls.book_id = b.id AND bls.student_id = ?
    WHERE b.status = 'published'
    GROUP BY b.id
    ORDER BY b.id ASC
");
$stmt->execute([$studentId, $studentId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

$books = array_map(static function (array $row) {
    $total = (int)$row['total_lessons'];
    $done = (int)$row['completed_lessons'];
    $pct = $total > 0 ? (int)round(($done / $total) * 100) : 0;
    return [
        'id' => (int)$row['id'],
        'title_en' => (string)$row['title_en'],
        'title_ar' => (string)$row['title_ar'],
        'slug' => (string)$row['slug'],
        'level' => (string)$row['level'],
        'status' => (string)$row['status'],
        'price' => (float)$row['price'],
        'access_status' => (string)$row['access_status'],
        'progress_pct' => $pct,
    ];
}, $rows);

json_ok(['books' => $books]);
