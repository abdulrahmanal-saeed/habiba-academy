<?php
// api/student/toggle-mistake.php — Toggle mastered state of a common mistake
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
csrf_validate();

$student_id  = (int)$_SESSION['student_id'];
$mistake_id  = (int)($_POST['mistake_id']  ?? 0);
$is_mastered = (int)($_POST['is_mastered'] ?? 0);

if ($mistake_id <= 0) json_err('Invalid mistake ID');

// Verify the mistake belongs to this student
$check = $pdo->prepare("SELECT id FROM student_common_mistakes WHERE id = ? AND student_id = ?");
$check->execute([$mistake_id, $student_id]);
if (!$check->fetch()) json_err('Mistake not found', 404);

// Upsert progress
$pdo->prepare("
    INSERT INTO student_common_mistakes_progress (student_id, mistake_id, is_mastered)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE is_mastered = VALUES(is_mastered)
")->execute([$student_id, $mistake_id, $is_mastered]);

json_ok();
