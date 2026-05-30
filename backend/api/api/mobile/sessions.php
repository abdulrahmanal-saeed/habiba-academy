<?php
// api/mobile/sessions.php - Get sessions for mobile app
declare(strict_types=1);
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/lesson-schedule.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');
ensure_lesson_schedule_schema($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$studentId = (int)($_GET['student_id'] ?? 0);
$dateFrom  = trim((string)($_GET['from'] ?? ''));
$dateTo    = trim((string)($_GET['to']   ?? ''));
$status    = trim((string)($_GET['status'] ?? ''));
$limit     = max(1, min(500, (int)($_GET['limit'] ?? 200)));
$offset    = max(0, (int)($_GET['offset'] ?? 0));

$where  = 'WHERE 1=1';
$params = [];

if ($studentId > 0) {
    $where .= ' AND s.student_id = ?';
    $params[] = $studentId;
}
if ($dateFrom !== '') {
    $where .= ' AND s.planned_date >= ?';
    $params[] = $dateFrom;
}
if ($dateTo !== '') {
    $where .= ' AND s.planned_date <= ?';
    $params[] = $dateTo;
}
if ($status !== '') {
    $where .= ' AND s.status = ?';
    $params[] = $status;
}

$stmt = $pdo->prepare("
    SELECT
        s.id, s.student_id, s.session_number, s.title,
        s.planned_date,
        s.session_time,
        s.actual_date, s.status,
        s.skills, s.goals, s.teacher_notes,
        COALESCE(NULLIF(s.price, 0), 120) AS price,
        COALESCE(NULLIF(s.subject, ''), 'عربي') AS subject,
        COALESCE(s.is_paid, CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS is_paid,
        s.is_milestone, s.milestone_label,
        s.created_at,
        COALESCE(s.updated_at, s.created_at) AS updated_at,
        COALESCE(c.session_duration_minutes, 60) AS duration_minutes,
        st.full_name AS student_name
    FROM lesson_plan_sessions s
    LEFT JOIN student_contracts c ON c.student_id = s.student_id
    LEFT JOIN students st ON st.id = s.student_id
    $where
    ORDER BY s.planned_date ASC, s.session_time ASC, s.session_number ASC
    LIMIT $limit OFFSET $offset
");
$stmt->execute($params);
$sessions = $stmt->fetchAll();

foreach ($sessions as &$se) {
    $se['skills']           = lesson_normalize_skills_csv((string)($se['skills'] ?? ''));
    $se['id']               = (int)$se['id'];
    $se['student_id']       = (int)$se['student_id'];
    $se['session_number']   = (int)$se['session_number'];
    $se['is_paid']          = (int)$se['is_paid'];
    $se['is_milestone']     = (int)$se['is_milestone'];
    $se['duration_minutes'] = (int)$se['duration_minutes'];
    $se['price']            = (float)$se['price'];
}
unset($se);

echo json_encode([
    'ok'       => true,
    'sessions' => $sessions,
    'count'    => count($sessions),
], JSON_UNESCAPED_UNICODE);
