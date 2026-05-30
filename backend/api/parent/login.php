<?php
// api/parent/login.php — Parent login via access code
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

portals_ensure_schema($pdo);

$code = strtoupper(trim((string)($_POST['access_code'] ?? '')));
if ($code === '') json_err('Please enter your access code.');

$stmt = $pdo->prepare("
    SELECT id, full_name, status
    FROM parent_contacts
    WHERE access_code = ?
    LIMIT 1
");
$stmt->execute([$code]);
$parent = $stmt->fetch();

if (!$parent) json_err('Access code not found. Please contact your teacher.');
if ($parent['status'] !== 'active') json_err('Your account is inactive. Please contact your teacher.');

session_regenerate_id(true);
$_SESSION['parent_id']   = (int)$parent['id'];
$_SESSION['parent_name'] = (string)$parent['full_name'];

json_ok([
    'parent' => [
        'id'   => (int)$parent['id'],
        'name' => (string)$parent['full_name'],
    ],
]);
