<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/media-buyer.php';
require_teacher();

$pdo = get_pdo();
portals_ensure_schema($pdo);
media_buyer_ensure_schema($pdo);

/* ─── GET ──────────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = trim($_GET['action'] ?? '');

    if ($action === 'agreement') {
        $tpl = $pdo->query("
            SELECT * FROM media_buyer_agreement_templates WHERE active=1 ORDER BY id DESC LIMIT 1
        ")->fetch(PDO::FETCH_ASSOC) ?: [
            'id' => 0, 'title' => 'Media Buyer Commission Agreement',
            'version' => '1.0', 'content' => '', 'requires_reacceptance' => 0,
        ];
        json_ok(['template' => $tpl]);
    }

    $rows = $pdo->query("
        SELECT mb.*,
               COUNT(DISTINCT v.id)                                                     AS visits_count,
               COUNT(DISTINCT ma.visitor_id)                                            AS attributed_visitors,
               COUNT(DISTINCT CASE WHEN co.payment_status='paid' THEN co.id END)       AS paid_orders_count,
               COALESCE(SUM(DISTINCT CASE WHEN co.payment_status='paid' THEN co.amount_aed ELSE 0 END), 0) AS paid_amount
        FROM media_buyers mb
        LEFT JOIN media_buyer_visits v   ON v.media_buyer_id  = mb.id
        LEFT JOIN marketing_attributions ma ON ma.media_buyer_id = mb.id AND ma.expires_at >= NOW()
        LEFT JOIN checkout_orders co     ON co.media_buyer_id  = mb.id
        GROUP BY mb.id
        ORDER BY mb.created_at DESC
    ")->fetchAll(PDO::FETCH_ASSOC) ?: [];

    foreach ($rows as &$r) {
        $r['visits_count']        = (int)$r['visits_count'];
        $r['attributed_visitors'] = (int)$r['attributed_visitors'];
        $r['paid_orders_count']   = (int)$r['paid_orders_count'];
        $r['paid_amount']         = (float)$r['paid_amount'];
        $r['commission_rate']     = $r['commission_rate'] !== null ? (float)$r['commission_rate'] : null;
    }
    unset($r);

    json_ok(['buyers' => $rows]);
}

/* ─── POST ─────────────────────────────────────────────────────────────── */
csrf_validate();
$action = trim($_POST['action'] ?? '');

if ($action === 'save') {
    $name = trim($_POST['full_name'] ?? '');
    if ($name === '') json_err('Name is required', 422);

    $email    = trim($_POST['email'] ?? '');
    $whatsapp = trim($_POST['whatsapp'] ?? '');
    $rate     = trim($_POST['commission_rate'] ?? '');
    $status   = in_array($_POST['status'] ?? '', ['active','paused','inactive'], true)
                    ? (string)$_POST['status'] : 'active';
    $notes    = trim($_POST['notes'] ?? '');

    $accessCode = portals_generate_access_code('MB');
    $pdo->prepare("
        INSERT INTO media_buyers (full_name, email, whatsapp, commission_rate, status, notes, access_code, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ")->execute([
        $name, $email ?: null, $whatsapp ?: null,
        $rate === '' ? null : (float)$rate,
        $status, $notes ?: null, $accessCode,
    ]);

    json_ok(['id' => (int)$pdo->lastInsertId(), 'message' => 'Media buyer saved']);
}

if ($action === 'delete') {
    $id = (int)($_POST['buyer_id'] ?? 0);
    if ($id < 1) json_err('Invalid id', 422);
    $pdo->prepare("UPDATE media_buyers SET status='inactive', updated_at=NOW() WHERE id=?")
        ->execute([$id]);
    json_ok(['message' => 'Media buyer deactivated']);
}

if ($action === 'save_agreement') {
    $title   = trim($_POST['title'] ?? '');
    $version = trim($_POST['version'] ?? '');
    $content = trim($_POST['content'] ?? '');

    if ($title === '' || $version === '' || $content === '') json_err('All fields required', 422);

    $requires = !empty($_POST['requires_reacceptance']) ? 1 : 0;
    $pdo->exec("UPDATE media_buyer_agreement_templates SET active=0");
    $pdo->prepare("
        INSERT INTO media_buyer_agreement_templates (title, version, content, active, requires_reacceptance, updated_at)
        VALUES (?, ?, ?, 1, ?, NOW())
    ")->execute([$title, $version, $content, $requires]);

    json_ok(['message' => 'Agreement template saved']);
}

json_err('Unknown action', 400);
