<?php
// api/teacher/students.php — All students with lesson balances
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/lesson-schedule.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))    json_err('Not authenticated', 401);

$stmt = $pdo->query("SELECT id, full_name, login_code, level, is_active, created_at, last_seen FROM students ORDER BY full_name ASC");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$ids      = array_column($rows, 'id');
$balances = $ids ? lesson_package_balances($pdo, $ids) : [];

$students = [];
foreach ($rows as $r) {
    $id  = (int)$r['id'];
    $bal = $balances[$id] ?? null;
    $students[] = [
        'id'          => $id,
        'full_name'   => (string)$r['full_name'],
        'login_code'  => (string)$r['login_code'],
        'level'       => (string)($r['level'] ?? 'A2'),
        'is_active'   => (bool)$r['is_active'],
        'created_at'  => $r['created_at'],
        'last_seen'   => $r['last_seen'],
        'balance'     => $bal ? [
            'package_name'       => (string)$bal['package_name'],
            'used_sessions'      => (int)$bal['used_sessions'],
            'contract_sessions'  => (int)$bal['contract_sessions'],
            'remaining_sessions' => (int)$bal['remaining_sessions'],
            'income_total'       => (float)$bal['income_total'],
        ] : null,
    ];
}

json_ok(['students' => $students]);
