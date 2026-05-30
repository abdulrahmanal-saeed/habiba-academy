<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$mistakeId = (int)($_POST['id'] ?? 0);
if ($mistakeId <= 0) json_err('Invalid mistake ID');

$check = $pdo->prepare("SELECT id FROM student_common_mistakes WHERE id = ? LIMIT 1");
$check->execute([$mistakeId]);
if (!$check->fetch()) json_err('Mistake not found', 404);

$stmt = $pdo->prepare("UPDATE student_common_mistakes SET is_active = 0 WHERE id = ?");
$stmt->execute([$mistakeId]);

json_ok(['deleted' => true]);
