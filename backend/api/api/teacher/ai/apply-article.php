<?php
declare(strict_types=1);

require_once __DIR__ . '/../../../lib/helpers.php';
require_once __DIR__ . '/../../../lib/articles.php';
require_once __DIR__ . '/../../../lib/learning-audit.php';
require_once __DIR__ . '/../../../lib/ai-governance.php';
require_once __DIR__ . '/../../../config/db.php';

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$article = is_array($input['article'] ?? null) ? $input['article'] : [];
$aiRequestId = (int)($input['ai_request_id'] ?? 0);

$title = trim((string)($article['title'] ?? ''));
$slugInput = trim((string)($article['slug'] ?? $title));
$excerpt = trim((string)($article['excerpt'] ?? ''));
$body = trim((string)($article['body'] ?? ''));
$metaTitle = trim((string)($article['seo_meta_title'] ?? $article['meta_title'] ?? ''));
$metaDescription = trim((string)($article['seo_meta_description'] ?? $article['meta_description'] ?? ''));

if ($title === '') json_err('Article title is required.');
if ($body === '') json_err('Article body is required.');

ensure_articles_table($pdo);
$slug = article_unique_slug($pdo, $slugInput !== '' ? $slugInput : $title);

$stmt = $pdo->prepare("
    INSERT INTO articles (
        title, slug, excerpt, body, status, show_on_homepage, sort_order, meta_title, meta_description
    ) VALUES (?, ?, ?, ?, 'draft', 0, 0, ?, ?)
");
$stmt->execute([
    $title,
    $slug,
    $excerpt,
    $body,
    $metaTitle ?: null,
    $metaDescription ?: null,
]);
$articleId = (int)$pdo->lastInsertId();

if ($aiRequestId > 0) {
    try {
        $upd = $pdo->prepare("UPDATE ai_requests SET applied_at = NOW(), related_entity_type = 'article', related_entity_id = ? WHERE id = ?");
        $upd->execute([$articleId, $aiRequestId]);
    } catch (Throwable $e) {}
}

learning_audit($pdo, 'ai_article_draft_created', 'article', $articleId, [
    'title' => $title,
    'slug' => $slug,
    'ai_request_id' => $aiRequestId ?: null,
], [], 'teacher', isset($_SESSION['teacher_id']) ? (int)$_SESSION['teacher_id'] : null);

json_ok([
    'id' => $articleId,
    'slug' => $slug,
    'message' => 'Article draft created.',
]);
