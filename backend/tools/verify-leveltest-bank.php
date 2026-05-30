<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/settings.php';
require_once __DIR__ . '/../lib/leveltest_db.php';

lt_ensure_db_tables($pdo);

$report = [];
foreach (['listening', 'reading'] as $section) {
    $stmt = $pdo->prepare("
        SELECT cefr_level, COUNT(*) AS total, SUM(is_active = 1) AS active
        FROM lt_blocks
        WHERE section = ?
          AND import_key IS NOT NULL
        GROUP BY cefr_level
        ORDER BY cefr_level
    ");
    $stmt->execute([$section]);
    $report[$section . '_levels'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

$listening = lt_build_test_section($pdo, 'listening');
$reading = lt_build_test_section($pdo, 'reading');
$report['generator'] = [
    'listening_blocks' => count($listening['blocks']),
    'listening_questions' => count($listening['question_ids']),
    'reading_blocks' => count($reading['blocks']),
    'reading_questions' => count($reading['question_ids']),
];

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
