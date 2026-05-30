<?php
// config/db.php — Database connection (PDO)
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/env.php';
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/settings.php';
require_once __DIR__ . '/../../lib/lib/public-content.php';
require_once __DIR__ . '/../../lib/lib/notify.php';

$appTimezone = trim((string)(getenv('APP_TIMEZONE') ?: 'Asia/Dubai'));
if ($appTimezone === '') {
    $appTimezone = 'Asia/Dubai';
}
@date_default_timezone_set($appTimezone);

define('DB_HOST',    getenv('DB_HOST')    ?: 'localhost');
define('DB_NAME',    getenv('DB_NAME')    ?: '');
define('DB_USER',    getenv('DB_USER')    ?: '');
define('DB_PASS',    getenv('DB_PASS')    ?: '');
define('DB_CHARSET', 'utf8mb4');

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    try {
        $tzObj = new DateTimeZone($appTimezone);
        $now = new DateTimeImmutable('now', $tzObj);
        $offset = $now->format('P');
        $pdo->exec("SET time_zone = " . $pdo->quote($offset));
    } catch (Throwable $ignored) {
        // Keep DB connection working even if timezone initialization fails.
    }

    try {
        ensure_feature_flag_settings($pdo);
    } catch (Throwable $ignored) {
        // Settings bootstrap should never block page loads.
    }

    try {
        process_scheduled_publication_emails($pdo, 8);
    } catch (Throwable $ignored) {
        // Never block page loads if background email scheduling fails.
    }
} catch (PDOException $e) {
    // Never expose DB details in production
    http_response_code(503);
    die(json_encode(['ok' => false, 'error' => 'Database unavailable']));
}
