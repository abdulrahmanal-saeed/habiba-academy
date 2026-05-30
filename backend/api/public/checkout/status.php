<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/checkout-flow.php';
require_once __DIR__ . '/../../../lib/lib/ziina.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);

$reference  = trim(h((string)($_GET['reference']    ?? $_GET['checkout_ref'] ?? '')));
$routeStatus = trim(h((string)($_GET['status']       ?? '')));

if ($reference === '') json_err('reference is required', 422);

checkout_ensure_tables($pdo);
$result = ziina_update_checkout_status($pdo, $reference, $routeStatus);

if (!$result) json_err('Order not found', 404);

$order = $result['order'];
if (!is_array($order)) json_err('Order not found', 404);

json_ok([
    'status' => (string)$result['mapped_status'],
    'order'  => [
        'checkoutReference' => (string)$order['checkout_reference'],
        'selectedPlan'      => (string)$order['selected_plan'],
        'fullName'          => (string)$order['full_name'],
        'email'             => (string)$order['email'],
        'paymentStatus'     => (string)$order['payment_status'],
        'amountAed'         => (float)$order['amount_aed'],
        'createdAt'         => (string)$order['created_at'],
    ],
]);
