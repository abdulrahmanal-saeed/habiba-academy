<?php
// api/review/student-list.php — List reviews for a student (teacher view)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/review/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

ensure_review_tables($pdo);

$studentId = (int)($_GET['student_id'] ?? 0);
if ($studentId <= 0) json_err('Invalid student ID');

$stmt = $pdo->prepare("
    SELECT r.id, r.title, r.review_type, r.review_date, r.status, r.total_points,
           s.id AS submission_id, s.auto_score, s.manual_score, s.total_score,
           s.review_status, s.submitted_at
    FROM student_reviews r
    LEFT JOIN student_review_submissions s ON s.review_id = r.id AND s.student_id = r.student_id
    WHERE r.student_id = ?
    ORDER BY r.review_date DESC, r.id DESC
");
$stmt->execute([$studentId]);

$items = array_map(static function (array $row): array {
    return [
        'id'           => (int)$row['id'],
        'title'        => $row['title'],
        'review_type'  => $row['review_type'],
        'review_date'  => $row['review_date'],
        'status'       => $row['status'],
        'total_points' => (int)$row['total_points'],
        'submission_id'=> $row['submission_id'] ? (int)$row['submission_id'] : null,
        'auto_score'   => $row['auto_score']    !== null ? (int)$row['auto_score']   : null,
        'manual_score' => $row['manual_score']  !== null ? (int)$row['manual_score'] : null,
        'total_score'  => $row['total_score']   !== null ? (int)$row['total_score']  : null,
        'review_status'=> $row['review_status'] ?: null,
        'submitted_at' => $row['submitted_at'],
    ];
}, $stmt->fetchAll());

json_ok(['items' => $items]);
