<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/media-buyer.php';

start_session();
portals_ensure_schema($pdo);

if (empty($_SESSION['media_buyer_id'])) {
    json_err('Unauthorized', 401);
}

$id = (int)$_SESSION['media_buyer_id'];
media_buyer_ensure_schema($pdo);

$c = $pdo->prepare("
    SELECT id, commission_amount_aed, status, created_at
    FROM media_buyer_commissions
    WHERE media_buyer_id = ?
    ORDER BY created_at DESC
    LIMIT 20
");
$c->execute([$id]);
$commissions = $c->fetchAll(PDO::FETCH_ASSOC) ?: [];

$s = $pdo->prepare("
    SELECT source_label, COUNT(*) AS total
    FROM media_buyer_visits
    WHERE media_buyer_id = ?
    GROUP BY source_label
    ORDER BY total DESC
    LIMIT 8
");
$s->execute([$id]);
$sources = $s->fetchAll(PDO::FETCH_ASSOC) ?: [];

$d = $pdo->prepare("
    SELECT device_type, COUNT(*) AS total
    FROM media_buyer_visits
    WHERE media_buyer_id = ?
    GROUP BY device_type
    ORDER BY total DESC
");
$d->execute([$id]);
$devices = $d->fetchAll(PDO::FETCH_ASSOC) ?: [];

$v = $pdo->prepare("
    SELECT first_seen_at, source_label, device_type, country, duration_seconds, last_path, last_event
    FROM media_buyer_visits
    WHERE media_buyer_id = ?
    ORDER BY first_seen_at DESC
    LIMIT 20
");
$v->execute([$id]);
$recent_visits = $v->fetchAll(PDO::FETCH_ASSOC) ?: [];

json_ok([
    'commissions'   => $commissions,
    'sources'       => $sources,
    'devices'       => $devices,
    'recent_visits' => $recent_visits,
]);
