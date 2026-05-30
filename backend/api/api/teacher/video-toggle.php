<?php
// api/teacher/video-toggle.php — Toggle is_published for a video
declare(strict_types=1);
require_once __DIR__ . '/../../teacher/_guard.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); json_err('Method not allowed');
}
csrf_validate();

$id = (int)($_POST['id'] ?? 0);
if ($id < 1) json_err('Invalid ID', 422);

try {
    $stmt = $pdo->prepare("UPDATE videos SET is_published = 1 - is_published WHERE id = ?");
    $stmt->execute([$id]);
    $row = $pdo->prepare("SELECT is_published FROM videos WHERE id = ?");
    $row->execute([$id]);
    $r = $row->fetch();
    json_ok(['is_published' => $r ? (int)$r['is_published'] : 0]);
} catch (Throwable $e) {
    json_err('DB error: ' . $e->getMessage(), 500);
}
