<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$jsonPath = $argv[1] ?? '';
if ($jsonPath === '' || !is_file($jsonPath)) {
    fwrite(STDERR, "Usage: php tools/import-leveltest-bank.php <bank-json>\n");
    exit(1);
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/settings.php';
require_once __DIR__ . '/../lib/leveltest_db.php';

lt_ensure_db_tables($pdo);

function import_column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    ");
    $stmt->execute([$table, $column]);
    return (int)$stmt->fetchColumn() > 0;
}

function import_index_exists(PDO $pdo, string $table, string $index): bool
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
    ");
    $stmt->execute([$table, $index]);
    return (int)$stmt->fetchColumn() > 0;
}

if (!import_column_exists($pdo, 'lt_blocks', 'import_key')) {
    $pdo->exec("ALTER TABLE lt_blocks ADD COLUMN import_key VARCHAR(190) NULL AFTER id");
}
if (!import_column_exists($pdo, 'lt_blocks', 'import_title')) {
    $pdo->exec("ALTER TABLE lt_blocks ADD COLUMN import_title VARCHAR(255) NULL AFTER import_key");
}
if (!import_column_exists($pdo, 'lt_blocks', 'dialect_style')) {
    $pdo->exec("ALTER TABLE lt_blocks ADD COLUMN dialect_style VARCHAR(100) NULL AFTER import_title");
}
if (!import_column_exists($pdo, 'lt_blocks', 'topic')) {
    $pdo->exec("ALTER TABLE lt_blocks ADD COLUMN topic VARCHAR(255) NULL AFTER dialect_style");
}
if (!import_index_exists($pdo, 'lt_blocks', 'uq_lt_blocks_import_key')) {
    $pdo->exec("ALTER TABLE lt_blocks ADD UNIQUE KEY uq_lt_blocks_import_key (import_key)");
}

$payload = json_decode((string)file_get_contents($jsonPath), true);
if (!is_array($payload)) {
    fwrite(STDERR, "Invalid JSON.\n");
    exit(1);
}

$pdo->beginTransaction();
$counts = [
    'listening_blocks' => 0,
    'listening_questions' => 0,
    'reading_blocks' => 0,
    'reading_questions' => 0,
    'writing_prompts' => 0,
    'speaking_prompts' => 0,
    'settings' => 0,
];

