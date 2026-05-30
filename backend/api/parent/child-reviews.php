<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/review/helpers.php';
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

ensure_review_tables($pdo);

$stmt = $pdo->prepare("
    SELECT r.id, r.title, r.review_type, r.review_date, r.status, r.total_points,
           sub.review_status AS submission_status,
           sub.total_score, sub.submitted_at, sub.teacher_note
    FROM student_reviews r
    LEFT JOIN student_review_submissions sub
        ON sub.review_id = r.id AND sub.student_id = r.student_id
    WHERE r.student_id = ? AND r.status IN ('published','closed')
    ORDER BY r.review_date DESC
    LIMIT 50
");
$stmt->execute([$child_id]);
$reviews = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

foreach ($reviews as &$rv) {
    $rv['total_score'] = $rv['total_score'] !== null ? (int)$rv['total_score'] : null;
    $rv['total_points'] = (int)$rv['total_points'];
}
unset($rv);

json_ok(['child' => $child, 'reviews' => $reviews]);
