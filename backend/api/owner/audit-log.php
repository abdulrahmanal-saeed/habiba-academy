<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/checkout-flow.php';
require_teacher();

$pdo = get_pdo();
checkout_ensure_tables($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);

$entity_type = trim($_GET['entity_type'] ?? '');
$action      = trim($_GET['action'] ?? '');
$date_from   = trim($_GET['date_from'] ?? '');
$date_to     = trim($_GET['date_to'] ?? '');
$limit       = min(200, max(10, (int)($_GET['limit'] ?? 50)));
$offset      = max(0, (int)($_GET['offset'] ?? 0));

$where  = ['1=1'];
$params = [];

if ($entity_type !== '') {
    $where[]  = 'entity_type = ?';
    $params[] = $entity_type;
}
if ($action !== '') {
    $where[]  = 'action LIKE ?';
    $params[] = '%' . $action . '%';
}
if ($date_from !== '') {
    $where[]  = 'created_at >= ?';
    $params[] = $date_from . ' 00:00:00';
}
if ($date_to !== '') {
    $where[]  = 'created_at <= ?';
    $params[] = $date_to . ' 23:59:59';
}

$cntStmt = $pdo->prepare('SELECT COUNT(*) FROM audit_logs WHERE ' . implode(' AND ', $where));
$cntStmt->execute($params);
$total = (int)$cntStmt->fetchColumn();

$params[] = $limit;
$params[] = $offset;
$stmt = $pdo->prepare('
    SELECT id, actor_type, actor_id, action, entity_type, entity_id,
           old_value, new_value, ip_address, created_at
    FROM audit_logs
    WHERE ' . implode(' AND ', $where) . '
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
');
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

// Distinct entity types for filter dropdown
$types = $pdo->query("SELECT DISTINCT entity_type FROM audit_logs ORDER BY entity_type")
             ->fetchAll(PDO::FETCH_COLUMN) ?: [];

json_ok(['logs' => $rows, 'total' => $total, 'entity_types' => $types]);
