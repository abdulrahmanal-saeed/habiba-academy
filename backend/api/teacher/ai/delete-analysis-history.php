<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/ai-system.php';
require_once __DIR__ . '/../../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) json_err('Invalid analysis ID');

try {
    ai_ensure_tables($pdo);
    $stmt = $pdo->prepare("DELETE FROM student_ai_analysis_history WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    if ($stmt->rowCount() < 1) json_err('Analysis snapshot not found', 404);
    json_ok(['deleted' => true, 'id' => $id]);
} catch (Throwable $e) {
    json_err('Failed to delete analysis: ' . $e->getMessage(), 500);
}
