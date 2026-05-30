<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';

require_teacher();

require_once __DIR__ . '/../../lib/lib/checkout-flow.php';

checkout_ensure_tables($pdo);

/* ── POST actions ─────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_validate();

    $body   = (array)(json_decode((string)file_get_contents('php://input'), true) ?? []);
    $action = trim((string)($body['action'] ?? ''));
    $id     = (int)($body['id'] ?? 0);

    if ($id <= 0) { json_err('Invalid order id', 400); exit; }

    if ($action === 'check_ziina') {
        require_once __DIR__ . '/../../lib/lib/ziina.php';
        $stmt = $pdo->prepare("SELECT checkout_reference FROM checkout_orders WHERE id=? LIMIT 1");
        $stmt->execute([$id]);
        $ref = (string)($stmt->fetchColumn() ?: '');
        if ($ref === '') { json_err('Order not found', 404); exit; }
        try {
            $result = ziina_update_checkout_status($pdo, $ref, '');
            $status = $result ? (string)$result['mapped_status'] : 'unknown';
            json_ok(['status' => $status, 'message' => 'Ziina status: ' . str_replace('_', ' ', $status)]);
        } catch (Throwable $e) {
            json_err('Ziina check failed: ' . $e->getMessage(), 502);
        }
        exit;
    }

    if ($action === 'update_status') {
        $newStatus = trim((string)($body['payment_status'] ?? ''));
        $allowed   = ['pending', 'pending_verification', 'paid', 'failed', 'refunded'];
        if (!in_array($newStatus, $allowed, true)) { json_err('Invalid status', 400); exit; }
        if (checkout_set_payment_status($pdo, $id, $newStatus, 'owner')) {
            json_ok(['message' => 'Payment status updated']);
        } else {
            json_err('Could not update payment status', 500);
        }
        exit;
    }

    json_err('Unknown action', 400);
    exit;
}

/* ── GET detail (?id=N) ───────────────────────────────────────────── */
if (isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    if ($id <= 0) { json_err('Not found', 404); exit; }

    $stmt = $pdo->prepare("SELECT * FROM checkout_orders WHERE id=? LIMIT 1");
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) { json_err('Not found', 404); exit; }

    $payStmt = $pdo->prepare("SELECT * FROM payment_records WHERE checkout_order_id=? ORDER BY id DESC");
    $payStmt->execute([$id]);
    $payment_records = $payStmt->fetchAll() ?: [];

    $auditStmt = $pdo->prepare("
        SELECT * FROM audit_logs
        WHERE entity_type='checkout_order' AND entity_id=?
        ORDER BY created_at DESC, id DESC LIMIT 50
    ");
    $auditStmt->execute([$id]);
    $audit_logs = $auditStmt->fetchAll() ?: [];

    // cast booleans
    $order['policy_agreed'] = (bool)(int)($order['policy_agreed'] ?? 0);

    json_ok(['order' => $order, 'payment_records' => $payment_records, 'audit_logs' => $audit_logs]);
    exit;
}

/* ── GET list ─────────────────────────────────────────────────────── */
$statusFilter = trim((string)($_GET['status'] ?? ''));
$search       = trim((string)($_GET['q']      ?? ''));
$allowed      = ['', 'pending', 'pending_verification', 'paid', 'failed', 'refunded'];
if (!in_array($statusFilter, $allowed, true)) { $statusFilter = ''; }

$where  = [];
$params = [];
if ($statusFilter !== '') { $where[] = 'payment_status=?'; $params[] = $statusFilter; }
if ($search !== '') {
    $where[] = '(checkout_reference LIKE ? OR full_name LIKE ? OR email LIKE ? OR whatsapp LIKE ?)';
    $like = '%' . $search . '%';
    array_push($params, $like, $like, $like, $like);
}

$sql = "SELECT * FROM checkout_orders " . ($where ? 'WHERE ' . implode(' AND ', $where) : '') . " ORDER BY created_at DESC LIMIT 200";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$orders = $stmt->fetchAll() ?: [];

// cast booleans
foreach ($orders as &$o) { $o['policy_agreed'] = (bool)(int)($o['policy_agreed'] ?? 0); }
unset($o);

$stats = [];
foreach (['pending', 'pending_verification', 'paid', 'failed', 'refunded'] as $s) {
    $c = $pdo->prepare("SELECT COUNT(*) FROM checkout_orders WHERE payment_status=?");
    $c->execute([$s]);
    $stats[$s] = (int)$c->fetchColumn();
}

json_ok(['orders' => $orders, 'stats' => $stats, 'total' => count($orders)]);
