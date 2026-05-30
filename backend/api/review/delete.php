<?php
// api/review/delete.php — Delete a review (blocked if any submission exists)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/review/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

ensure_review_tables($pdo);

$reviewId = (int)($_POST['review_id'] ?? 0);
if ($reviewId <= 0) json_err('Invalid review ID');

$stmt = $pdo->prepare("
    SELECT r.id,
           (SELECT COUNT(*) FROM student_review_submissions s WHERE s.review_id = r.id) AS submission_count
    FROM student_reviews r
    WHERE r.id = ?
    LIMIT 1
");
$stmt->execute([$reviewId]);
$review = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$review) json_err('Review not found', 404);
if ((int)($review['submission_count'] ?? 0) > 0) json_err('Cannot delete a review after student submission');

try {
    $pdo->beginTransaction();
    $pdo->prepare("DELETE FROM student_review_manual_scores WHERE submission_id IN (SELECT id FROM (SELECT id FROM student_review_submissions WHERE review_id = ?) x)")->execute([$reviewId]);
    $pdo->prepare("DELETE FROM student_review_submissions WHERE review_id = ?")->execute([$reviewId]);
    $pdo->prepare("DELETE FROM student_reviews WHERE id = ?")->execute([$reviewId]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Delete failed: ' . $e->getMessage());
}

json_ok();
