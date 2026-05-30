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

// Verify parent-child relationship
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

// Balance from contract
ensure_lesson_schedule_schema($pdo);
$cStmt = $pdo->prepare("SELECT * FROM student_contracts WHERE student_id=? ORDER BY id DESC LIMIT 1");
$cStmt->execute([$child_id]);
$contract = $cStmt->fetch() ?: null;

$balance = null;
if ($contract) {
    $hoursPerSess = (float)$contract['session_duration_minutes'] / 60;
    $total        = (int)round((float)$contract['total_hours'] / $hoursPerSess);
    $doneStmt     = $pdo->prepare("SELECT COUNT(*) FROM lesson_plan_sessions WHERE student_id=? AND status='completed'");
    $doneStmt->execute([$child_id]);
    $done      = (int)$doneStmt->fetchColumn();
    $planStmt  = $pdo->prepare("SELECT COUNT(*) FROM lesson_plan_sessions WHERE student_id=? AND status IN ('planned','rescheduled')");
    $planStmt->execute([$child_id]);
    $planned   = (int)$planStmt->fetchColumn();
    $balance = [
        'package_name'       => (string)($contract['package_name'] ?? ''),
        'contract_sessions'  => $total,
        'completed_sessions' => $done,
        'planned_sessions'   => $planned,
        'remaining_sessions' => max(0, $total - $done),
        'expiry_date'        => null,
    ];
}

// Homework stats
$hwStmt = $pdo->prepare("
    SELECT COUNT(*) AS cnt,
           SUM(mcq_score) AS total_score,
           SUM(mcq_total) AS total_possible
    FROM homework_submissions
    WHERE student_id=? AND is_submitted=1
");
$hwStmt->execute([$child_id]);
$hwRow   = $hwStmt->fetch();
$hwCount = (int)($hwRow['cnt'] ?? 0);
$hwPoss  = (int)($hwRow['total_possible'] ?? 0);
$hwAvg   = $hwPoss > 0 ? (int)round(((float)$hwRow['total_score'] / $hwPoss) * 100) : null;

// Review scores
$rvStmt = $pdo->prepare("
    SELECT COUNT(*) AS cnt, AVG(total_score) AS avg_score, AVG(r.total_points) AS avg_total
    FROM student_review_submissions sub
    JOIN student_reviews r ON r.id = sub.review_id
    WHERE sub.student_id=? AND sub.review_status='reviewed' AND r.total_points > 0
");
$rvStmt->execute([$child_id]);
$rvRow   = $rvStmt->fetch();
$rvCount = (int)($rvRow['cnt'] ?? 0);
$rvAvgPct = ($rvCount > 0 && (float)($rvRow['avg_total'] ?? 0) > 0)
    ? (int)round(((float)$rvRow['avg_score'] / (float)$rvRow['avg_total']) * 100)
    : null;

json_ok([
    'child'    => $child,
    'balance'  => $balance,
    'stats'    => [
        'hw_count'    => $hwCount,
        'hw_avg_pct'  => $hwAvg,
        'rv_count'    => $rvCount,
        'rv_avg_pct'  => $rvAvgPct,
    ],
]);
