<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/help-center.php';

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$role = trim((string)($_POST['role'] ?? ''));
$tourKey = trim((string)($_POST['tour_key'] ?? ''));
$action = trim((string)($_POST['action'] ?? 'complete'));
if ($tourKey === '' || !isset(help_roles()[$role])) {
    json_err('Invalid tour request.', 422);
}

$userId = match ($role) {
    'student' => (int)($_SESSION['student_id'] ?? 0),
    'parent' => (int)($_SESSION['parent_id'] ?? 0),
    'academy' => (int)($_SESSION['academy_id'] ?? 0),
    'media_buyer' => (int)($_SESSION['media_buyer_id'] ?? 0),
    'teacher' => !empty($_SESSION['teacher_logged']) ? 1 : 0,
    default => 0,
};
if ($userId <= 0) json_err('Not authenticated', 401);

help_ensure_schema($pdo);
$completed = $action === 'complete' ? 1 : 0;
$skipped = $action === 'skip' ? 1 : 0;
$stmt = $pdo->prepare("
    INSERT INTO user_tour_progress (user_id, role, tour_key, completed, skipped, completed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE completed = VALUES(completed), skipped = VALUES(skipped), completed_at = NOW(), updated_at = NOW()
");
$stmt->execute([$userId, $role, $tourKey, $completed, $skipped]);
json_ok();
