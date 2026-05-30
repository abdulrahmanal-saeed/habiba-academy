<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$wordId = (int)($_POST['id'] ?? 0);
if ($wordId <= 0) json_err('Invalid weak word ID');

$check = $pdo->prepare("SELECT id FROM student_weak_words WHERE id = ? LIMIT 1");
$check->execute([$wordId]);
if (!$check->fetch()) json_err('Weak word not found', 404);

$stmt = $pdo->prepare("UPDATE student_weak_words SET is_active = 0 WHERE id = ?");
$stmt->execute([$wordId]);

json_ok(['deleted' => true]);
