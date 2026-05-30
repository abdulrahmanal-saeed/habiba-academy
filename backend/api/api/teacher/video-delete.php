<?php
// api/teacher/video-delete.php — Delete a video
declare(strict_types=1);
require_once __DIR__ . '/../../teacher/_guard.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); json_err('Method not allowed');
}
csrf_validate();

$id = (int)($_POST['id'] ?? 0);
if ($id < 1) json_err('Invalid ID', 422);

try {
    $stmt = $pdo->prepare("DELETE FROM videos WHERE id = ?");
    $stmt->execute([$id]);
    json_ok(['message' => 'Video deleted']);
} catch (Throwable $e) {
    json_err('DB error: ' . $e->getMessage(), 500);
}
