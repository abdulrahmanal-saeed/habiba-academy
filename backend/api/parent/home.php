<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/lesson-schedule.php';

start_session();
if (empty($_SESSION['parent_id'])) json_err('Not authenticated', 401);
$parent_id = (int)$_SESSION['parent_id'];
portals_ensure_schema($pdo);

$stmt = $pdo->prepare('SELECT full_name FROM parent_contacts WHERE id = ?');
$stmt->execute([$parent_id]);
$parent = $stmt->fetch() ?: ['full_name' => ''];

$students = parent_linked_students($pdo, $parent_id);
$student_ids = array_column($students, 'id');
$upcoming = $student_ids ? parent_child_upcoming($pdo, $student_ids, 12) : [];

foreach ($students as &$s) {
    $s['balance'] = parent_child_balance($pdo, $s['id']);
}
unset($s);

json_ok([
    'parent'   => $parent,
    'students' => $students,
    'upcoming' => $upcoming,
    'kpis'     => ['student_count' => count($students), 'upcoming_count' => count($upcoming)],
]);
