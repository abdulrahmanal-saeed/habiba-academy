<?php
// api/mobile/token-generate.php — Generate a mobile API token (teacher-only)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

if (empty($_SESSION['teacher_logged'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Not authenticated']);
    exit;
}

csrf_validate();

// Auto-create tokens table
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS mobile_api_tokens (
        id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        token      VARCHAR(64)  NOT NULL UNIQUE,
        label      VARCHAR(100) NOT NULL DEFAULT 'Mobile App',
        created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_used  DATETIME     NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Throwable $e) {}

$label = trim((string)($_POST['label'] ?? 'Mobile App'));
if ($label === '') $label = 'Mobile App';

// Generate a secure random token
$token = bin2hex(random_bytes(32)); // 64 hex chars

// Revoke all existing tokens (one active token at a time)
$pdo->exec("DELETE FROM mobile_api_tokens");

$pdo->prepare("INSERT INTO mobile_api_tokens (token, label) VALUES (?, ?)")
    ->execute([$token, $label]);

echo json_encode([
    'ok'    => true,
    'token' => $token,
    'label' => $label,
]);
