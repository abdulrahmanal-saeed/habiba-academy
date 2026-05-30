<?php
// api/student/login.php — Student login (code-based, no CSRF required)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/notify.php';
require_once __DIR__ . '/../../lib/lib/push.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$code = strtoupper(trim((string)($_POST['login_code'] ?? '')));
if ($code === '') json_err('Please enter your student code.');

$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS login_rate_limits (
        ip VARCHAR(45) NOT NULL,
        attempts TINYINT UNSIGNED NOT NULL DEFAULT 1,
        window_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (ip)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->prepare("DELETE FROM login_rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 15 MINUTE)")->execute();
    $rlRow = $pdo->prepare("SELECT attempts FROM login_rate_limits WHERE ip = ? LIMIT 1");
    $rlRow->execute([$ip]);
    $rl = $rlRow->fetch();
    if ($rl && (int)$rl['attempts'] >= 5) {
        json_err('Too many failed attempts. Please try again in 15 minutes.', 429);
    }
} catch (Throwable) {}

$stmt = $pdo->prepare("SELECT id, full_name, login_code, level, is_active FROM students WHERE login_code = ? LIMIT 1");
$stmt->execute([$code]);
$student = $stmt->fetch();

if (!$student) {
    try {
        $pdo->prepare("
            INSERT INTO login_rate_limits (ip, attempts, window_start) VALUES (?, 1, NOW())
            ON DUPLICATE KEY UPDATE attempts = attempts + 1
        ")->execute([$ip]);
    } catch (Throwable) {}
    json_err('Code not found. Please check and try again.');
}

if (!(int)$student['is_active']) {
    json_err('Your account is inactive. Please contact your teacher.');
}

try {
    $pdo->prepare("DELETE FROM login_rate_limits WHERE ip = ?")->execute([$ip]);
} catch (Throwable) {}

session_regenerate_id(true);
$_SESSION['student_id']             = (int)$student['id'];
$_SESSION['student_name']           = (string)$student['full_name'];
$_SESSION['student_code']           = (string)$student['login_code'];
$_SESSION['lt_existing_student_id'] = (int)$student['id'];

$pdo->prepare("UPDATE students SET last_seen = NOW() WHERE id = ?")->execute([(int)$student['id']]);

try {
    notify_teacher('Student login - ' . $student['full_name'], [
        ['icon' => '👤', 'label' => 'Student', 'value' => $student['full_name']],
        ['icon' => '🔑', 'label' => 'Code',    'value' => $student['login_code']],
        ['icon' => '🕐', 'label' => 'Time',    'value' => format_app_datetime(date('Y-m-d H:i:s'))],
    ]);
} catch (Throwable) {}

try {
    push_notify_teacher(
        $pdo,
        'Student login: ' . $student['full_name'],
        'Student "' . $student['full_name'] . '" (' . $student['login_code'] . ') visited the platform.',
        '/teacher/student-details.php?id=' . (int)$student['id']
    );
} catch (Throwable) {}

json_ok([
    'student' => [
        'id'    => (int)$student['id'],
        'name'  => (string)$student['full_name'],
        'level' => (string)($student['level'] ?? ''),
    ],
]);
