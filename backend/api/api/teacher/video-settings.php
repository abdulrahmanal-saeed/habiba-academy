<?php
// api/teacher/video-settings.php — Update a feature_settings key
declare(strict_types=1);
require_once __DIR__ . '/../../teacher/_guard.php';
require_once __DIR__ . '/../../lib/videos.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); json_err('Method not allowed');
}
csrf_validate();

$key   = trim((string)($_POST['key']   ?? ''));
$value = trim((string)($_POST['value'] ?? '0'));

$allowed = ['show_videos_on_homepage', 'enable_videos_page'];
if (!in_array($key, $allowed, true)) json_err('Invalid setting key', 422);

ensure_videos_tables($pdo);

try {
    $stmt = $pdo->prepare("
        INSERT INTO feature_settings (`key`, `value`) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)
    ");
    $stmt->execute([$key, $value]);
    json_ok(['key' => $key, 'value' => $value]);
} catch (Throwable $e) {
    json_err('DB error: ' . $e->getMessage(), 500);
}
