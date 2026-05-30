<?php
// api/teacher/item-status.php — Change status of homework / scenario / review
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);
csrf_validate();

$type   = trim((string)($_POST['type']   ?? ''));
$id     = (int)($_POST['id']     ?? 0);
$status = trim((string)($_POST['status'] ?? ''));

if ($id <= 0)          json_err('Invalid ID');
if (!in_array($status, ['draft','published','closed'], true)) json_err('Invalid status');

switch ($type) {
    case 'homework':
        $stmt = $pdo->prepare("UPDATE homeworks SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        if ($stmt->rowCount() === 0) json_err('Homework not found', 404);
        break;
    case 'scenario':
        $stmt = $pdo->prepare("UPDATE scenarios SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        if ($stmt->rowCount() === 0) json_err('Scenario not found', 404);
        break;
    case 'review':
        $stmt = $pdo->prepare("UPDATE student_reviews SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        if ($stmt->rowCount() === 0) json_err('Review not found', 404);
        break;
    default:
        json_err('Invalid type');
}

json_ok(['type' => $type, 'id' => $id, 'status' => $status]);
