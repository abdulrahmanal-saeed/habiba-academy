<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/settings.php';
require_once __DIR__ . '/../lib/leveltest_db.php';

lt_ensure_db_tables($pdo);

$output = [
    'writing_total' => (int)$pdo->query("SELECT COUNT(*) FROM lt_writing_prompts")->fetchColumn(),
    'speaking_total' => (int)$pdo->query("SELECT COUNT(*) FROM lt_speaking_prompts")->fetchColumn(),
    'writing_by_type' => $pdo->query("
        SELECT task_type, cefr_level, COUNT(*) AS total
        FROM lt_writing_prompts
        GROUP BY task_type, cefr_level
        ORDER BY task_type, cefr_level
    ")->fetchAll(PDO::FETCH_ASSOC),
    'speaking_by_phase' => $pdo->query("
        SELECT phase, COUNT(*) AS total
        FROM lt_speaking_prompts
        GROUP BY phase
        ORDER BY phase
    ")->fetchAll(PDO::FETCH_ASSOC),
    'sample_writing_prompt_ids' => lt_build_writing_prompts($pdo, 'B2')['prompt_ids'],
    'sample_speaking_prompt_ids' => lt_build_speaking_prompts($pdo)['prompt_ids'],
];

echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
