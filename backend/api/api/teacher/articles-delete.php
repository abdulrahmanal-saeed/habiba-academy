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
if ($id <= 0) json_err('Invalid article.');

$article = fetch_article_by_id($pdo, $id);
if (!$article) json_err('Article not found.', 404);

$stmt = $pdo->prepare("DELETE FROM articles WHERE id = ?");
$stmt->execute([$id]);
delete_article_cover_file((string)($article['cover_image'] ?? ''));

json_ok(['message' => 'Article deleted successfully.']);
