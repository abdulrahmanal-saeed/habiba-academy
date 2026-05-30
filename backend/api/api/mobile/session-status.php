<?php
// api/mobile/session-status.php - Update session status from mobile app
declare(strict_types=1);
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/lesson-schedule.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');
ensure_lesson_schedule_schema($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$body = [];
$contentType = (string)($_SERVER['CONTENT_TYPE'] ?? '');
if (str_contains($contentType, 'application/json')) {
    $body = (array)(json_decode(file_get_contents('php://input'), true) ?? []);
} else {
    $body = $_POST;
}

$id         = (int)($body['id']          ?? 0);
$status     = trim((string)($body['status']      ?? ''));
$actualDate = trim((string)($body['actual_date'] ?? ''));

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'session id required']);
    exit;
}

$allowedStatuses = lesson_allowed_statuses();
if (!in_array($status, $allowedStatuses, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid status. Use: ' . implode('|', $allowedStatuses)]);
    exit;
}

if ($actualDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $actualDate)) {
    $actualDate = '';
}

if ($status === 'completed') {
    $stmt = $pdo->prepare("
        UPDATE lesson_plan_sessions
        SET status = 'completed', actual_date = ?, is_paid = 1, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$actualDate ?: date('Y-m-d'), $id]);
} elseif ($status === 'planned') {
    $stmt = $pdo->prepare("
        UPDATE lesson_plan_sessions
        SET status = 'planned', actual_date = NULL, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$id]);
} elseif ($status === 'absent') {
    $stmt = $pdo->prepare("
        UPDATE lesson_plan_sessions
        SET status = 'absent', actual_date = ?, is_paid = 1, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$actualDate ?: date('Y-m-d'), $id]);
} elseif ($status === 'cancelled') {
    $stmt = $pdo->prepare("
        UPDATE lesson_plan_sessions
        SET status = 'cancelled', actual_date = NULL, is_paid = 0, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$id]);
} else {
    $stmt = $pdo->prepare("UPDATE lesson_plan_sessions SET status = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$status, $id]);
}

echo json_encode(['ok' => true, 'id' => $id, 'status' => $status], JSON_UNESCAPED_UNICODE);
