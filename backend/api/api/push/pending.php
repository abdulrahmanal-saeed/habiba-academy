<?php
// api/push/pending.php — Returns unshown notifications for a subscription endpoint.
// Called by the Service Worker after receiving a push ping.
// Auth: identified by subscription endpoint (no session needed).
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/push.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);

$endpoint = trim((string)($_GET['ep'] ?? ''));
if (!$endpoint) json_err('Missing endpoint');

push_ensure_tables($pdo);

// Look up subscription → find user
$sub = $pdo->prepare("SELECT user_type, user_id FROM push_subscriptions WHERE endpoint = ? LIMIT 1");
$sub->execute([$endpoint]);
$row = $sub->fetch(PDO::FETCH_ASSOC);
if (!$row) json_err('Unknown subscription', 404);

$userType = (string)$row['user_type'];
$userId   = (int)$row['user_id'];

// Fetch unshown notifications
$stmt = $pdo->prepare("
    SELECT id, title, body, url, wa_url, icon, created_at
    FROM push_notifications
    WHERE user_type = ? AND user_id = ? AND shown_at IS NULL
    ORDER BY created_at ASC
    LIMIT 10
");
$stmt->execute([$userType, $userId]);
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Mark them as shown immediately
if ($notifications) {
    $ids = array_column($notifications, 'id');
    $ph  = implode(',', array_fill(0, count($ids), '?'));
    $pdo->prepare("UPDATE push_notifications SET shown_at = NOW() WHERE id IN ($ph)")->execute($ids);
}

json_ok(['notifications' => $notifications]);
