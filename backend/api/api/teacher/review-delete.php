<?php
// api/teacher/review-delete.php — Delete a student review and its submission data
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
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

    // Delete submission-related rows
    $subs = $pdo->prepare("SELECT id FROM student_review_submissions WHERE review_id = ?");
    $subs->execute([$id]);
    $subIds = $subs->fetchAll(PDO::FETCH_COLUMN);

    if ($subIds) {
        $in = implode(',', array_map('intval', $subIds));
        foreach (['review_mcq_answers','review_writing_answers','review_speaking_answers'] as $tbl) {
            try { $pdo->exec("DELETE FROM $tbl WHERE submission_id IN ($in)"); } catch (Throwable $e) {}
        }
    }

    $pdo->prepare("DELETE FROM student_review_submissions WHERE review_id = ?")->execute([$id]);

    // Delete review questions
    foreach (['review_mcq_questions','review_writing_questions','review_speaking_questions',
              'review_reading_sections','review_listening_sections'] as $tbl) {
        try { $pdo->prepare("DELETE FROM $tbl WHERE review_id = ?")->execute([$id]); } catch (Throwable $e) {}
    }

    $pdo->prepare("DELETE FROM student_reviews WHERE id = ?")->execute([$id]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Delete failed: ' . $e->getMessage());
}

json_ok();
