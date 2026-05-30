<?php
// api/mobile/schedule-save.php - Create/update a student's fixed weekly schedule.
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

$studentId = (int)($body['student_id'] ?? 0);
$dayOfWeek = (int)($body['day_of_week'] ?? -1);
$sessionTime = trim((string)($body['session_time'] ?? '16:00'));
$durationMinutes = max(15, min(240, (int)($body['duration_minutes'] ?? 60)));
$priceRaw = $body['price_override'] ?? null;
$priceOverride = $priceRaw === null || $priceRaw === '' ? null : max(0, (float)$priceRaw);
$isActive = (int)($body['is_active'] ?? 0) ? 1 : 0;

if ($studentId <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'student_id is required'], JSON_UNESCAPED_UNICODE);
    exit;
}
if ($dayOfWeek < 0 || $dayOfWeek > 6) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'day_of_week must be 0..6'], JSON_UNESCAPED_UNICODE);
    exit;
}
if (!preg_match('/^\d{2}:\d{2}/', $sessionTime)) $sessionTime = '16:00';

$check = $pdo->prepare("SELECT id FROM students WHERE id = ? LIMIT 1");
$check->execute([$studentId]);
if (!$check->fetch()) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Student not found'], JSON_UNESCAPED_UNICODE);
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

$stmt = $pdo->prepare("
    INSERT INTO student_mobile_schedule
      (student_id, day_of_week, session_time, duration_minutes, price_override, is_active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      session_time = VALUES(session_time),
      duration_minutes = VALUES(duration_minutes),
      price_override = VALUES(price_override),
      is_active = VALUES(is_active),
      updated_at = NOW()
");
$stmt->execute([
    $studentId,
    $dayOfWeek,
    $sessionTime,
    $durationMinutes,
    $priceOverride,
    $isActive,
]);

$out = $pdo->prepare("
    SELECT id, student_id, day_of_week, session_time, duration_minutes,
           price_override, is_active, updated_at
    FROM student_mobile_schedule
    WHERE student_id = ? AND day_of_week = ?
    LIMIT 1
");
$out->execute([$studentId, $dayOfWeek]);
$schedule = $out->fetch(PDO::FETCH_ASSOC);

$schedule['id'] = (int)$schedule['id'];
$schedule['student_id'] = (int)$schedule['student_id'];
$schedule['day_of_week'] = (int)$schedule['day_of_week'];
$schedule['duration_minutes'] = (int)$schedule['duration_minutes'];
$schedule['is_active'] = (int)$schedule['is_active'];
$schedule['price_override'] = $schedule['price_override'] === null ? null : (float)$schedule['price_override'];

echo json_encode(['ok' => true, 'schedule' => $schedule], JSON_UNESCAPED_UNICODE);