try {
    $findBlock = $pdo->prepare("SELECT id FROM lt_blocks WHERE import_key = ? LIMIT 1");
    $nextBlockNumber = $pdo->prepare("SELECT COALESCE(MAX(block_number), 0) + 1 FROM lt_blocks WHERE section = ?");
    $insertBlock = $pdo->prepare("
        INSERT INTO lt_blocks
            (import_key, import_title, dialect_style, topic, section, block_number, audio_path, passage_ar, passage_en, cefr_level, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, 1)
    ");
    $updateBlock = $pdo->prepare("
        UPDATE lt_blocks
        SET import_title = ?,
            dialect_style = ?,
            topic = ?,
            audio_path = ?,
            passage_ar = ?,
            cefr_level = ?,
            is_active = 1
        WHERE id = ?
    ");
    $findQuestion = $pdo->prepare("
        SELECT id FROM lt_questions
        WHERE block_id = ? AND item_number = ? AND variant = 1
        LIMIT 1
    ");
    $insertQuestion = $pdo->prepare("
        INSERT INTO lt_questions
            (block_id, item_number, variant, question_ar, question_en, opt_a_ar, opt_a_en, opt_b_ar, opt_b_en, opt_c_ar, opt_c_en, opt_d_ar, opt_d_en, correct_opt, is_active)
        VALUES (?, ?, 1, ?, '', ?, '', ?, '', ?, '', ?, '', ?, 1)
    ");
    $updateQuestion = $pdo->prepare("
        UPDATE lt_questions
        SET question_ar = ?,
            opt_a_ar = ?,
            opt_b_ar = ?,
            opt_c_ar = ?,
            opt_d_ar = ?,
            correct_opt = ?,
            is_active = 1
        WHERE id = ?
    ");

    foreach (['listening', 'reading'] as $section) {
        foreach (($payload[$section] ?? []) as $block) {
            if (!is_array($block) || empty($block['import_key'])) {
                continue;
            }
            $findBlock->execute([(string)$block['import_key']]);
            $blockId = (int)$findBlock->fetchColumn();
            $isActive = 1;
            $audioPath = $section === 'listening'
                ? 'assets/audio/leveltest/' . basename((string)($block['audio_file'] ?? ''))
                : '';
            if ($section === 'listening' && empty($block['audio_exists'])) {
                $isActive = 0;
            }
            if ($blockId > 0) {
                $updateBlock->execute([
                    (string)($block['title'] ?? ''),
                    (string)($block['dialect'] ?? ''),
                    (string)($block['topic'] ?? ''),
                    $audioPath,
                    (string)($block['text'] ?? ''),
                    strtoupper((string)($block['level'] ?? 'A2')),
                    $blockId,
                ]);
                $pdo->prepare("UPDATE lt_blocks SET is_active = ? WHERE id = ?")->execute([$isActive, $blockId]);
            } else {
                $nextBlockNumber->execute([$section]);
                $blockNumber = (int)$nextBlockNumber->fetchColumn();
                $insertBlock->execute([
                    (string)$block['import_key'],
                    (string)($block['title'] ?? ''),
                    (string)($block['dialect'] ?? ''),
                    (string)($block['topic'] ?? ''),
                    $section,
                    $blockNumber,
                    $audioPath,
                    (string)($block['text'] ?? ''),
                    strtoupper((string)($block['level'] ?? 'A2')),
                    $blockNumber,
                ]);
                $blockId = (int)$pdo->lastInsertId();
                $pdo->prepare("UPDATE lt_blocks SET is_active = ? WHERE id = ?")->execute([$isActive, $blockId]);
            }

            $counts[$section . '_blocks']++;
            foreach (($block['questions'] ?? []) as $idx => $q) {
                if (!is_array($q)) {
                    continue;
                }
                $itemNumber = (int)($q['number'] ?? ($idx + 1));
                $options = $q['options'] ?? [];
                $correct = strtoupper((string)($q['correct'] ?? 'A'));
                if (!in_array($correct, ['A','B','C','D'], true)) {
                    $correct = 'A';
                }
                $findQuestion->execute([$blockId, $itemNumber]);
                $questionId = (int)$findQuestion->fetchColumn();
                if ($questionId > 0) {
                    $updateQuestion->execute([
                        (string)($q['question'] ?? ''),
                        (string)($options['A'] ?? ''),
                        (string)($options['B'] ?? ''),
                        (string)($options['C'] ?? ''),
                        (string)($options['D'] ?? ''),
                        $correct,
                        $questionId,
                    ]);
                } else {
                    $insertQuestion->execute([
                        $blockId,
                        $itemNumber,
                        (string)($q['question'] ?? ''),
                        (string)($options['A'] ?? ''),
                        (string)($options['B'] ?? ''),
                        (string)($options['C'] ?? ''),
                        (string)($options['D'] ?? ''),
                        $correct,
                    ]);
                }
                $counts[$section . '_questions']++;
            }
        }
    }

    if (!empty($payload['writing_raw'])) {
        update_setting('lt_writing_bank_raw', (string)$payload['writing_raw']);
        $counts['settings']++;
    }
    if (!empty($payload['speaking_raw'])) {
        update_setting('lt_speaking_bank_raw', (string)$payload['speaking_raw']);
        $counts['settings']++;
    }

    $upsertWriting = $pdo->prepare("
        INSERT INTO lt_writing_prompts
            (import_key, task_type, cefr_level, title, prompt_text, instructions, diagnostic_notes, word_range, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            task_type = VALUES(task_type),
            cefr_level = VALUES(cefr_level),
            title = VALUES(title),
            prompt_text = VALUES(prompt_text),
            instructions = VALUES(instructions),
            diagnostic_notes = VALUES(diagnostic_notes),
            word_range = VALUES(word_range),
            is_active = VALUES(is_active)
    ");
    foreach (($payload['writing'] ?? []) as $prompt) {
        if (!is_array($prompt) || empty($prompt['import_key']) || empty($prompt['prompt_text'])) {
            continue;
        }
        $taskType = in_array(($prompt['task_type'] ?? ''), ['task1', 'task2'], true) ? (string)$prompt['task_type'] : 'task1';
        $level = strtoupper((string)($prompt['cefr_level'] ?? 'ALL'));
        if (!in_array($level, ['ALL', 'A2', 'B1', 'B2', 'C1', 'C2'], true)) {
            $level = 'ALL';
        }
        $upsertWriting->execute([
            (string)$prompt['import_key'],
            $taskType,
            $level,
            (string)($prompt['title'] ?? ''),
            (string)$prompt['prompt_text'],
            (string)($prompt['instructions'] ?? ''),
            (string)($prompt['diagnostic_notes'] ?? ''),
            (string)($prompt['word_range'] ?? ''),
            !empty($prompt['is_active']) ? 1 : 0,
        ]);
        $counts['writing_prompts']++;
    }

    $upsertSpeaking = $pdo->prepare("
        INSERT INTO lt_speaking_prompts
            (import_key, phase, target_level, title, prompt_text, bullets, image_path, evaluation_notes, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            phase = VALUES(phase),
            target_level = VALUES(target_level),
            title = VALUES(title),
            prompt_text = VALUES(prompt_text),
            bullets = VALUES(bullets),
            image_path = VALUES(image_path),
            evaluation_notes = VALUES(evaluation_notes),
            sort_order = VALUES(sort_order),
            is_active = VALUES(is_active)
    ");
    foreach (($payload['speaking'] ?? []) as $prompt) {
        if (!is_array($prompt) || empty($prompt['import_key']) || empty($prompt['prompt_text'])) {
            continue;
        }
        $phase = (string)($prompt['phase'] ?? 'warmup');
        if (!in_array($phase, ['warmup', 'description', 'discussion', 'abstract'], true)) {
            $phase = 'warmup';
        }
        $bullets = $prompt['bullets'] ?? [];
        if (!is_array($bullets)) {
            $bullets = [];
        }
        $upsertSpeaking->execute([
            (string)$prompt['import_key'],
            $phase,
            (string)($prompt['target_level'] ?? ''),
            (string)($prompt['title'] ?? ''),
            (string)$prompt['prompt_text'],
            json_encode(array_values($bullets), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            (string)($prompt['image_path'] ?? ''),
            (string)($prompt['evaluation_notes'] ?? ''),
            (int)($prompt['sort_order'] ?? 0),
            !empty($prompt['is_active']) ? 1 : 0,
        ]);
        $counts['speaking_prompts']++;
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    fwrite(STDERR, "Import failed: " . $e->getMessage() . "\n");
    exit(1);
}

echo json_encode(['ok' => true, 'counts' => $counts], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
