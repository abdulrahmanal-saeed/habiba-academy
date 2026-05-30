<?php
// api/teacher/student-schedule.php — Teacher weekly fixed schedule endpoint
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/lesson-schedule.php';
start_session();

header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

ensure_lesson_schedule_schema($pdo);

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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $studentId = (int)($_GET['student_id'] ?? 0);
    if ($studentId <= 0) json_err('student_id required');
    $stmt = $pdo->prepare("
        SELECT id, student_id, day_of_week, session_time, duration_minutes, price_override, is_active, updated_at
        FROM student_mobile_schedule
        WHERE student_id = ?
        ORDER BY day_of_week ASC
    ");
    $stmt->execute([$studentId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$row) {
        $row['id']               = (int)$row['id'];
        $row['student_id']       = (int)$row['student_id'];
        $row['day_of_week']      = (int)$row['day_of_week'];
        $row['duration_minutes'] = (int)$row['duration_minutes'];
        $row['is_active']        = (int)$row['is_active'];
        $row['price_override']   = $row['price_override'] === null ? null : (float)$row['price_override'];
    }
    unset($row);
    json_ok(['schedules' => $rows]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
csrf_validate();

$studentId       = (int)($_POST['student_id'] ?? 0);
$dayOfWeek       = (int)($_POST['day_of_week'] ?? -1);
$sessionTime     = trim((string)($_POST['session_time'] ?? '16:00'));
$durationMinutes = max(15, min(240, (int)($_POST['duration_minutes'] ?? 60)));
$priceRaw        = $_POST['price_override'] ?? null;
$priceOverride   = $priceRaw === null || $priceRaw === '' ? null : max(0, (float)$priceRaw);
$isActive        = (int)($_POST['is_active'] ?? 0) ? 1 : 0;

if ($studentId <= 0)              json_err('student_id required');
if ($dayOfWeek < 0 || $dayOfWeek > 6) json_err('day_of_week must be 0..6');
if (!preg_match('/^\d{2}:\d{2}/', $sessionTime)) $sessionTime = '16:00';

$stmt = $pdo->prepare("
    INSERT INTO student_mobile_schedule
      (student_id, day_of_week, session_time, duration_minutes, price_override, is_active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      session_time     = VALUES(session_time),
      duration_minutes = VALUES(duration_minutes),
      price_override   = VALUES(price_override),
      is_active        = VALUES(is_active),
      updated_at       = NOW()
");
$stmt->execute([$studentId, $dayOfWeek, $sessionTime, $durationMinutes, $priceOverride, $isActive]);

json_ok(['saved' => true]);
