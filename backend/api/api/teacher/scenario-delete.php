<?php
// api/teacher/scenario-delete.php — Delete a scenario and all its recordings
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);
csrf_validate();

$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) json_err('Invalid ID');

$stmt = $pdo->prepare("SELECT id FROM scenarios WHERE id = ?");
$stmt->execute([$id]);
if (!$stmt->fetch()) json_err('Scenario not found');

try {
    $pdo->beginTransaction();

    // Delete audio files for recordings
    $recs = $pdo->prepare("SELECT audio_path FROM scenario_recordings WHERE scenario_id = ?");
    $recs->execute([$id]);
    foreach ($recs->fetchAll(PDO::FETCH_COLUMN) as $path) {
        if ($path) {
            $full = __DIR__ . '/../../' . ltrim($path, '/');
            if (is_file($full)) @unlink($full);
        }
    }

    $pdo->prepare("DELETE FROM scenario_recordings WHERE scenario_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM scenario_keywords   WHERE scenario_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM scenarios           WHERE id = ?")->execute([$id]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Delete failed: ' . $e->getMessage());
}

json_ok();
