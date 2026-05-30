<?php
// api/push/subscribe.php — Save browser push subscription
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/push.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$input    = json_decode(file_get_contents('php://input'), true) ?: [];
$endpoint = trim((string)($input['endpoint'] ?? ''));
$p256dh   = trim((string)($input['p256dh']   ?? ''));
$auth     = trim((string)($input['auth']      ?? ''));

if (!$endpoint || !$p256dh || !$auth) json_err('Invalid subscription data');

if (!empty($_SESSION['teacher_logged'])) {
    $userType = 'teacher'; $userId = 0;
} elseif (!empty($_SESSION['student_id'])) {
    $userType = 'student'; $userId = (int)$_SESSION['student_id'];
} else {
    json_err('Not authenticated', 401);
}

push_save_subscription($pdo, $userType, $userId, $endpoint, $p256dh, $auth);
json_ok(['saved' => true]);
