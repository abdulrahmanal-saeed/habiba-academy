<?php
// api/teacher/lt-prompt-save.php — Save level test writing / speaking prompts to site_settings
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/settings.php';
require_once __DIR__ . '/../../lib/leveltest_db.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$type = trim((string)($_POST['type'] ?? ''));

lt_ensure_db_tables($pdo);

if ($type === 'writing_bank') {
    $id = (int)($_POST['id'] ?? 0);
    $taskType = trim((string)($_POST['task_type'] ?? 'task1'));
    $level = strtoupper(trim((string)($_POST['cefr_level'] ?? 'ALL')));
    $title = trim((string)($_POST['title'] ?? ''));
    $promptText = trim((string)($_POST['prompt_text'] ?? ''));
    $diagnosticNotes = trim((string)($_POST['diagnostic_notes'] ?? ''));
    $wordRange = trim((string)($_POST['word_range'] ?? ''));
    $isActive = isset($_POST['is_active']) ? 1 : 0;

    if (!in_array($taskType, ['task1', 'task2'], true)) json_err('Invalid task type');
    if (!in_array($level, ['ALL', 'A2', 'B1', 'B2', 'C1', 'C2'], true)) json_err('Invalid level');
    if ($taskType === 'task1') $level = 'ALL';
    if ($title === '') json_err('Title is required');
    if ($promptText === '') json_err('Prompt text is required');

    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE lt_writing_prompts SET task_type=?, cefr_level=?, title=?, prompt_text=?, diagnostic_notes=?, word_range=?, is_active=? WHERE id=?");
        $stmt->execute([$taskType, $level, $title, $promptText, $diagnosticNotes, $wordRange, $isActive, $id]);
    } else {
        $importKey = 'custom-writing-' . bin2hex(random_bytes(6));
        $stmt = $pdo->prepare("INSERT INTO lt_writing_prompts (import_key, task_type, cefr_level, title, prompt_text, diagnostic_notes, word_range, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$importKey, $taskType, $level, $title, $promptText, $diagnosticNotes, $wordRange, $isActive]);
        $id = (int)$pdo->lastInsertId();
    }
    json_ok(['id' => $id, 'saved' => 'writing_bank']);
}

if ($type === 'speaking_bank') {
    $id = (int)($_POST['id'] ?? 0);
    $phase = trim((string)($_POST['phase'] ?? 'warmup'));
    $targetLevel = trim((string)($_POST['target_level'] ?? ''));
    $title = trim((string)($_POST['title'] ?? ''));
    $promptText = trim((string)($_POST['prompt_text'] ?? ''));
    $imagePath = trim((string)($_POST['image_path'] ?? ''));
    $evaluationNotes = trim((string)($_POST['evaluation_notes'] ?? ''));
    $sortOrder = (int)($_POST['sort_order'] ?? 0);
    $isActive = isset($_POST['is_active']) ? 1 : 0;

    if (!in_array($phase, ['warmup', 'description', 'discussion', 'abstract'], true)) json_err('Invalid phase');
    if ($title === '') json_err('Title is required');
    if ($promptText === '') json_err('Prompt text is required');

    $bullets = array_values(array_filter(array_map('trim', preg_split('/\R/u', $promptText)), 'strlen'));
    $bulletsJson = json_encode($bullets, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE lt_speaking_prompts SET phase=?, target_level=?, title=?, prompt_text=?, bullets=?, image_path=?, evaluation_notes=?, sort_order=?, is_active=? WHERE id=?");
        $stmt->execute([$phase, $targetLevel, $title, $promptText, $bulletsJson, $imagePath, $evaluationNotes, $sortOrder, $isActive, $id]);
    } else {
        $importKey = 'custom-speaking-' . bin2hex(random_bytes(6));
        $stmt = $pdo->prepare("INSERT INTO lt_speaking_prompts (import_key, phase, target_level, title, prompt_text, bullets, image_path, evaluation_notes, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$importKey, $phase, $targetLevel, $title, $promptText, $bulletsJson, $imagePath, $evaluationNotes, $sortOrder, $isActive]);
        $id = (int)$pdo->lastInsertId();
    }
    json_ok(['id' => $id, 'saved' => 'speaking_bank']);
}


// ── Writing prompts ──────────────────────────────────────────────────────────
if ($type === 'writing') {
    $key   = trim((string)($_POST['setting_key'] ?? ''));
    $value = trim((string)($_POST['value'] ?? ''));

    // Allowed keys for writing prompts
    $allowedWritingKeys = ['lt_wt1'];
    foreach (['a1','a2','b1','b2','c1','c2'] as $l) {
        $allowedWritingKeys[] = 'lt_wt2_' . $l;
    }

    if (!in_array($key, $allowedWritingKeys, true)) {
        json_err('Invalid setting key: ' . $key);
    }

    update_setting($key, $value);
    json_ok(['saved' => $key]);
}

// ── Speaking prompts ─────────────────────────────────────────────────────────
if ($type === 'speaking') {
    $n     = (int)($_POST['prompt_num'] ?? 0);
    $title = trim((string)($_POST['title'] ?? ''));
    $raw   = trim((string)($_POST['bullets'] ?? ''));

    if ($n < 1 || $n > 4) json_err('Invalid prompt number');

    // Normalise bullets: strip blank lines, trim each
    $bullets = implode("\n", array_filter(array_map('trim', explode("\n", $raw)), 'strlen'));

    update_setting('lt_sp' . $n . '_title',   $title);
    update_setting('lt_sp' . $n . '_bullets', $bullets);
    json_ok(['saved' => 'speaking_' . $n]);
}

// ── Unknown type ─────────────────────────────────────────────────────────────
if ($type === 'randomization') {
    $enabled = isset($_POST['lt_randomization_enabled']) ? '1' : '0';
    $listeningBlocks = (int)($_POST['lt_random_listening_blocks_per_level'] ?? 2);
    $readingBlocks = (int)($_POST['lt_random_reading_blocks_per_level'] ?? 1);

    $listeningBlocks = max(1, min(10, $listeningBlocks));
    $readingBlocks = max(1, min(10, $readingBlocks));

    update_setting('lt_randomization_enabled', $enabled);
    update_setting('lt_random_listening_blocks_per_level', (string)$listeningBlocks);
    update_setting('lt_random_reading_blocks_per_level', (string)$readingBlocks);

    json_ok([
        'saved' => 'randomization',
        'enabled' => $enabled,
        'listening_blocks_per_level' => $listeningBlocks,
        'reading_blocks_per_level' => $readingBlocks,
    ]);
}

json_err('Unknown type');
