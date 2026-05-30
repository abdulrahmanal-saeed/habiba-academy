<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/videos.php';

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

ensure_videos_table($pdo);

$id = (int)($_POST['id'] ?? 0);
$title = trim((string)($_POST['title'] ?? ''));
$slugInput = trim((string)($_POST['slug'] ?? ''));
$youtubeUrl = trim((string)($_POST['youtube_url'] ?? ''));
$shortDescription = trim((string)($_POST['short_description'] ?? ''));
$status = trim((string)($_POST['status'] ?? 'draft'));
$status = in_array($status, ['published', 'draft'], true) ? $status : 'draft';
$showOnHomepage = !empty($_POST['show_on_homepage']) ? 1 : 0;
$sortOrder = (int)($_POST['sort_order'] ?? 0);

if ($title === '') json_err('Title is required.');
if ($youtubeUrl === '') json_err('YouTube URL is required.');

$videoId = extract_youtube_video_id($youtubeUrl);
if (!$videoId) {
    json_err('Please enter a valid YouTube link.');
}

$slug = video_unique_slug($pdo, $slugInput !== '' ? $slugInput : $title, $id);
$embedUrl = youtube_embed_url($videoId);
$thumbnailUrl = youtube_thumbnail_url($videoId);

if ($id > 0) {
    $stmt = $pdo->prepare("
        UPDATE videos
        SET title = ?, slug = ?, youtube_url = ?, youtube_video_id = ?, youtube_embed_url = ?,
            short_description = ?, thumbnail_url = ?, status = ?, show_on_homepage = ?, sort_order = ?
        WHERE id = ?
    ");
    $stmt->execute([$title, $slug, $youtubeUrl, $videoId, $embedUrl, $shortDescription, $thumbnailUrl, $status, $showOnHomepage, $sortOrder, $id]);
    json_ok(['id' => $id, 'slug' => $slug, 'message' => 'Video updated successfully.']);
}

$stmt = $pdo->prepare("
    INSERT INTO videos (
        title, slug, youtube_url, youtube_video_id, youtube_embed_url, short_description, thumbnail_url, status, show_on_homepage, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([$title, $slug, $youtubeUrl, $videoId, $embedUrl, $shortDescription, $thumbnailUrl, $status, $showOnHomepage, $sortOrder]);
$newId = (int)$pdo->lastInsertId();

json_ok(['id' => $newId, 'slug' => $slug, 'message' => 'Video created successfully.']);
