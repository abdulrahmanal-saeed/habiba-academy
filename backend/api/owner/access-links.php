<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_teacher();

$pdo = get_pdo();
portals_ensure_schema($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_err('GET only', 405);
}

$base = rtrim((string)(getenv('APP_BASE_URL') ?: 'https://mshabibanabil.com'), '/');

$academies = $pdo->query("
    SELECT name, contact_name AS sub, access_code
    FROM academies WHERE status='active' ORDER BY created_at DESC
")->fetchAll(PDO::FETCH_ASSOC) ?: [];

$parents = $pdo->query("
    SELECT full_name AS name, whatsapp AS sub, access_code
    FROM parent_contacts WHERE status='active' ORDER BY created_at DESC
")->fetchAll(PDO::FETCH_ASSOC) ?: [];

$buyers = $pdo->query("
    SELECT full_name AS name, email AS sub, access_code
    FROM media_buyers WHERE status='active' ORDER BY created_at DESC
")->fetchAll(PDO::FETCH_ASSOC) ?: [];

json_ok([
    'base_url'     => $base,
    'academies'    => $academies,
    'parents'      => $parents,
    'media_buyers' => $buyers,
    'login_urls'   => [
        'academy'     => $base . '/academy/login.php',
        'parent'      => $base . '/parent/login.php',
        'media_buyer' => $base . '/media-buyer/login.php',
    ],
]);
