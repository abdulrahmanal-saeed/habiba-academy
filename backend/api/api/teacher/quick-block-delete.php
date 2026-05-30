<?php
// api/teacher/quick-block-delete.php — Delete a quick test block and its questions
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/quick_test_db.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);
csrf_validate();

qt_ensure_tables($pdo);

$blockId = (int)($_POST['block_id'] ?? 0);
if ($blockId <= 0) json_err('Invalid block ID');

$stmt = $pdo->prepare("SELECT id FROM lt_quick_blocks WHERE id = ?");
$stmt->execute([$blockId]);
if (!$stmt->fetch()) json_err('Block not found', 404);

// Prevent deleting the last remaining block
$remaining = (int)$pdo->query("SELECT COUNT(*) FROM lt_quick_blocks")->fetchColumn();
if ($remaining <= 1) json_err('Cannot delete the last block — the test must have at least one block');

try {
    $pdo->beginTransaction();
    $pdo->prepare("DELETE FROM lt_quick_questions WHERE block_id = ?")->execute([$blockId]);
    $pdo->prepare("DELETE FROM lt_quick_blocks WHERE id = ?")->execute([$blockId]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Delete failed: ' . $e->getMessage());
}

json_ok();
