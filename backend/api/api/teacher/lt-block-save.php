<?php
// api/teacher/lt-block-save.php — Update level test block metadata
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/leveltest_db.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (!isset($_SESSION['teacher_logged'])) json_err('Unauthorized', 401);
csrf_validate();

$id        = (int)($_POST['id'] ?? 0);
$section   = trim((string)($_POST['section'] ?? ''));
$cefrLevel = trim((string)($_POST['cefr_level'] ?? ''));

if (!in_array($section, ['listening','reading'], true)) json_err('Invalid section');
if (!in_array($cefrLevel, ['A1','A2','B1','B2','C1','C2'], true)) json_err('Invalid CEFR level');

lt_ensure_db_tables($pdo);

if ($id > 0) {
    $blk = lt_get_block($pdo, $id);
    if (!$blk) json_err('Block not found');
    $section = (string)$blk['section'];
}

if ($section === 'listening') {
    $audioPath = trim((string)($_POST['audio_path'] ?? ''));
    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE lt_blocks SET audio_path = ?, cefr_level = ? WHERE id = ?");
        $stmt->execute([$audioPath, $cefrLevel, $id]);
    } else {
        $next = (int)$pdo->query("SELECT COALESCE(MAX(block_number), 0) + 1 FROM lt_blocks WHERE section = 'listening'")->fetchColumn();
        $stmt = $pdo->prepare("
            INSERT INTO lt_blocks (section, block_number, audio_path, cefr_level, sort_order, is_active)
            VALUES ('listening', ?, ?, ?, ?, 1)
        ");
        $stmt->execute([$next, $audioPath, $cefrLevel, $next]);
        $id = (int)$pdo->lastInsertId();
    }
} else {
    $passageAr = trim((string)($_POST['passage_ar'] ?? ''));
    $passageEn = trim((string)($_POST['passage_en'] ?? ''));
    if ($passageAr === '') json_err('Arabic passage text is required');
    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE lt_blocks SET passage_ar = ?, passage_en = ?, cefr_level = ? WHERE id = ?");
        $stmt->execute([$passageAr, $passageEn, $cefrLevel, $id]);
    } else {
        $next = (int)$pdo->query("SELECT COALESCE(MAX(block_number), 0) + 1 FROM lt_blocks WHERE section = 'reading'")->fetchColumn();
        $stmt = $pdo->prepare("
            INSERT INTO lt_blocks (section, block_number, passage_ar, passage_en, cefr_level, sort_order, is_active)
            VALUES ('reading', ?, ?, ?, ?, ?, 1)
        ");
        $stmt->execute([$next, $passageAr, $passageEn, $cefrLevel, $next]);
        $id = (int)$pdo->lastInsertId();
    }
}

json_ok(['id' => $id, 'action' => $id > 0 ? 'saved' : 'created']);
