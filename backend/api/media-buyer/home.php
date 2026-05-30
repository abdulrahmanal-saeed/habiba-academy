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

$stmt = $pdo->prepare("SELECT id, full_name, commission_rate FROM media_buyers WHERE id = ? LIMIT 1");
$stmt->execute([$id]);
$buyer = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$buyer) {
    json_err('Not found', 404);
}

$activeTemplate = $pdo->query(
    "SELECT id, requires_reacceptance FROM media_buyer_agreement_templates WHERE active = 1 ORDER BY id DESC LIMIT 1"
)->fetch(PDO::FETCH_ASSOC) ?: ['id' => 0, 'requires_reacceptance' => 0];
$acc = $pdo->prepare(
    "SELECT template_id FROM media_buyer_agreement_acceptances WHERE media_buyer_id = ? ORDER BY accepted_at DESC LIMIT 1"
);
$acc->execute([$id]);
$acceptedId = (int)($acc->fetchColumn() ?: 0);
if (!$acceptedId || ((int)$activeTemplate['requires_reacceptance'] === 1 && $acceptedId !== (int)$activeTemplate['id'])) {
    json_err('agreement_required', 403);
}

$s1 = $pdo->prepare("
    SELECT
        COUNT(*) AS orders_count,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount_aed ELSE 0 END), 0) AS paid_amount
    FROM checkout_orders WHERE media_buyer_id = ?
");
$s1->execute([$id]);
$orders = $s1->fetch(PDO::FETCH_ASSOC) ?: ['orders_count' => 0, 'paid_count' => 0, 'paid_amount' => 0];

$s2 = $pdo->prepare("
    SELECT
        COUNT(*) AS visits,
        COUNT(DISTINCT session_token) AS unique_sessions,
        COALESCE(AVG(NULLIF(duration_seconds, 0)), 0) AS avg_duration
    FROM media_buyer_visits WHERE media_buyer_id = ?
");
$s2->execute([$id]);
$visits = $s2->fetch(PDO::FETCH_ASSOC) ?: ['visits' => 0, 'unique_sessions' => 0, 'avg_duration' => 0];

$s3 = $pdo->prepare("
    SELECT
        COUNT(*) AS attribution_count,
        COUNT(DISTINCT visitor_id) AS visitors_count,
        SUM(CASE WHEN converted_checkout_order_id IS NOT NULL THEN 1 ELSE 0 END) AS conversions_count
    FROM marketing_attributions WHERE media_buyer_id = ? AND expires_at >= NOW()
");
$s3->execute([$id]);
$attr = $s3->fetch(PDO::FETCH_ASSOC) ?: ['attribution_count' => 0, 'visitors_count' => 0, 'conversions_count' => 0];

$campaign = media_buyer_default_campaign($pdo, $id);
$links = [
    'home'             => media_buyer_tracking_url($campaign, '/'),
    'pricing'          => media_buyer_tracking_url($campaign, '/#pricing'),
    'checkout_single'  => media_buyer_tracking_url($campaign, '/checkout.php?plan=single'),
    'checkout_monthly' => media_buyer_tracking_url($campaign, '/checkout.php?plan=monthly'),
    'checkout_bundle'  => media_buyer_tracking_url($campaign, '/checkout.php?plan=bundle'),
];

json_ok([
    'buyer' => [
        'id'              => (int)$buyer['id'],
        'full_name'       => $buyer['full_name'],
        'commission_rate' => $buyer['commission_rate'],
    ],
    'kpis' => [
        'orders_count'      => (int)$orders['orders_count'],
        'paid_count'        => (int)$orders['paid_count'],
        'paid_amount'       => (float)$orders['paid_amount'],
        'visits'            => (int)$visits['visits'],
        'unique_sessions'   => (int)$visits['unique_sessions'],
        'avg_duration'      => (int)round((float)$visits['avg_duration']),
        'visitors_count'    => (int)$attr['visitors_count'],
        'attribution_count' => (int)$attr['attribution_count'],
        'conversions_count' => (int)$attr['conversions_count'],
    ],
    'links' => $links,
]);
