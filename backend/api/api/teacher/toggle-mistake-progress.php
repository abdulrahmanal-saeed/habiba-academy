<?php
// api/teacher/toggle-mistake-progress.php - Teacher marks a common mistake as handled/not handled
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$studentId = (int)($_POST['student_id'] ?? 0);
$mistakeId = (int)($_POST['mistake_id'] ?? 0);
$isMastered = (int)($_POST['is_mastered'] ?? 0) ? 1 : 0;

if ($studentId <= 0) json_err('Invalid student ID');
if ($mistakeId <= 0) json_err('Invalid mistake ID');

$check = $pdo->prepare("SELECT id FROM student_common_mistakes WHERE id = ? AND student_id = ? AND is_active = 1");
$check->execute([$mistakeId, $studentId]);
if (!$check->fetch()) json_err('Mistake not found', 404);

$stmt = $pdo->prepare("
    INSERT INTO student_common_mistakes_progress (student_id, mistake_id, is_mastered)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE is_mastered = VALUES(is_mastered)
");
$stmt->execute([$studentId, $mistakeId, $isMastered]);

json_ok(['is_mastered' => $isMastered]);
