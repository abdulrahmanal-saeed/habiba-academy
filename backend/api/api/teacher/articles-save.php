<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/articles.php';

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

ensure_articles_table($pdo);

$id = (int)($_POST['id'] ?? 0);
$title = trim((string)($_POST['title'] ?? ''));
$slugInput = trim((string)($_POST['slug'] ?? ''));
$excerpt = trim((string)($_POST['excerpt'] ?? ''));
$body = trim((string)($_POST['body'] ?? ''));
$status = trim((string)($_POST['status'] ?? 'draft'));
$status = in_array($status, ['published', 'draft'], true) ? $status : 'draft';
$showOnHomepage = !empty($_POST['show_on_homepage']) ? 1 : 0;
$sortOrder = (int)($_POST['sort_order'] ?? 0);
$metaTitle = trim((string)($_POST['meta_title'] ?? ''));
$metaDescription = trim((string)($_POST['meta_description'] ?? ''));
$existingCover = trim((string)($_POST['existing_cover_image'] ?? ''));

if ($title === '') json_err('Title is required.');
if ($body === '') json_err('Body is required.');

$slug = article_unique_slug($pdo, $slugInput !== '' ? $slugInput : $title, $id);
$coverImage = $existingCover;

if (!empty($_FILES['cover_image']['tmp_name']) && (int)($_FILES['cover_image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
    try {
        $newCover = save_article_cover($_FILES['cover_image']);
        if ($existingCover !== '' && $existingCover !== $newCover) {
            delete_article_cover_file($existingCover);
        }
        $coverImage = $newCover;
    } catch (RuntimeException $e) {
        json_err($e->getMessage());
    }
}

if ($id > 0) {
    $stmt = $pdo->prepare("
        UPDATE articles
        SET title = ?, slug = ?, excerpt = ?, body = ?, cover_image = ?, status = ?,
            show_on_homepage = ?, sort_order = ?, meta_title = ?, meta_description = ?
        WHERE id = ?
    ");
    $stmt->execute([$title, $slug, $excerpt, $body, $coverImage ?: null, $status, $showOnHomepage, $sortOrder, $metaTitle ?: null, $metaDescription ?: null, $id]);
    json_ok(['id' => $id, 'slug' => $slug, 'message' => 'Article updated successfully.']);
}

$stmt = $pdo->prepare("
    INSERT INTO articles (
        title, slug, excerpt, body, cover_image, status, show_on_homepage, sort_order, meta_title, meta_description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([$title, $slug, $excerpt, $body, $coverImage ?: null, $status, $showOnHomepage, $sortOrder, $metaTitle ?: null, $metaDescription ?: null]);
$newId = (int)$pdo->lastInsertId();

json_ok(['id' => $newId, 'slug' => $slug, 'message' => 'Article created successfully.']);
