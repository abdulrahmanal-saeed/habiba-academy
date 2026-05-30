<?php
// api/mobile/auth.php — Bearer token middleware for mobile API
// Include this at the top of every /api/mobile/ endpoint
// Usage: require_once __DIR__ . '/auth.php';
declare(strict_types=1);

if (!isset($pdo)) {
    require_once __DIR__ . '/../../config/db.php';
}
require_once __DIR__ . '/../../lib/helpers.php';

// Auto-create tokens table on first use
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS mobile_api_tokens (
        id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        token      VARCHAR(64)  NOT NULL UNIQUE,
        label      VARCHAR(100) NOT NULL DEFAULT 'Mobile App',
        created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_used  DATETIME     NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Throwable $e) {}

// Extract Bearer token from Authorization header
$authHeader = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if ($authHeader === '') {
    // Also accept X-Mobile-Token header (some proxies strip Authorization)
    $authHeader = 'Bearer ' . (string)($_SERVER['HTTP_X_MOBILE_TOKEN'] ?? '');
}
$mobileToken = trim(str_replace('Bearer ', '', $authHeader));

if ($mobileToken === '') {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'No token provided']);
    exit;
}

try {
    $chk = $pdo->prepare("SELECT id FROM mobile_api_tokens WHERE token = ? LIMIT 1");
    $chk->execute([$mobileToken]);
    if (!$chk->fetch()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Invalid token']);
        exit;
    }
    $pdo->prepare("UPDATE mobile_api_tokens SET last_used = NOW() WHERE token = ?")
        ->execute([$mobileToken]);
} catch (Throwable $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Auth service unavailable']);
    exit;
}
// Token is valid — execution continues in the calling file
