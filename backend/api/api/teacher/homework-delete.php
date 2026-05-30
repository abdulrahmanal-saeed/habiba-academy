<?php
// api/teacher/homework-delete.php — Delete a homework and all related data
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))      json_err('Not authenticated', 401);
csrf_validate();

$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) json_err('Invalid ID');

// Verify homework exists
$stmt = $pdo->prepare("SELECT id FROM homeworks WHERE id = ?");
$stmt->execute([$id]);
if (!$stmt->fetch()) json_err('Homework not found');

try {
    $pdo->beginTransaction();

    // 1. Get submission IDs to delete answers
    $subs = $pdo->prepare("SELECT id FROM homework_submissions WHERE homework_id = ?");
    $subs->execute([$id]);
    $subIds = $subs->fetchAll(PDO::FETCH_COLUMN);

    if ($subIds) {
        $in = implode(',', array_map('intval', $subIds));
        $pdo->exec("DELETE FROM homework_mcq_answers     WHERE submission_id IN ($in)");
        $pdo->exec("DELETE FROM homework_writing_answers WHERE submission_id IN ($in)");
    }

    // 2. Delete speaking recordings (and their audio files)
    $recs = $pdo->prepare("SELECT audio_path FROM homework_speaking_recordings WHERE homework_id = ?");
    $recs->execute([$id]);
    foreach ($recs->fetchAll(PDO::FETCH_COLUMN) as $path) {
        if ($path) {
            $full = __DIR__ . '/../../' . ltrim($path, '/');
            if (is_file($full)) @unlink($full);
        }
    }
    $pdo->prepare("DELETE FROM homework_speaking_recordings WHERE homework_id = ?")->execute([$id]);

    // 3. Delete questions
    $pdo->prepare("DELETE FROM homework_mcq_questions      WHERE homework_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM homework_writing_questions  WHERE homework_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM homework_speaking_questions WHERE homework_id = ?")->execute([$id]);

    // 4. Delete submissions
    $pdo->prepare("DELETE FROM homework_submissions WHERE homework_id = ?")->execute([$id]);

    // 5. Delete homework itself
    $pdo->prepare("DELETE FROM homeworks WHERE id = ?")->execute([$id]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Delete failed: ' . $e->getMessage());
}

json_ok();
