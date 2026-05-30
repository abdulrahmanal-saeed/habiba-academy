<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lesson-schedule.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_err('Method not allowed', 405);
}
if (empty($_SESSION['teacher_logged'])) {
    json_err('Not authenticated', 401);
}
csrf_validate();

$studentId = (int)($_POST['student_id'] ?? 0);
$month = trim((string)($_POST['month'] ?? ''));

if ($studentId <= 0) {
    json_err('student_id required');
}
if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
    json_err('month must be YYYY-MM');
}

$check = $pdo->prepare("SELECT id FROM students WHERE id = ? LIMIT 1");
$check->execute([$studentId]);
if (!$check->fetch()) {
    json_err('Student not found', 404);
}

try {
    $pdo->beginTransaction();
    $result = generate_monthly_sessions_from_schedule($pdo, $studentId, $month);
    $pdo->commit();
    json_ok($result);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_err('Generate failed: ' . $e->getMessage());
}
