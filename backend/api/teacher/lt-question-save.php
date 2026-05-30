<?php
// api/teacher/lt-question-save.php — Create or update a level test question/variant
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/leveltest_db.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (!isset($_SESSION['teacher_logged'])) json_err('Unauthorized', 401);
csrf_validate();

lt_ensure_db_tables($pdo);

$id         = (int)($_POST['id'] ?? 0);
$blockId    = (int)($_POST['block_id'] ?? 0);
$itemNumber = (int)($_POST['item_number'] ?? 0);

if ($blockId < 1)    json_err('block_id required');
if ($itemNumber < 1) json_err('item_number required');

$blk = lt_get_block($pdo, $blockId);
if (!$blk) json_err('Block not found');

$questionAr = trim((string)($_POST['question_ar'] ?? ''));
$questionEn = trim((string)($_POST['question_en'] ?? ''));
$optAar     = trim((string)($_POST['opt_a_ar'] ?? ''));
$optAen     = trim((string)($_POST['opt_a_en'] ?? ''));
$optBar     = trim((string)($_POST['opt_b_ar'] ?? ''));
$optBen     = trim((string)($_POST['opt_b_en'] ?? ''));
$optCar     = trim((string)($_POST['opt_c_ar'] ?? ''));
$optCen     = trim((string)($_POST['opt_c_en'] ?? ''));
$optDar     = trim((string)($_POST['opt_d_ar'] ?? ''));
$optDen     = trim((string)($_POST['opt_d_en'] ?? ''));
$correctOpt = strtoupper(trim((string)($_POST['correct_opt'] ?? '')));
$isActive   = isset($_POST['is_active']) ? 1 : 0;

if ($questionAr === '') json_err('Arabic question text is required');
if ($optAar === '')     json_err('Option A (Arabic) is required');
if ($optBar === '')     json_err('Option B (Arabic) is required');
if ($optCar === '')     json_err('Option C (Arabic) is required');
if (!in_array($correctOpt, ['A', 'B', 'C', 'D'], true)) json_err('Valid correct option (A-D) is required');
if ($correctOpt === 'D' && $optDar === '') json_err('Option D text is required when D is the correct answer');

if ($id > 0) {
    $existing = lt_get_question($pdo, $id);
    if (!$existing)                          json_err('Question not found');
    if ((int)$existing['block_id'] !== $blockId) json_err('Block mismatch');

    $stmt = $pdo->prepare("
        UPDATE lt_questions SET
            item_number = ?,
            question_ar = ?,
            question_en = ?,
            opt_a_ar = ?, opt_a_en = ?,
            opt_b_ar = ?, opt_b_en = ?,
            opt_c_ar = ?, opt_c_en = ?,
            opt_d_ar = ?, opt_d_en = ?,
            correct_opt = ?,
            is_active   = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $itemNumber,
        $questionAr, $questionEn,
        $optAar, $optAen,
        $optBar, $optBen,
        $optCar, $optCen,
        $optDar, $optDen,
        $correctOpt,
        $isActive,
        $id,
    ]);
    json_ok(['id' => $id, 'action' => 'updated']);

} else {
    $variant = lt_next_variant($pdo, $blockId, $itemNumber);

    $stmt = $pdo->prepare("
        INSERT INTO lt_questions
          (block_id, item_number, variant, question_ar, question_en,
           opt_a_ar, opt_a_en, opt_b_ar, opt_b_en,
           opt_c_ar, opt_c_en, opt_d_ar, opt_d_en,
           correct_opt, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $blockId, $itemNumber, $variant,
        $questionAr, $questionEn,
        $optAar, $optAen,
        $optBar, $optBen,
        $optCar, $optCen,
        $optDar, $optDen,
        $correctOpt,
        $isActive,
    ]);
    $newId = (int)$pdo->lastInsertId();
    json_ok(['id' => $newId, 'variant' => $variant, 'action' => 'created']);
}
