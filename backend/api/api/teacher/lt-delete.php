<?php
// api/teacher/lt-delete.php — Delete a level test question variant
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/leveltest_db.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (!isset($_SESSION['teacher_logged'])) json_err('Unauthorized', 401);
csrf_validate();

$id = (int)($_POST['id'] ?? 0);
if ($id < 1) json_err('id required');

$q = lt_get_question($pdo, $id);
if (!$q) json_err('Question not found');

$blockId    = (int)$q['block_id'];
$itemNumber = (int)$q['item_number'];

// Count total (including inactive) variants for this slot
$totalStmt = $pdo->prepare("
    SELECT COUNT(*) FROM lt_questions
    WHERE block_id = ? AND item_number = ?
");
$totalStmt->execute([$blockId, $itemNumber]);
$total = (int)$totalStmt->fetchColumn();

if ($total <= 1) {
    // Last variant — hard delete the whole slot
    $pdo->prepare("DELETE FROM lt_questions WHERE id = ?")->execute([$id]);
} else {
    // Other variants exist — just delete this one
    $pdo->prepare("DELETE FROM lt_questions WHERE id = ?")->execute([$id]);

    // Re-number remaining variants sequentially to keep them clean
    $remaining = $pdo->prepare("
        SELECT id FROM lt_questions
        WHERE block_id = ? AND item_number = ?
        ORDER BY variant ASC, id ASC
    ");
    $remaining->execute([$blockId, $itemNumber]);
    $rows = $remaining->fetchAll(PDO::FETCH_COLUMN);
    $upd  = $pdo->prepare("UPDATE lt_questions SET variant = ? WHERE id = ?");
    foreach ($rows as $idx => $rid) {
        $upd->execute([$idx + 1, $rid]);
    }
}

json_ok(['deleted' => $id]);
