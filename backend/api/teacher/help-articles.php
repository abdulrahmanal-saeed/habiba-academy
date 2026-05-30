<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/help-center.php';
require_once __DIR__ . '/../../config/config/db.php';

start_session();
require_teacher();
help_ensure_schema($pdo);

/* ── GET — list articles ──────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $filters = [];
    if (isset($_GET['status']))      $filters['status']      = (string)$_GET['status'];
    if (isset($_GET['category_id'])) $filters['category_id'] = (int)$_GET['category_id'];
    if (isset($_GET['featured']))    $filters['featured']    = (string)$_GET['featured'];
    if (isset($_GET['q']))           $filters['q']           = (string)$_GET['q'];

    $articles = help_list_articles($pdo, $filters);

    if (!empty($articles)) {
        $catIds = array_unique(array_column($articles, 'category_id'));
        $in     = implode(',', array_fill(0, count($catIds), '?'));
        $cStmt  = $pdo->prepare("SELECT id, title FROM help_categories WHERE id IN ({$in})");
        $cStmt->execute($catIds);
        $catMap = $cStmt->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
        foreach ($articles as &$a) {
            $a['category_title'] = $catMap[$a['category_id']] ?? '';
            $a['featured']       = (bool)$a['featured'];
        }
        unset($a);
    }

    json_ok(['articles' => $articles, 'total' => count($articles)]);
    exit;
}

/* ── POST — save article (JSON body) or delete (FormData action=delete) */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    /* Delete via FormData */
    if (str_contains($contentType, 'multipart/form-data') || str_contains($contentType, 'application/x-www-form-urlencoded')) {
        csrf_validate();
        $action    = trim((string)($_POST['action'] ?? ''));
        $articleId = (int)($_POST['id'] ?? 0);
        if ($action !== 'delete' || $articleId <= 0) { json_err('invalid request'); exit; }
        $pdo->prepare('DELETE FROM help_articles WHERE id = ?')->execute([$articleId]);
        json_ok(['deleted' => $articleId]);
        exit;
    }

    /* Save via JSON body */
    csrf_validate();
    $raw  = (string)file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) { json_err('invalid JSON'); exit; }

    $id = isset($data['id']) && $data['id'] ? (int)$data['id'] : null;

    $payload = [
        'category_id'   => (int)($data['category_id'] ?? 0),
        'title'         => trim((string)($data['title'] ?? '')),
        'content'       => (string)($data['content'] ?? ''),
        'visible_roles' => trim((string)($data['visible_roles'] ?? 'student')),
        'featured'      => (bool)($data['featured'] ?? false),
        'status'        => in_array($data['status'] ?? '', ['published', 'draft'], true) ? $data['status'] : 'draft',
        'sort_order'    => (int)($data['sort_order'] ?? 0),
    ];

    if ($payload['title'] === '') { json_err('title required'); exit; }

    $savedId = help_save_article($pdo, $payload, $id);

    $slugStmt = $pdo->prepare('SELECT slug FROM help_articles WHERE id = ?');
    $slugStmt->execute([$savedId]);
    $slug = (string)($slugStmt->fetchColumn() ?: '');

    json_ok(['id' => $savedId, 'slug' => $slug]);
    exit;
}

json_err('method not allowed');
