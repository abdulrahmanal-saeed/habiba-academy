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

$child_id = (int)($_GET['id'] ?? 0);
if (!$child_id) json_err('Missing child id', 400);

// Verify parent owns this child
$verify = $pdo->prepare("
    SELECT 1 FROM parent_students
    WHERE parent_id=? AND student_id=? AND status='active'
    LIMIT 1
");
$verify->execute([$parent_id, $child_id]);
if (!$verify->fetch()) json_err('Access denied', 403);

$childStmt = $pdo->prepare("SELECT id, full_name, login_code, level FROM students WHERE id=? LIMIT 1");
$childStmt->execute([$child_id]);
$child = $childStmt->fetch();
if (!$child) json_err('Child not found', 404);

ensure_lesson_schedule_schema($pdo);

// Get contract
$cStmt = $pdo->prepare("SELECT * FROM student_contracts WHERE student_id=? ORDER BY id DESC LIMIT 1");
$cStmt->execute([$child_id]);
$contract = $cStmt->fetch() ?: null;

if (!$contract) {
    json_ok(['child' => $child, 'sessions' => [], 'stats' => null]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT id, session_number, title,
           COALESCE(session_time, planned_time) AS session_time,
           planned_date, duration_minutes, status, subject,
           is_milestone, milestone_label
    FROM lesson_plan_sessions
    WHERE student_id = ?
    ORDER BY planned_date ASC, session_number ASC
");
$stmt->execute([$child_id]);
$sessions = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

$done      = count(array_filter($sessions, fn($s) => $s['status'] === 'completed'));
$upcoming  = count(array_filter($sessions, fn($s) => in_array($s['status'], ['planned','rescheduled'], true)));
$total     = (int)round((float)$contract['total_hours'] / ((float)$contract['session_duration_minutes'] / 60));
$remaining = max(0, $total - $done);
$pct       = $total > 0 ? (int)round($done / $total * 100) : 0;

json_ok([
    'child'    => $child,
    'sessions' => $sessions,
    'stats'    => [
        'total'     => $total,
        'done'      => $done,
        'upcoming'  => $upcoming,
        'remaining' => $remaining,
        'pct'       => $pct,
    ],
]);
