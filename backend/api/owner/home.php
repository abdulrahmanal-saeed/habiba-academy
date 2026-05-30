<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';

require_teacher();

require_once __DIR__ . '/../../lib/lib/checkout-flow.php';
require_once __DIR__ . '/../../includes/analytics_tracker.php';

ensure_analytics_tables($pdo);
checkout_ensure_tables($pdo);

/* ── Student engagement ───────────────────────────────────────────────── */
$engagement = [];
try {
    $engagement['hw_submitted_today'] = (int)$pdo->query(
        "SELECT COUNT(*) FROM homework_submissions WHERE is_submitted=1 AND DATE(submitted_at)=CURDATE()"
    )->fetchColumn();
    $engagement['hw_submitted_week'] = (int)$pdo->query(
        "SELECT COUNT(*) FROM homework_submissions WHERE is_submitted=1 AND submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    )->fetchColumn();
    $engagement['reviews_submitted_week'] = (int)$pdo->query(
        "SELECT COUNT(*) FROM student_review_submissions WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    )->fetchColumn();
    $engagement['students_logged_in_today'] = (int)$pdo->query(
        "SELECT COUNT(*) FROM students WHERE DATE(last_seen)=CURDATE()"
    )->fetchColumn();
    $engagement['students_logged_in_week'] = (int)$pdo->query(
        "SELECT COUNT(*) FROM students WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    )->fetchColumn();
    $engagement['active_students'] = (int)$pdo->query(
        "SELECT COUNT(*) FROM students WHERE is_active=1"
    )->fetchColumn();
} catch (Throwable) {}

/* ── Portal stats ─────────────────────────────────────────────────────── */
$portals = [];
try {
    $portals['academies']       = (int)$pdo->query("SELECT COUNT(*) FROM academies WHERE status <> 'inactive'")->fetchColumn();
    $portals['academy_students'] = (int)$pdo->query("SELECT COUNT(*) FROM academy_students WHERE status = 'active'")->fetchColumn();
    $portals['parents']         = (int)$pdo->query("SELECT COUNT(*) FROM parent_contacts WHERE status <> 'inactive'")->fetchColumn();
    $portals['parent_students'] = (int)$pdo->query("SELECT COUNT(*) FROM parent_students WHERE status = 'active'")->fetchColumn();
    $portals['media_buyers']    = (int)$pdo->query("SELECT COUNT(*) FROM media_buyers WHERE status <> 'inactive'")->fetchColumn();
} catch (Throwable) {}

/* ── Revenue summary ─────────────────────────────────────────────────── */
$revenue = ['paid_amount' => 0.0, 'paid_orders' => 0, 'pending_orders' => 0, 'by_plan' => [], 'by_status' => []];
try {
    $row = $pdo->query("
        SELECT
          COALESCE(SUM(CASE WHEN payment_status='paid' THEN amount_aed ELSE 0 END), 0) AS paid_amount,
          SUM(CASE WHEN payment_status='paid' THEN 1 ELSE 0 END) AS paid_orders,
          SUM(CASE WHEN payment_status IN ('pending','pending_verification') THEN 1 ELSE 0 END) AS pending_orders
        FROM checkout_orders
    ")->fetch() ?: [];
    $revenue['paid_amount']    = (float)($row['paid_amount']    ?? 0);
    $revenue['paid_orders']    = (int)($row['paid_orders']      ?? 0);
    $revenue['pending_orders'] = (int)($row['pending_orders']   ?? 0);
    $revenue['by_plan'] = $pdo->query("
        SELECT selected_plan, COUNT(*) AS total_orders,
               COALESCE(SUM(CASE WHEN payment_status='paid' THEN amount_aed ELSE 0 END),0) AS paid_amount
        FROM checkout_orders GROUP BY selected_plan ORDER BY paid_amount DESC
    ")->fetchAll() ?: [];
    $revenue['by_status'] = $pdo->query("
        SELECT payment_status, COUNT(*) AS total
        FROM checkout_orders GROUP BY payment_status ORDER BY total DESC
    ")->fetchAll() ?: [];
} catch (Throwable) {}

/* ── Active now ─────────────────────────────────────────────────────── */
$active_now = 0;
try {
    $active_now = (int)$pdo->query(
        "SELECT COUNT(DISTINCT session_id) FROM visits WHERE last_activity_at >= (NOW() - INTERVAL 3 MINUTE)"
    )->fetchColumn();
} catch (Throwable) {}

json_ok([
    'engagement' => $engagement,
    'portals'    => $portals,
    'revenue'    => $revenue,
    'active_now' => $active_now,
]);
