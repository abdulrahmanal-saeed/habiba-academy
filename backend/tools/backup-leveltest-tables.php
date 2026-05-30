<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$out = $argv[1] ?? '';
if ($out === '') {
    $out = __DIR__ . '/../backups/leveltest_db_before_import_' . date('Ymd_His') . '.json';
}

$dir = dirname($out);
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}

$tables = ['lt_blocks', 'lt_questions', 'site_settings'];
$backup = [];
foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SELECT * FROM `{$table}`");
        $backup[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        $backup[$table] = ['__error' => $e->getMessage()];
    }
}

file_put_contents($out, json_encode($backup, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
echo $out . PHP_EOL;
