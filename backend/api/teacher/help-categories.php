<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/help-center.php';
require_once __DIR__ . '/../../config/config/db.php';

start_session();
require_teacher();
help_ensure_schema($pdo);

/* ── GET — list all categories with article counts ───────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $cats = help_categories($pdo, '', false);

    if (!empty($cats)) {
        $ids  = array_column($cats, 'id');
        $in   = implode(',', array_fill(0, count($ids), '?'));
        $cStmt = $pdo->prepare(
            "SELECT category_id, COUNT(*) as cnt FROM help_articles WHERE category_id IN ({$in}) GROUP BY category_id"
        );
        $cStmt->execute($ids);
        $counts = [];
        foreach ($cStmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
            $counts[(int)$row['category_id']] = (int)$row['cnt'];
        }
        foreach ($cats as &$c) {
            $c['active']        = (bool)$c['active'];
            $c['article_count'] = $counts[(int)$c['id']] ?? 0;
        }
        unset($c);
    }

    json_ok(['categories' => $cats]);
    exit;
}

/* ── POST — save category (JSON body) ───────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_validate();
    $raw  = (string)file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) { json_err('invalid JSON'); exit; }

    $id = isset($data['id']) && $data['id'] ? (int)$data['id'] : null;

    $payload = [
        'title'      => trim((string)($data['title'] ?? '')),
        'icon'       => trim((string)($data['icon'] ?? 'HelpCircle')),
        'sort_order' => (int)($data['sort_order'] ?? 0),
        'roles'      => trim((string)($data['roles'] ?? 'student,teacher,parent')),
        'active'     => (bool)($data['active'] ?? true),
    ];

    if ($payload['title'] === '') { json_err('title required'); exit; }

    $savedId = help_save_category($pdo, $payload, $id);
    json_ok(['id' => $savedId]);
    exit;
}

json_err('method not allowed');
