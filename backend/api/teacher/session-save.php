<?php
// api/teacher/session-save.php — Update session details
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/lesson-schedule.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();
ensure_lesson_schedule_schema($pdo);

$id              = (int)($_POST['id']            ?? 0);
$student_id      = (int)($_POST['student_id']    ?? 0);
$title           = trim($_POST['title']          ?? '');
$planned_date    = array_key_exists('planned_date', $_POST) ? (trim((string)$_POST['planned_date']) ?: null) : null;
$session_time    = array_key_exists('session_time', $_POST) ? (trim((string)$_POST['session_time']) ?: null) : null;
$skills          = array_filter(array_map('trim', (array)($_POST['skills'] ?? [])));
$skills_str      = lesson_normalize_skills_csv(implode(',', $skills));
$goals           = trim($_POST['goals']          ?? '');
$teacher_notes   = array_key_exists('teacher_notes', $_POST) ? trim((string)$_POST['teacher_notes']) : null;
$is_milestone    = (int)!empty($_POST['is_milestone']);
$milestone_label = trim($_POST['milestone_label'] ?? '');

if ($id <= 0) json_err('Invalid session ID');

if ($planned_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $planned_date)) {
    $planned_date = null;
}
if ($session_time && !preg_match('/^\d{2}:\d{2}/', $session_time)) {
    $session_time = null;
}

$stmt = $pdo->prepare("SELECT id, student_id, planned_date, session_time, teacher_notes FROM lesson_plan_sessions WHERE id = ?");
$stmt->execute([$id]);
$session = $stmt->fetch();
if (!$session) json_err('Session not found');
if ($student_id > 0 && (int)$session['student_id'] !== $student_id) {
    json_err('Session does not belong to this student', 403);
}

if (!array_key_exists('planned_date', $_POST)) {
    $planned_date = $session['planned_date'] ?: null;
}
if (!array_key_exists('session_time', $_POST)) {
    $session_time = $session['session_time'] ?: null;
}
if (!array_key_exists('teacher_notes', $_POST)) {
    $teacher_notes = (string)($session['teacher_notes'] ?? '');
}

$pdo->prepare("
    UPDATE lesson_plan_sessions
    SET title=?, planned_date=?, session_time=?, planned_time=?, skills=?, goals=?, teacher_notes=?,
        is_milestone=?, milestone_label=?, subject='Arabic',
        price=IFNULL(NULLIF(price,0),120), updated_at=NOW()
    WHERE id=?
")->execute([$title, $planned_date, $session_time, $session_time, $skills_str, $goals, $teacher_notes, $is_milestone, $milestone_label, $id]);

json_ok();
