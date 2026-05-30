<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$source = $argv[1] ?? getenv('LEVEL_TEST_SOURCE_DIR') ?: '';
if ($source === '' || !is_dir($source)) {
    fwrite(STDERR, "Usage: php tools/leveltest-source-audit.php <source-dir>\n");
    exit(1);
}

$levels = ['a2', 'b1', 'b2', 'c1', 'c2'];
$requiredTextFiles = [
    'Reading A2 .txt',
    'Reading B1.txt',
    'Reading B2.txt',
    'Reading C1.txt',
    'Reading C2.txt',
    'Speaking Section.odt',
    'Writing Section.odt',
];

$report = [
    'source' => realpath($source) ?: $source,
    'text_files' => [],
    'audio' => [],
    'warnings' => [],
];

foreach ($requiredTextFiles as $file) {
    $path = rtrim($source, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $file;
    $report['text_files'][$file] = is_file($path) ? filesize($path) : null;
    if (!is_file($path)) {
        $report['warnings'][] = "Missing text file: {$file}";
    }
}

foreach ($levels as $level) {
    $dir = rtrim($source, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $level;
    $files = is_dir($dir) ? glob($dir . DIRECTORY_SEPARATOR . $level . '_*.mp3') ?: [] : [];
    natsort($files);
    $names = array_map('basename', $files);
    $report['audio'][$level] = [
        'count' => count($names),
        'files' => array_values($names),
    ];
    if ($level === 'a2' && in_array('a2_10.mp3', $names, true)) {
        $report['warnings'][] = 'A2 includes a2_10.mp3. The current requirement says A2 should not require it.';
    }
    if (count($names) < 2) {
        $report['warnings'][] = strtoupper($level) . ' has fewer than 2 audio files.';
    }
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
