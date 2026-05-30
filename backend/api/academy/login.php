<?php
// api/academy/login.php — Academy login via access code
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
    SELECT id, name, status
    FROM academies
    WHERE access_code = ?
    LIMIT 1
");
$stmt->execute([$code]);
$academy = $stmt->fetch();

if (!$academy) json_err('Access code not found. Please contact your administrator.');
if ($academy['status'] !== 'active') json_err('Your academy account is inactive. Please contact your administrator.');

session_regenerate_id(true);
$_SESSION['academy_id']   = (int)$academy['id'];
$_SESSION['academy_name'] = (string)$academy['name'];

json_ok([
    'academy' => [
        'id'   => (int)$academy['id'],
        'name' => (string)$academy['name'],
    ],
]);
