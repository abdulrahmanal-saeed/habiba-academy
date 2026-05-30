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
if ($id <= 0) json_err('Invalid video.');

$video = fetch_video_by_id($pdo, $id);
if (!$video) json_err('Video not found.', 404);

$nextStatus = ((string)$video['status'] === 'published') ? 'draft' : 'published';
$stmt = $pdo->prepare("UPDATE videos SET status = ? WHERE id = ?");
$stmt->execute([$nextStatus, $id]);

json_ok([
    'status' => $nextStatus,
    'status_label' => $nextStatus === 'published' ? 'Published' : 'Draft',
]);
