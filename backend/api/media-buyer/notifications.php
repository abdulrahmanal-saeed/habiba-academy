<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/platform-notifications.php';

start_session();
portals_ensure_schema($pdo);

if (empty($_SESSION['media_buyer_id'])) {
    json_err('Unauthorized', 401);
}

$id = (int)$_SESSION['media_buyer_id'];
platform_notifications_ensure_schema($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pdo->prepare("
        UPDATE push_notifications
        SET read_at = NOW()
        WHERE (user_type = 'media_buyer' OR target_role = 'media_buyer')
          AND user_id = ?
          AND read_at IS NULL
    ")->execute([$id]);
    json_ok([]);
}

$stmt = $pdo->prepare("
    SELECT id, title, body, url, action_label, read_at, created_at
    FROM push_notifications
    WHERE (user_type = 'media_buyer' OR target_role = 'media_buyer')
      AND user_id = ?
    ORDER BY id DESC
    LIMIT 200
");
$stmt->execute([$id]);
$items = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

$unread_count = 0;
foreach ($items as $n) {
    if (empty($n['read_at'])) $unread_count++;
}

json_ok([
    'notifications' => $items,
    'unread_count'  => $unread_count,
]);
