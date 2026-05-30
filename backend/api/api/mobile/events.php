<?php
// api/mobile/events.php - Teacher website events for the mobile app
declare(strict_types=1);
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/push.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

push_ensure_tables($pdo);

$since = trim((string)($_GET['since'] ?? ''));
$where = "WHERE user_type = 'teacher' AND user_id = 0";
$params = [];
if ($since !== '' && preg_match('/^\d{4}-\d{2}-\d{2}/', $since)) {
    $where .= ' AND created_at >= ?';
    $params[] = $since;
}

$stmt = $pdo->prepare("
    SELECT id, title, body, url, wa_url, wa_message, icon, created_at
    FROM push_notifications
    $where
    ORDER BY created_at DESC
    LIMIT 50
");
$stmt->execute($params);
$events = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($events as &$event) {
    $event['id'] = (int)$event['id'];
}
unset($event);

echo json_encode([
    'ok' => true,
    'events' => $events,
], JSON_UNESCAPED_UNICODE);
