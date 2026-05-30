<?php
// api/teacher/quick-block-save.php — Create or update a quick test block
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/quick_test_db.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))    json_err('Not authenticated', 401);
csrf_validate();

qt_ensure_tables($pdo);

$blockId   = (int)($_POST['block_id']   ?? 0);
$passageAr = trim((string)($_POST['passage_ar'] ?? ''));
$sortOrder = (int)($_POST['sort_order'] ?? 0);
$isActive  = (int)($_POST['is_active']  ?? 1);

$questionsRaw = json_decode((string)($_POST['questions'] ?? '[]'), true) ?: [];

if ($passageAr === '')      json_err('Passage text is required');
if (empty($questionsRaw))   json_err('At least one question is required');

$pdo->beginTransaction();
try {
    if ($blockId > 0) {
        $stmt = $pdo->prepare("SELECT id FROM lt_quick_blocks WHERE id = ?");
        $stmt->execute([$blockId]);
        if (!$stmt->fetch()) json_err('Block not found', 404);

        $pdo->prepare("
            UPDATE lt_quick_blocks SET passage_ar = ?, sort_order = ?, is_active = ? WHERE id = ?
        ")->execute([$passageAr, $sortOrder, $isActive, $blockId]);
    } else {
        $maxNum = (int)$pdo->query("SELECT COALESCE(MAX(block_number),0) FROM lt_quick_blocks")->fetchColumn();
        $pdo->prepare("
            INSERT INTO lt_quick_blocks (block_number, passage_ar, sort_order, is_active) VALUES (?, ?, ?, ?)
        ")->execute([$maxNum + 1, $passageAr, $sortOrder, $isActive]);
        $blockId = (int)$pdo->lastInsertId();
    }

    $pdo->prepare("DELETE FROM lt_quick_questions WHERE block_id = ?")->execute([$blockId]);

    $ins = $pdo->prepare("
        INSERT INTO lt_quick_questions (block_id, q_order, question_ar, opt_a, opt_b, opt_c, opt_d, correct_opt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    foreach ($questionsRaw as $i => $q) {
        $correct = strtoupper(trim((string)($q['correct_opt'] ?? 'A')));
        if (!in_array($correct, ['A', 'B', 'C', 'D'], true)) $correct = 'A';
        $ins->execute([
            $blockId, $i + 1,
            trim((string)($q['question_ar'] ?? '')),
            trim((string)($q['opt_a'] ?? '')),
            trim((string)($q['opt_b'] ?? '')),
            trim((string)($q['opt_c'] ?? '')) ?: null,
            trim((string)($q['opt_d'] ?? '')) ?: null,
            $correct,
        ]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Save failed: ' . $e->getMessage());
}

json_ok(['block_id' => $blockId]);
