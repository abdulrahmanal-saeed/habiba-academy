<?php
// api/mobile/fcm-register.php - Register this device for Firebase Cloud Messaging.
declare(strict_types=1);
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/fcm.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$contentType = (string)($_SERVER['CONTENT_TYPE'] ?? '');
$body = str_contains($contentType, 'application/json')
    ? (array)(json_decode(file_get_contents('php://input'), true) ?? [])
    : $_POST;

$token = trim((string)($body['fcm_token'] ?? ''));
$platform = trim((string)($body['platform'] ?? 'android'));
if ($token === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'fcm_token required'], JSON_UNESCAPED_UNICODE);
    exit;
}

fcm_ensure_tables($pdo);
$stmt = $pdo->prepare("
    INSERT INTO mobile_fcm_tokens (user_type, user_id, token, platform, last_seen)
    VALUES ('teacher', 0, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE platform = VALUES(platform), last_seen = NOW()
");
$stmt->execute([$token, $platform]);

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
