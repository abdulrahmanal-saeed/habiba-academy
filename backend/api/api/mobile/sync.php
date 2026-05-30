<?php
// api/mobile/sync.php - Full mobile sync: students + lesson plan sessions
declare(strict_types=1);
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/lesson-schedule.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');
ensure_lesson_schedule_schema($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$pdo->exec("
    CREATE TABLE IF NOT EXISTS student_mobile_schedule (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      student_id INT UNSIGNED NOT NULL,
      day_of_week TINYINT UNSIGNED NOT NULL,
      session_time TIME NOT NULL,
      duration_minutes INT NOT NULL DEFAULT 60,
      price_override DECIMAL(10,2) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL DEFAULT NULL,
      UNIQUE KEY uniq_student_day (student_id, day_of_week),
      KEY idx_student_mobile_schedule_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

$since = trim((string)($_GET['since'] ?? ''));
$studentSinceClause = '';
$sessionSinceClause = '';
$studentParams = [];
$sessionParams = [];
if ($since !== '' && preg_match('/^\d{4}-\d{2}-\d{2}/', $since)) {
    $studentSinceClause = 'WHERE COALESCE(st.updated_at, st.created_at) >= ?';
    $sessionSinceClause = 'AND COALESCE(s.updated_at, s.created_at) >= ?';
    $studentParams[] = $since;
    $sessionParams[] = $since;
}

$studentStmt = $pdo->prepare("
    SELECT st.id, st.full_name, st.level, st.login_code, st.email, st.whatsapp,
           st.age, st.country, st.notes, st.is_active, st.last_seen, st.created_at,
           COALESCE(st.color_index, st.id) AS color_index,
           COALESCE(NULLIF(st.default_price, 0), 120) AS default_price,
           COALESCE(NULLIF(st.default_subject, ''), 'عربي') AS default_subject,
           COALESCE(st.parent_name, '') AS parent_name,
           CASE
             WHEN c.total_hours IS NULL OR COALESCE(c.session_duration_minutes, 60) <= 0 THEN NULL
             ELSE CEIL((c.total_hours * 60) / COALESCE(c.session_duration_minutes, 60))
           END AS contract_total_sessions,
           COALESCE(st.updated_at, st.created_at) AS updated_at
    FROM students st
    LEFT JOIN student_contracts c ON c.student_id = st.id
    $studentSinceClause
    ORDER BY st.full_name
");
$studentStmt->execute($studentParams);
$students = $studentStmt->fetchAll();

$sessionStmt = $pdo->prepare("
    SELECT
        s.id, s.student_id, s.session_number, s.title,
        s.planned_date, COALESCE(s.session_time, s.planned_time) AS session_time, s.actual_date, s.status,
        s.skills, s.goals, s.teacher_notes,
        COALESCE(NULLIF(s.price, 0), 120) AS price,
        COALESCE(NULLIF(s.subject, ''), 'عربي') AS subject,
        COALESCE(s.is_paid, CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS is_paid,
        s.is_milestone, s.milestone_label,
        s.created_at,
        COALESCE(s.updated_at, s.created_at) AS updated_at,
        COALESCE(s.duration_minutes, c.session_duration_minutes, 60) AS duration_minutes,
        st.full_name AS student_name
    FROM lesson_plan_sessions s
    LEFT JOIN student_contracts c ON c.student_id = s.student_id
    LEFT JOIN students st ON st.id = s.student_id
    WHERE 1=1 $sessionSinceClause
    ORDER BY s.planned_date ASC, COALESCE(s.session_time, s.planned_time) ASC, s.student_id ASC, s.session_number ASC
");
$sessionStmt->execute($sessionParams);
$sessions = $sessionStmt->fetchAll();

$scheduleStmt = $pdo->prepare("
    SELECT id, student_id, day_of_week, session_time, duration_minutes,
           price_override, is_active, updated_at
    FROM student_mobile_schedule
    ORDER BY student_id ASC, day_of_week ASC
");
$scheduleStmt->execute();
$schedules = $scheduleStmt->fetchAll();

foreach ($students as &$st) {
    $st['id'] = (int)$st['id'];
    $st['is_active'] = (int)$st['is_active'];
    $st['color_index'] = (int)$st['color_index'];
    $st['default_price'] = (float)$st['default_price'];
    $st['contract_total_sessions'] = $st['contract_total_sessions'] === null ? null : (int)$st['contract_total_sessions'];
}
unset($st);

foreach ($sessions as &$se) {
    $se['skills'] = lesson_normalize_skills_csv((string)($se['skills'] ?? ''));
    $se['id'] = (int)$se['id'];
    $se['student_id'] = (int)$se['student_id'];
    $se['session_number'] = (int)$se['session_number'];
    $se['is_paid'] = (int)$se['is_paid'];
    $se['is_milestone'] = (int)$se['is_milestone'];
    $se['duration_minutes'] = (int)$se['duration_minutes'];
    $se['price'] = (float)$se['price'];
}
unset($se);

foreach ($schedules as &$schedule) {
    $schedule['id'] = (int)$schedule['id'];
    $schedule['student_id'] = (int)$schedule['student_id'];
    $schedule['day_of_week'] = (int)$schedule['day_of_week'];
    $schedule['duration_minutes'] = (int)$schedule['duration_minutes'];
    $schedule['is_active'] = (int)$schedule['is_active'];
    $schedule['price_override'] = $schedule['price_override'] === null ? null : (float)$schedule['price_override'];
}
unset($schedule);

echo json_encode([
    'ok' => true,
    'students' => $students,
    'sessions' => $sessions,
    'schedules' => $schedules,
    'synced_at' => gmdate('Y-m-d H:i:s'),
], JSON_UNESCAPED_UNICODE);
