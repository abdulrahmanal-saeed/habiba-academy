<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/media-buyer.php';

start_session();
portals_ensure_schema($pdo);

if (empty($_SESSION['media_buyer_id'])) {
    json_err('Unauthorized', 401);
}

$id = (int)$_SESSION['media_buyer_id'];
media_buyer_ensure_schema($pdo);

$template = $pdo->query(
    "SELECT id, version, content FROM media_buyer_agreement_templates WHERE active = 1 ORDER BY id DESC LIMIT 1"
)->fetch(PDO::FETCH_ASSOC);

if (!$template) {
    json_err('No active agreement template', 404);
}

$acc = $pdo->prepare(
    "SELECT template_id FROM media_buyer_agreement_acceptances WHERE media_buyer_id = ? ORDER BY accepted_at DESC LIMIT 1"
);
$acc->execute([$id]);
$acceptedId = (int)($acc->fetchColumn() ?: 0);
$alreadyAccepted = $acceptedId === (int)$template['id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_validate();
    $input = (array)json_decode((string)file_get_contents('php://input'), true);
    $typedName = trim((string)($input['typed_name'] ?? ''));
    if ($typedName === '') {
        json_err('typed_name is required', 422);
    }
    $pdo->prepare("
        INSERT INTO media_buyer_agreement_acceptances
            (media_buyer_id, template_id, template_version, accepted_content_snapshot, typed_name, ip_hash, user_agent_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ")->execute([
        $id,
        (int)$template['id'],
        (string)$template['version'],
        (string)$template['content'],
        $typedName,
        hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? '')),
        hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? '')),
    ]);
    json_ok([]);
}

json_ok([
    'template'         => [
        'id'      => (int)$template['id'],
        'version' => $template['version'],
        'content' => $template['content'],
    ],
    'already_accepted' => $alreadyAccepted,
]);
