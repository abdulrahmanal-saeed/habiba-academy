<?php
// api/teacher/review-delete.php — Force-delete a review + cascade audio files
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);
csrf_validate();

$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) json_err('Invalid ID');

$stmt = $pdo->prepare("SELECT id FROM student_reviews WHERE id = ?");
$stmt->execute([$id]);
if (!$stmt->fetch()) json_err('Review not found');

try {
    $pdo->beginTransaction();

    // Delete submission audio files
    $recs = $pdo->prepare("
        SELECT rsa.audio_path
        FROM review_speaking_answers rsa
        JOIN student_review_submissions srs ON srs.id = rsa.submission_id
        WHERE srs.review_id = ?
    ");
    $recs->execute([$id]);
    foreach ($recs->fetchAll(PDO::FETCH_COLUMN) as $path) {
        if ($path) {
            $full = __DIR__ . '/../../' . ltrim($path, '/');
            if (is_file($full)) @unlink($full);
        }
    }

    $subs = $pdo->prepare("SELECT id FROM student_review_submissions WHERE review_id = ?");
    $subs->execute([$id]);
    $subIds = $subs->fetchAll(PDO::FETCH_COLUMN);

    if ($subIds) {
        $in = implode(',', array_map('intval', $subIds));
        foreach (['student_review_manual_scores', 'student_review_section_overrides',
                  'review_mcq_answers', 'review_writing_answers', 'review_speaking_answers'] as $tbl) {
            try { $pdo->exec("DELETE FROM $tbl WHERE submission_id IN ($in)"); } catch (Throwable) {}
        }
    }

    $pdo->prepare("DELETE FROM student_review_submissions WHERE review_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM student_reviews WHERE id = ?")->execute([$id]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Delete failed: ' . $e->getMessage());
}

json_ok();
