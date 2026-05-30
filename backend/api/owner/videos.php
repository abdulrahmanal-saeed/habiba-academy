<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/videos.php';
require_teacher();

$pdo = get_pdo();
ensure_videos_table($pdo);

/* ─── GET — list all videos ──────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query(
        'SELECT id, title, slug, youtube_url, youtube_video_id, youtube_embed_url,
                short_description, thumbnail_url, status, show_on_homepage,
                sort_order, created_at, updated_at
           FROM videos ORDER BY sort_order ASC, id DESC'
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$r) {
        $r['show_on_homepage'] = (bool)(int)$r['show_on_homepage'];
    }
    unset($r);

    json_ok(['videos' => $rows]);
}

/* ─── POST ─────────────────────────────────────────────────────────────── */
csrf_validate();
$action = $_POST['action'] ?? '';

/* ── save (create or update) ── */
if ($action === 'save') {
    $id          = (int)($_POST['id'] ?? 0);
    $title       = trim($_POST['title']       ?? '');
    $youtubeUrl  = trim($_POST['youtube_url'] ?? '');

    if ($title      === '') json_err('Title required',       422);
    if ($youtubeUrl === '') json_err('YouTube URL required', 422);

    $videoId = extract_youtube_video_id($youtubeUrl);
    if (!$videoId) json_err('Invalid YouTube URL', 422);

    $embedUrl      = youtube_embed_url($videoId);
    $thumbnailUrl  = youtube_thumbnail_url($videoId);
    $candidate     = trim($_POST['slug'] ?? '') ?: video_slugify($title);
    $slug          = video_unique_slug($pdo, $candidate, $id ?: null);
    $shortDesc     = trim($_POST['short_description'] ?? '');
    $status        = in_array($_POST['status'] ?? '', ['published','draft'], true)
                         ? $_POST['status'] : 'draft';
    $homepage      = (int)(bool)($_POST['show_on_homepage'] ?? 0);
    $sortOrder     = (int)($_POST['sort_order'] ?? 0);
    $now           = gmdate('Y-m-d H:i:s');

    if ($id === 0) {
        $stmt = $pdo->prepare(
            'INSERT INTO videos
               (title, slug, youtube_url, youtube_video_id, youtube_embed_url,
                short_description, thumbnail_url, status, show_on_homepage,
                sort_order, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
        );
        $stmt->execute([$title,$slug,$youtubeUrl,$videoId,$embedUrl,
                        $shortDesc,$thumbnailUrl,$status,$homepage,$sortOrder,$now,$now]);
        $id = (int)$pdo->lastInsertId();
    } else {
        $stmt = $pdo->prepare(
            'UPDATE videos SET title=?, slug=?, youtube_url=?, youtube_video_id=?,
               youtube_embed_url=?, short_description=?, thumbnail_url=?, status=?,
               show_on_homepage=?, sort_order=?, updated_at=? WHERE id=?'
        );
        $stmt->execute([$title,$slug,$youtubeUrl,$videoId,$embedUrl,
                        $shortDesc,$thumbnailUrl,$status,$homepage,$sortOrder,$now,$id]);
    }

    json_ok(['id' => $id, 'slug' => $slug, 'message' => 'Video saved']);
}

/* ── delete ── */
if ($action === 'delete') {
    $id = (int)($_POST['id'] ?? 0);
    if ($id < 1) json_err('Invalid id', 422);

    $row = fetch_video_by_id($pdo, $id);
    if (!$row) json_err('Not found', 404);

    $pdo->prepare('DELETE FROM videos WHERE id=?')->execute([$id]);
    json_ok(['message' => 'Video deleted']);
}

/* ── toggle published ↔ draft ── */
if ($action === 'toggle') {
    $id = (int)($_POST['id'] ?? 0);
    if ($id < 1) json_err('Invalid id', 422);

    $row = fetch_video_by_id($pdo, $id);
    if (!$row) json_err('Not found', 404);

    $newStatus = $row['status'] === 'published' ? 'draft' : 'published';
    $pdo->prepare('UPDATE videos SET status=?, updated_at=? WHERE id=?')
        ->execute([$newStatus, gmdate('Y-m-d H:i:s'), $id]);

    $label = $newStatus === 'published' ? 'Published' : 'Draft';
    json_ok(['status' => $newStatus, 'status_label' => $label]);
}

json_err('Unknown action', 400);
