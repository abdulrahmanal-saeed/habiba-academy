<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
start_session();

if (empty($_SESSION['parent_id'])) json_err('Not authenticated', 401);
$parent_id = (int)$_SESSION['parent_id'];
portals_ensure_schema($pdo);

$child_id = (int)($_GET['id'] ?? 0);
if (!$child_id) json_err('Missing child id', 400);

// Verify parent owns this child
$verify = $pdo->prepare("
    SELECT 1 FROM parent_students
    WHERE parent_id=? AND student_id=? AND status='active'
    LIMIT 1
");
$verify->execute([$parent_id, $child_id]);
if (!$verify->fetch()) json_err('Access denied', 403);

$childStmt = $pdo->prepare("SELECT id, full_name, login_code, level FROM students WHERE id=? LIMIT 1");
$childStmt->execute([$child_id]);
$child = $childStmt->fetch();
if (!$child) json_err('Child not found', 404);

interactive_books_ensure_schema($pdo);

$stmt = $pdo->prepare("
    SELECT
        b.id, b.title_en, b.title_ar, b.level, b.status,
        COALESCE(sba.access_status, 'locked') AS access_status,
        COUNT(DISTINCT bl.id) AS total_lessons,
        COUNT(DISTINCT CASE WHEN bls.status IN ('feedback_sent','completed')
                            THEN bls.lesson_id END) AS completed_lessons
    FROM books b
    LEFT JOIN student_book_access sba ON sba.book_id = b.id AND sba.student_id = ?
    LEFT JOIN book_lessons bl ON bl.book_id = b.id AND bl.status = 'published'
    LEFT JOIN book_lesson_submissions bls ON bls.book_id = b.id AND bls.student_id = ?
    WHERE b.status = 'published'
    GROUP BY b.id
    ORDER BY b.id ASC
");
$stmt->execute([$child_id, $child_id]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

$books = array_map(static function (array $r): array {
    $total = (int)$r['total_lessons'];
    $done  = (int)$r['completed_lessons'];
    return [
        'id'             => (int)$r['id'],
        'title_en'       => (string)$r['title_en'],
        'title_ar'       => (string)$r['title_ar'],
        'level'          => (string)$r['level'],
        'access_status'  => (string)$r['access_status'],
        'total_lessons'  => $total,
        'done_lessons'   => $done,
        'progress_pct'   => $total > 0 ? (int)round($done / $total * 100) : 0,
    ];
}, $rows);

json_ok(['child' => $child, 'books' => $books]);
