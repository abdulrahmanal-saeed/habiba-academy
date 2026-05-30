<?php
// api/teacher/video-save.php — Create or update a video
declare(strict_types=1);
require_once __DIR__ . '/../../teacher/_guard.php';
require_once __DIR__ . '/../../lib/videos.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); json_err('Method not allowed');
}
csrf_validate();

$id          = (int)($_POST['id']          ?? 0);
$title       = trim((string)($_POST['title']       ?? ''));
$youtube_url = trim((string)($_POST['youtube_url'] ?? ''));
$description = trim((string)($_POST['description'] ?? ''));
$is_published= isset($_POST['is_published']) && $_POST['is_published'] === '1' ? 1 : 0;
$sort_order  = (int)($_POST['sort_order']  ?? 0);

if ($title === '')       json_err('Title is required', 422);
if ($youtube_url === '') json_err('YouTube URL is required', 422);

$youtube_id = extract_youtube_id($youtube_url);
if ($youtube_id === '') json_err('Invalid YouTube URL — could not extract video ID. Supported formats: watch?v=, youtu.be/, embed/, shorts/', 422);

$thumbnail_url = youtube_thumbnail($youtube_id);
ensure_videos_tables($pdo);

try {
    if ($id === 0) {
        $stmt = $pdo->prepare("
            INSERT INTO videos (title, description, youtube_url, youtube_id, thumbnail_url, is_published, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$title, $description, $youtube_url, $youtube_id, $thumbnail_url, $is_published, $sort_order]);
        json_ok(['id' => (int)$pdo->lastInsertId(), 'message' => 'Video added']);
    } else {
        $stmt = $pdo->prepare("
            UPDATE videos SET title=?, description=?, youtube_url=?, youtube_id=?, thumbnail_url=?, is_published=?, sort_order=?
            WHERE id=?
        ");
        $stmt->execute([$title, $description, $youtube_url, $youtube_id, $thumbnail_url, $is_published, $sort_order, $id]);
        json_ok(['id' => $id, 'message' => 'Video updated']);
    }
} catch (Throwable $e) {
    json_err('DB error: ' . $e->getMessage(), 500);
}
