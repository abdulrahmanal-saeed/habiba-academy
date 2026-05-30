<?php
// lib/env.php — Simple .env file loader
declare(strict_types=1);

function load_env(string $path): void {
    if (!is_file($path)) return;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        $pos = strpos($line, '=');
        if ($pos === false) continue;
        $key = trim(substr($line, 0, $pos));
        $val = trim(substr($line, $pos + 1));
        // Strip optional surrounding quotes
        if (strlen($val) >= 2 && (($val[0] === '"' && str_ends_with($val, '"')) || ($val[0] === "'" && str_ends_with($val, "'")))) {
            $val = substr($val, 1, -1);
        }
        putenv("{$key}={$val}");
        $_ENV[$key] = $val;
    }
}

$projectRoot = dirname(__DIR__);

// Load the web-root file first for legacy deployments, then allow the safer
// external file (one directory above public_html) or APP_ENV_FILE to override.
$envCandidates = array_values(array_filter([
    $projectRoot . '/.env',
    dirname($projectRoot) . '/.env',
    getenv('APP_ENV_FILE') ?: null,
]));

foreach (array_unique($envCandidates) as $envPath) {
    if (is_file($envPath)) {
        load_env($envPath);
    }
}
