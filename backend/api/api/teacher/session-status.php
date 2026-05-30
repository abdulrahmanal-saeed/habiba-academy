<?php
// api/teacher/session-status.php - Update session status
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lesson-schedule.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();
ensure_lesson_schedule_schema($pdo);

$id           = (int)($_POST['id']           ?? 0);
$status       = trim($_POST['status']        ?? '');
$actual_date  = trim($_POST['actual_date']   ?? '') ?: null;
$planned_date = trim($_POST['planned_date']  ?? '') ?: null;

if ($id <= 0) json_err('Invalid ID');
if (!in_array($status, lesson_allowed_statuses(), true)) json_err('Invalid status');

$stmt = $pdo->prepare("SELECT id FROM lesson_plan_sessions WHERE id = ?");
$stmt->execute([$id]);
if (!$stmt->fetch()) json_err('Session not found');

if ($status === 'completed') {
    $actual_date ??= date('Y-m-d');
    $pdo->prepare("UPDATE lesson_plan_sessions SET status=?, actual_date=?, is_paid=1, updated_at=NOW() WHERE id=?")
        ->execute([$status, $actual_date, $id]);
} elseif ($status === 'rescheduled') {
    if ($planned_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $planned_date)) json_err('Invalid date');
    $pdo->prepare("UPDATE lesson_plan_sessions SET status=?, planned_date=?, updated_at=NOW() WHERE id=?")
        ->execute([$status, $planned_date, $id]);
} elseif ($status === 'planned') {
    $pdo->prepare("UPDATE lesson_plan_sessions SET status=?, actual_date=NULL, updated_at=NOW() WHERE id=?")
        ->execute([$status, $id]);
} elseif ($status === 'absent') {
    $rowStmt = $pdo->prepare("
        SELECT s.price, c.default_price_aed
        FROM lesson_plan_sessions s
        LEFT JOIN student_contracts c ON c.id = s.contract_id
        WHERE s.id = ?
        LIMIT 1
    ");
    $rowStmt->execute([$id]);
    $row = $rowStmt->fetch() ?: [];
    $basePrice = (float)($row['price'] ?: $row['default_price_aed'] ?: 120);
    $absencePrice = round($basePrice / 2, 2);
    $pdo->prepare("UPDATE lesson_plan_sessions SET status=?, actual_date=?, price=?, is_paid=1, attendance_note=?, updated_at=NOW() WHERE id=?")
        ->execute([$status, $actual_date ?: date('Y-m-d'), $absencePrice, 'No-show. Teacher attended location; half session fee applies.', $id]);
} elseif ($status === 'cancelled') {
    $pdo->prepare("UPDATE lesson_plan_sessions SET status=?, actual_date=NULL, is_paid=0, updated_at=NOW() WHERE id=?")
        ->execute([$status, $id]);
} else {
    $pdo->prepare("UPDATE lesson_plan_sessions SET status=?, updated_at=NOW() WHERE id=?")
        ->execute([$status, $id]);
}

json_ok();
