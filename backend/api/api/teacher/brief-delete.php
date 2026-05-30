<?php
// api/teacher/brief-delete.php — Hard-delete a student brief
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$id = (int)($_POST['id'] ?? 0);
if ($id < 1) json_err('Invalid brief ID');

$stmt = $pdo->prepare("DELETE FROM student_briefs WHERE id = ? LIMIT 1");
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) json_err('Brief not found', 404);

json_ok(['deleted' => $id]);
