<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';

start_session();
if (empty($_SESSION['academy_id'])) json_err('Not authenticated', 401);
$academy_id = (int)$_SESSION['academy_id'];
portals_ensure_schema($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pdo->prepare(
        "UPDATE push_notifications SET read_at = NOW()
         WHERE (user_type = 'academy' OR target_role = 'academy') AND user_id = ?"
    )->execute([$academy_id]);
    json_ok([]);
}

$stmt = $pdo->prepare(
    "SELECT id, title, body, action_label, url, read_at, created_at
     FROM push_notifications
     WHERE (user_type = 'academy' OR target_role = 'academy') AND user_id = ?
     ORDER BY id DESC
     LIMIT 200"
);
$stmt->execute([$academy_id]);
$notifications = $stmt->fetchAll() ?: [];
$unread = count(array_filter($notifications, static fn(array $n): bool => empty($n['read_at'])));

json_ok(['notifications' => $notifications, 'unread_count' => $unread]);
