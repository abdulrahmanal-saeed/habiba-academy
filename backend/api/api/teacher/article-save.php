<?php
declare(strict_types=1);
require_once __DIR__ . '/../../teacher/_guard.php';
require_once __DIR__ . '/../../lib/articles.php';
ensure_articles_tables($pdo);

csrf_validate();

$id        = (int)($_POST['id']            ?? 0);
$title     = trim((string)($_POST['title'] ?? ''));
$slug      = trim((string)($_POST['slug']  ?? ''));
$excerpt   = trim((string)($_POST['excerpt']          ?? ''));
$body      = trim((string)($_POST['body']             ?? ''));
$metaTitle = trim((string)($_POST['meta_title']       ?? ''));
$metaDesc  = trim((string)($_POST['meta_description'] ?? ''));
$status    = in_array(($_POST['status'] ?? ''), ['published','draft'], true) ? $_POST['status'] : 'draft';
$showHome  = isset($_POST['show_on_homepage']) ? 1 : 0;
$sortOrder = max(0, min(9999, (int)($_POST['sort_order'] ?? 0)));

if ($title === '') json_err('Title is required.',  422);
if ($body  === '') json_err('Body is required.',   422);

if ($slug === '') $slug = make_slug($title);
$slug = unique_slug($pdo, $slug, $id);

$coverImage = '';
if (!empty($_FILES['cover_image']['name'])) {
    try {
        $coverImage = save_article_image($_FILES['cover_image']);
    } catch (RuntimeException $e) {
        json_err($e->getMessage(), 422);
    }
}

if ($id === 0) {
    $st = $pdo->prepare("
        INSERT INTO articles
            (title, slug, excerpt, body, cover_image, status, show_on_homepage, sort_order, meta_title, meta_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $st->execute([$title, $slug, $excerpt, $body, $coverImage, $status, $showHome, $sortOrder, $metaTitle, $metaDesc]);
    json_ok(['id' => (int)$pdo->lastInsertId(), 'slug' => $slug]);
} else {
    $chk = $pdo->prepare('SELECT id, cover_image FROM articles WHERE id = ? LIMIT 1');
    $chk->execute([$id]);
    $existing = $chk->fetch(PDO::FETCH_ASSOC);
    if (!$existing) json_err('Article not found.', 404);

    // Keep old image if no new one uploaded
    if ($coverImage === '') $coverImage = (string)$existing['cover_image'];

    $st = $pdo->prepare("
        UPDATE articles
        SET title=?, slug=?, excerpt=?, body=?, cover_image=?, status=?,
            show_on_homepage=?, sort_order=?, meta_title=?, meta_description=?, updated_at=NOW()
        WHERE id=?
    ");
    $st->execute([$title, $slug, $excerpt, $body, $coverImage, $status, $showHome, $sortOrder, $metaTitle, $metaDesc, $id]);
    json_ok(['id' => $id, 'slug' => $slug]);
}
