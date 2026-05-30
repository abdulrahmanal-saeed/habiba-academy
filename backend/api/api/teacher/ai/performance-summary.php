<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/helpers.php';
require_once __DIR__ . '/../../../lib/ai-system.php';
require_once __DIR__ . '/../../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$studentId = (int)($_GET['student_id'] ?? 0);
if ($studentId <= 0) json_err('Invalid student ID');

try {
    json_ok(['performance' => ai_performance_summary($pdo, $studentId)]);
} catch (Throwable $e) {
    json_err('Failed to build performance summary: ' . $e->getMessage(), 500);
}
