<?php
// api/mobile/session-save.php - Create/update a lesson plan session from mobile
declare(strict_types=1);
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/lesson-schedule.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');
ensure_lesson_schedule_schema($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$contentType = (string)($_SERVER['CONTENT_TYPE'] ?? '');
$body = str_contains($contentType, 'application/json')
    ? (array)(json_decode(file_get_contents('php://input'), true) ?? [])
    : $_POST;

$id = (int)($body['id'] ?? 0);
$studentId = (int)($body['student_id'] ?? 0);
$title = trim((string)($body['title'] ?? 'حصة عربي'));
if ($title === '') $title = 'حصة عربي';
$plannedDate = trim((string)($body['planned_date'] ?? ''));
$sessionTime = trim((string)($body['session_time'] ?? ''));
$actualDate = trim((string)($body['actual_date'] ?? ''));
$status = trim((string)($body['status'] ?? 'planned'));
$skills = lesson_normalize_skills_csv(trim((string)($body['skills'] ?? '')));
$goals = trim((string)($body['goals'] ?? ''));
$notes = trim((string)($body['teacher_notes'] ?? ''));
$price = (float)($body['price'] ?? 120);
if ($price <= 0) $price = 120.0;
$subject = trim((string)($body['subject'] ?? 'عربي'));
if ($subject === '') $subject = 'عربي';
$durationMinutes = max(15, min(240, (int)($body['duration_minutes'] ?? 60)));
$isPaid = (int)($body['is_paid'] ?? ($status === 'completed' ? 1 : 0));
$isMilestone = (int)($body['is_milestone'] ?? 0);
$milestoneLabel = trim((string)($body['milestone_label'] ?? ''));

$allowedStatuses = lesson_allowed_statuses();
if (!in_array($status, $allowedStatuses, true)) $status = 'planned';
if ($plannedDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $plannedDate)) $plannedDate = '';
if ($actualDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $actualDate)) $actualDate = '';
if ($sessionTime !== '' && !preg_match('/^\d{2}:\d{2}/', $sessionTime)) $sessionTime = '';

if ($id > 0) {
    $stmt = $pdo->prepare("
        UPDATE lesson_plan_sessions
        SET title = ?, planned_date = ?, session_time = ?, planned_time = ?,
            duration_minutes = ?, actual_date = ?,
            status = ?, skills = ?, goals = ?, teacher_notes = ?,
            price = ?, subject = ?, is_paid = ?, is_milestone = ?, milestone_label = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([
        $title, $plannedDate ?: null, $sessionTime ?: null, $sessionTime ?: null,
        $durationMinutes, $actualDate ?: null,
        $status, $skills, $goals, $notes, $price, $subject, $isPaid,
        $isMilestone, $milestoneLabel, $id,
    ]);
    echo json_encode(['ok' => true, 'id' => $id, 'action' => 'updated'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($studentId <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'student_id required for new session'], JSON_UNESCAPED_UNICODE);
    exit;
}

$targetId = 0;
if ($plannedDate !== '' && $sessionTime !== '') {
    $target = $pdo->prepare("
        SELECT id
        FROM lesson_plan_sessions
        WHERE student_id = ?
          AND planned_date = ?
          AND COALESCE(session_time, planned_time) = ?
        ORDER BY id ASC
        LIMIT 1
    ");
    $target->execute([$studentId, $plannedDate, $sessionTime ?: null]);
    $targetId = (int)($target->fetchColumn() ?: 0);
}

if ($targetId <= 0) {
    $target = $pdo->prepare("
        SELECT id
        FROM lesson_plan_sessions
        WHERE student_id = ?
          AND status = 'planned'
          AND (planned_date IS NULL OR planned_date = '0000-00-00')
          AND COALESCE(NULLIF(title, ''), '') = ''
          AND COALESCE(NULLIF(goals, ''), '') = ''
          AND COALESCE(NULLIF(teacher_notes, ''), '') = ''
        ORDER BY session_number ASC, id ASC
        LIMIT 1
    ");
    $target->execute([$studentId]);
    $targetId = (int)($target->fetchColumn() ?: 0);
}

if ($targetId > 0) {
    $stmt = $pdo->prepare("
        UPDATE lesson_plan_sessions
        SET title = ?, planned_date = ?, session_time = ?, planned_time = ?,
            duration_minutes = ?, actual_date = ?,
            status = ?, skills = ?, goals = ?, teacher_notes = ?,
            price = ?, subject = ?, is_paid = ?, is_milestone = ?, milestone_label = ?,
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([
        $title, $plannedDate ?: null, $sessionTime ?: null, $sessionTime ?: null,
        $durationMinutes, $actualDate ?: null,
        $status, $skills, $goals, $notes, $price, $subject, $isPaid,
        $isMilestone, $milestoneLabel, $targetId,
    ]);
    echo json_encode(['ok' => true, 'id' => $targetId, 'action' => 'filled_existing'], JSON_UNESCAPED_UNICODE);
    exit;
}

$contractRow = $pdo->prepare("SELECT id FROM student_contracts WHERE student_id = ? LIMIT 1");
$contractRow->execute([$studentId]);
$contract = $contractRow->fetch();

if (!$contract) {
    $pdo->prepare("
        INSERT INTO student_contracts (student_id, total_hours, session_duration_minutes, start_date)
        VALUES (?, 0, ?, ?)
    ")->execute([$studentId, $durationMinutes, date('Y-m-d')]);
    $contractId = (int)$pdo->lastInsertId();
} else {
    $contractId = (int)$contract['id'];
}

$maxNum = $pdo->prepare("SELECT COALESCE(MAX(session_number), 0) FROM lesson_plan_sessions WHERE student_id = ?");
$maxNum->execute([$studentId]);
$nextNum = (int)$maxNum->fetchColumn() + 1;

$ins = $pdo->prepare("
    INSERT INTO lesson_plan_sessions
        (contract_id, student_id, session_number, title, planned_date, session_time,
         planned_time, duration_minutes, actual_date, status, skills, goals, teacher_notes, price, subject,
         is_paid, is_milestone, milestone_label, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
");
$ins->execute([
    $contractId, $studentId, $nextNum, $title,
    $plannedDate ?: null, $sessionTime ?: null,
    $sessionTime ?: null, $durationMinutes, $actualDate ?: null,
    $status, $skills, $goals, $notes, $price, $subject, $isPaid,
    $isMilestone, $milestoneLabel,
]);
$newId = (int)$pdo->lastInsertId();

echo json_encode([
    'ok' => true,
    'id' => $newId,
    'session_number' => $nextNum,
    'action' => 'created',
], JSON_UNESCAPED_UNICODE);
