<?php
// api/mobile/students.php — Get students list for mobile app
declare(strict_types=1);
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$search     = trim((string)($_GET['q'] ?? ''));
$activeOnly = ($_GET['active'] ?? '1') !== '0';
$limit      = max(1, min(200, (int)($_GET['limit'] ?? 100)));
$offset     = max(0, (int)($_GET['offset'] ?? 0));

$where  = $activeOnly ? 'WHERE is_active = 1' : 'WHERE 1=1';
$params = [];

if ($search !== '') {
    $where   .= ' AND (full_name LIKE ? OR login_code LIKE ?)';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
}

$stmt = $pdo->prepare("
    SELECT id, full_name, level, login_code, email, whatsapp,
           age, country, notes, is_active, last_seen, created_at
    FROM students
    $where
    ORDER BY full_name
    LIMIT $limit OFFSET $offset
");
$stmt->execute($params);
$students = $stmt->fetchAll();

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM students $where");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

foreach ($students as &$s) {
    $s['id']        = (int)$s['id'];
    $s['is_active'] = (int)$s['is_active'];
}
unset($s);

echo json_encode([
    'ok'       => true,
    'students' => $students,
    'total'    => $total,
    'limit'    => $limit,
    'offset'   => $offset,
]);
