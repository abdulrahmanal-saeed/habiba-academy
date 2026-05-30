<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/articles.php';
require_teacher();

$pdo = get_pdo();
ensure_articles_table($pdo);

/* ─── GET — list all articles ─────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query(
        'SELECT id, title, slug, excerpt, cover_image, status, show_on_homepage,
                sort_order, meta_title, meta_description, created_at, updated_at
           FROM articles ORDER BY sort_order ASC, id DESC'
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$r) {
        $r['show_on_homepage'] = (bool)(int)$r['show_on_homepage'];
    }
    unset($r);

    json_ok(['articles' => $rows]);
}

/* ─── POST ─────────────────────────────────────────────────────────────── */
csrf_validate();
$action = $_POST['action'] ?? '';

/* ── save (create or update) ── */
if ($action === 'save') {
    $id    = (int)($_POST['id'] ?? 0);
    $title = trim($_POST['title'] ?? '');
    $body  = trim($_POST['body']  ?? '');

    if ($title === '') json_err('Title required', 422);
    if ($body  === '') json_err('Body required',  422);

    $candidate = trim($_POST['slug'] ?? '') ?: article_slugify($title);
    $slug      = article_unique_slug($pdo, $candidate, $id ?: null);
    $excerpt   = trim($_POST['excerpt'] ?? '');
    $status    = in_array($_POST['status'] ?? '', ['published','draft'], true)
                     ? $_POST['status'] : 'draft';
    $homepage  = (int)(bool)($_POST['show_on_homepage'] ?? 0);
    $sortOrder = (int)($_POST['sort_order'] ?? 0);
    $metaTitle = trim($_POST['meta_title'] ?? '');
    $metaDesc  = trim($_POST['meta_description'] ?? '');
    $now       = gmdate('Y-m-d H:i:s');

    /* Cover image upload */
    $coverImage = trim($_POST['existing_cover_image'] ?? '');
    if (!empty($_FILES['cover_image']['tmp_name'])) {
        $newCover = save_article_cover($_FILES['cover_image']);
        if ($id && $coverImage) delete_article_cover_file($coverImage);
        $coverImage = $newCover;
    }

    if ($id === 0) {
        $stmt = $pdo->prepare(
            'INSERT INTO articles
               (title, slug, excerpt, body, cover_image, status, show_on_homepage,
                sort_order, meta_title, meta_description, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
        );
        $stmt->execute([$title,$slug,$excerpt,$body,$coverImage ?: null,$status,
                        $homepage,$sortOrder,$metaTitle,$metaDesc,$now,$now]);
        $id = (int)$pdo->lastInsertId();
    } else {
        $stmt = $pdo->prepare(
            'UPDATE articles SET title=?, slug=?, excerpt=?, body=?, cover_image=?,
               status=?, show_on_homepage=?, sort_order=?, meta_title=?,
               meta_description=?, updated_at=? WHERE id=?'
        );
        $stmt->execute([$title,$slug,$excerpt,$body,$coverImage ?: null,$status,
                        $homepage,$sortOrder,$metaTitle,$metaDesc,$now,$id]);
    }

    json_ok(['id' => $id, 'slug' => $slug, 'message' => 'Article saved']);
}

/* ── delete ── */
if ($action === 'delete') {
    $id = (int)($_POST['id'] ?? 0);
    if ($id < 1) json_err('Invalid id', 422);

    $row = fetch_article_by_id($pdo, $id);
    if (!$row) json_err('Not found', 404);

    if ($row['cover_image']) delete_article_cover_file($row['cover_image']);
    $pdo->prepare('DELETE FROM articles WHERE id=?')->execute([$id]);

    json_ok(['message' => 'Article deleted']);
}

/* ── toggle published ↔ draft ── */
if ($action === 'toggle') {
    $id = (int)($_POST['id'] ?? 0);
    if ($id < 1) json_err('Invalid id', 422);

    $row = fetch_article_by_id($pdo, $id);
    if (!$row) json_err('Not found', 404);

    $newStatus = $row['status'] === 'published' ? 'draft' : 'published';
    $pdo->prepare('UPDATE articles SET status=?, updated_at=? WHERE id=?')
        ->execute([$newStatus, gmdate('Y-m-d H:i:s'), $id]);

    $label = $newStatus === 'published' ? 'Published' : 'Draft';
    json_ok(['status' => $newStatus, 'status_label' => $label]);
}

json_err('Unknown action', 400);
