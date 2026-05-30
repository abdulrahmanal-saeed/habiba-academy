<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/helpers.php';
require_once __DIR__ . '/../../../lib/ai-system.php';
require_once __DIR__ . '/../../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$aiRequestId = (int)($_POST['ai_request_id'] ?? 0);
$studentId = (int)($_POST['student_id'] ?? 0);
$featureKey = trim((string)($_POST['feature_key'] ?? 'unknown'));
$action = trim((string)($_POST['action'] ?? 'ignored'));
$original = (string)($_POST['original_suggestion'] ?? '');
$final = (string)($_POST['final_value'] ?? '');

if ($studentId <= 0) json_err('Invalid student ID');

try {
    $id = ai_record_suggestion_action($pdo, $aiRequestId, $studentId, $featureKey, $action, $original, $final);
    json_ok(['id' => $id]);
} catch (Throwable $e) {
    json_err('Failed to record suggestion action: ' . $e->getMessage(), 500);
}
