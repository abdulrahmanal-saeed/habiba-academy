<?php
// api/push/unsubscribe.php — Remove a push subscription
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/push.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$input    = json_decode(file_get_contents('php://input'), true) ?: [];
$endpoint = trim((string)($input['endpoint'] ?? ''));
if (!$endpoint) json_err('No endpoint');

push_remove_subscription($pdo, $endpoint);
json_ok(['removed' => true]);
