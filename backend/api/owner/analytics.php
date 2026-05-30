<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';

require_teacher();

require_once __DIR__ . '/../../lib/lib/checkout-flow.php';
require_once __DIR__ . '/../../includes/analytics_tracker.php';

if (isset($_GET['lib'])) {
    require_once __DIR__ . '/../../lib/lib/media-buyer.php';
    media_buyer_ensure_schema($pdo);
}
ensure_analytics_tables($pdo);
checkout_ensure_tables($pdo);

/* ── Realtime partial ─────────────────────────────────────────────── */
if (($_GET['partial'] ?? '') === 'realtime') {
    $stmt = $pdo->query("
        SELECT v.session_id, v.device_type, v.last_activity_at, pv.page_url
        FROM visits v
        LEFT JOIN page_views pv ON pv.id = (
            SELECT pv2.id FROM page_views pv2
            WHERE pv2.session_id = v.session_id
            ORDER BY pv2.created_at DESC, pv2.id DESC LIMIT 1
        )
        WHERE v.last_activity_at >= (NOW() - INTERVAL 3 MINUTE)
        ORDER BY v.last_activity_at DESC LIMIT 20
    ");
    json_ok(['sessions' => $stmt->fetchAll() ?: []]);
    exit;
}

/* ── Overview ─────────────────────────────────────────────────────── */
$overview = [
    'total_visits'     => (int)$pdo->query("SELECT COUNT(*) FROM visits")->fetchColumn(),
    'unique_visitors'  => (int)$pdo->query("SELECT COUNT(DISTINCT session_id) FROM visits")->fetchColumn(),
    'active_now'       => (int)$pdo->query("SELECT COUNT(DISTINCT session_id) FROM visits WHERE last_activity_at >= (NOW() - INTERVAL 3 MINUTE)")->fetchColumn(),
    'page_views'       => (int)$pdo->query("SELECT COUNT(*) FROM page_views")->fetchColumn(),
];

/* ── Daily visits ─────────────────────────────────────────────────── */
$daily_visits = $pdo->query("
    SELECT DATE(created_at) AS day_key, COUNT(*) AS visit_count
    FROM visits WHERE created_at >= (CURDATE() - INTERVAL 59 DAY)
    GROUP BY DATE(created_at) HAVING visit_count > 0 ORDER BY day_key ASC LIMIT 30
")->fetchAll() ?: [];

/* ── Device breakdown ─────────────────────────────────────────────── */
$device_breakdown = $pdo->query("
    SELECT device_type, COUNT(*) AS cnt FROM visits GROUP BY device_type ORDER BY cnt DESC
")->fetchAll() ?: [];

/* ── Hourly pattern ───────────────────────────────────────────────── */
$hourlyRaw = $pdo->query("
    SELECT HOUR(created_at) AS hr, COUNT(*) AS cnt FROM visits
    WHERE created_at >= (CURDATE() - INTERVAL 29 DAY)
    GROUP BY HOUR(created_at) ORDER BY hr ASC
")->fetchAll();
$hourlyMap = [];
foreach ($hourlyRaw as $r) { $hourlyMap[(int)$r['hr']] = (int)$r['cnt']; }
$hourly_pattern = [];
for ($h = 0; $h < 24; $h++) { $hourly_pattern[] = ['hr' => $h, 'cnt' => $hourlyMap[$h] ?? 0]; }

/* ── Engagement ───────────────────────────────────────────────────── */
$engagement = [];
try {
    $engagement['hw_submitted_today'] = (int)$pdo->query("SELECT COUNT(*) FROM homework_submissions WHERE is_submitted=1 AND DATE(submitted_at)=CURDATE()")->fetchColumn();
    $engagement['hw_submitted_week']  = (int)$pdo->query("SELECT COUNT(*) FROM homework_submissions WHERE is_submitted=1 AND submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
    $engagement['reviews_submitted_week'] = (int)$pdo->query("SELECT COUNT(*) FROM student_review_submissions WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
    $engagement['students_logged_in_today'] = (int)$pdo->query("SELECT COUNT(*) FROM students WHERE DATE(last_seen)=CURDATE()")->fetchColumn();
    $engagement['students_logged_in_week']  = (int)$pdo->query("SELECT COUNT(*) FROM students WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
    $engagement['active_students'] = (int)$pdo->query("SELECT COUNT(*) FROM students WHERE is_active=1")->fetchColumn();
} catch (Throwable) {}

/* ── Funnel ───────────────────────────────────────────────────────── */
$funnel = ['visit' => (int)$pdo->query("SELECT COUNT(*) FROM visits WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)")->fetchColumn()];
$funnelEvents = ['pricing_view','checkout_start','checkout_submit','payment_pending','payment_paid','student_form_submit'];
$stmt = $pdo->prepare("SELECT COUNT(*) FROM events WHERE event_name=? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
foreach ($funnelEvents as $ev) { $stmt->execute([$ev]); $funnel[$ev] = (int)$stmt->fetchColumn(); }

/* ── Revenue ──────────────────────────────────────────────────────── */
$revenue = ['paid_amount' => 0.0, 'paid_orders' => 0, 'pending_orders' => 0, 'by_plan' => [], 'by_status' => []];
try {
    $row = $pdo->query("
        SELECT COALESCE(SUM(CASE WHEN payment_status='paid' THEN amount_aed ELSE 0 END),0) AS paid_amount,
               SUM(CASE WHEN payment_status='paid' THEN 1 ELSE 0 END) AS paid_orders,
               SUM(CASE WHEN payment_status IN ('pending','pending_verification') THEN 1 ELSE 0 END) AS pending_orders
        FROM checkout_orders
    ")->fetch() ?: [];
    $revenue['paid_amount']    = (float)($row['paid_amount']  ?? 0);
    $revenue['paid_orders']    = (int)($row['paid_orders']    ?? 0);
    $revenue['pending_orders'] = (int)($row['pending_orders'] ?? 0);
    $revenue['by_plan']   = $pdo->query("SELECT selected_plan, COUNT(*) AS total_orders, COALESCE(SUM(CASE WHEN payment_status='paid' THEN amount_aed ELSE 0 END),0) AS paid_amount FROM checkout_orders GROUP BY selected_plan ORDER BY paid_amount DESC")->fetchAll() ?: [];
    $revenue['by_status'] = $pdo->query("SELECT payment_status, COUNT(*) AS total FROM checkout_orders GROUP BY payment_status ORDER BY total DESC")->fetchAll() ?: [];
} catch (Throwable) {}

/* ── Media buyers ─────────────────────────────────────────────────── */
$media_buyers = [];
try {
    $media_buyers = $pdo->query("
        SELECT mb.full_name, mb.tracking_code,
               COUNT(DISTINCT v.id) AS visits,
               COUNT(DISTINCT ma.converted_checkout_order_id) AS conversions,
               COALESCE(SUM(CASE WHEN co.payment_status='paid' THEN co.amount_aed ELSE 0 END),0) AS paid_amount
        FROM media_buyers mb
        LEFT JOIN media_buyer_visits v ON v.media_buyer_id = mb.id
        LEFT JOIN marketing_attributions ma ON ma.media_buyer_id = mb.id
        LEFT JOIN checkout_orders co ON co.id = ma.converted_checkout_order_id
        GROUP BY mb.id ORDER BY paid_amount DESC, visits DESC LIMIT 12
    ")->fetchAll() ?: [];
} catch (Throwable) {}

/* ── Low activity students ────────────────────────────────────────── */
$low_activity_students = [];
try {
    $low_activity_students = $pdo->query("
        SELECT id, full_name, login_code, last_seen FROM students
        WHERE is_active=1 AND (last_seen IS NULL OR last_seen < DATE_SUB(NOW(), INTERVAL 14 DAY))
        ORDER BY last_seen IS NULL DESC, last_seen ASC LIMIT 10
    ")->fetchAll() ?: [];
} catch (Throwable) {}

/* ── Top pages ────────────────────────────────────────────────────── */
$top_pages = $pdo->query("
    SELECT page_url, COALESCE(MAX(page_title),'') AS page_title, COUNT(*) AS total_views
    FROM page_views GROUP BY page_url ORDER BY total_views DESC, page_url ASC LIMIT 10
")->fetchAll() ?: [];

json_ok([
    'overview'              => $overview,
    'daily_visits'          => $daily_visits,
    'device_breakdown'      => $device_breakdown,
    'hourly_pattern'        => $hourly_pattern,
    'engagement'            => $engagement,
    'funnel'                => $funnel,
    'revenue'               => $revenue,
    'media_buyers'          => $media_buyers,
    'low_activity_students' => $low_activity_students,
    'top_pages'             => $top_pages,
]);
