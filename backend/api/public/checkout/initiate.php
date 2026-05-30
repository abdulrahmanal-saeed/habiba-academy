<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/checkout-flow.php';
require_once __DIR__ . '/../../../lib/lib/ziina.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$body = (array)(json_decode((string)file_get_contents('php://input'), true) ?: []);

$planSlug  = trim(h((string)($body['plan_slug']  ?? $body['planSlug']  ?? '')));
$fullName  = trim(h((string)($body['full_name']  ?? $body['name']       ?? '')));
$email     = trim(h((string)($body['email']      ?? '')));
$whatsapp  = trim(h((string)($body['whatsapp']   ?? $body['phone']      ?? '')));
$learner   = trim(h((string)($body['learner_type'] ?? 'adult')));
$goal      = trim(h((string)($body['main_goal']    ?? 'general')));
$contact   = trim(h((string)($body['preferred_contact_method'] ?? 'whatsapp')));

if ($planSlug === '')  json_err('plan_slug is required', 422);
if ($fullName === '')  json_err('full_name is required', 422);
if ($email    === '')  json_err('email is required', 422);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Invalid email address', 422);
if ($whatsapp === '')  json_err('whatsapp / phone is required', 422);

$plan = checkout_plan($pdo, $planSlug);
if (!$plan) json_err('Plan not found', 404);

$order = checkout_create_order($pdo, [
    'full_name'                => $fullName,
    'email'                    => $email,
    'whatsapp'                 => $whatsapp,
    'student_age'              => null,
    'learner_type'             => $learner,
    'main_goal'                => $goal,
    'preferred_contact_method' => $contact,
], $plan);

$checkoutRef = (string)$order['checkout_reference'];
$apiKey      = ziina_api_key();

if ($apiKey !== '') {
    // Build redirect URLs pointing at the React SPA
    $baseUrl  = rtrim((string)(getenv('APP_URL') ?: 'https://mshabibanabil.com'), '/');
    $refParam = '&checkout_ref=' . rawurlencode($checkoutRef);
    $amount   = (int)round((float)$plan['amount_aed'] * 100);
    $payload  = [
        'amount'        => $amount,
        'currency_code' => 'AED',
        'message'       => 'Habiba Nabil Arabic Academy - ' . (string)$plan['title'],
        'success_url'   => $baseUrl . '/checkout/status?status=success' . $refParam,
        'cancel_url'    => $baseUrl . '/checkout/status?status=cancelled' . $refParam,
        'failure_url'   => $baseUrl . '/checkout/status?status=failed' . $refParam,
        'test'          => payment_setting('ziina_test_mode') === '1',
        'allow_tips'    => false,
    ];

    $ch = curl_init(ziina_api_base() . '/payment_intent');
    if (!$ch) json_err('Payment service unavailable', 503);

    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_TIMEOUT    => 20,
    ]);

    $raw      = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false || $raw === '') json_err('Payment gateway error', 502);

    $data = json_decode((string)$raw, true);
    if (!is_array($data)) json_err('Invalid payment response', 502);
    if ($httpCode < 200 || $httpCode >= 300) {
        json_err((string)($data['message'] ?? $data['error'] ?? 'Payment request failed'), 502);
    }

    $paymentUrl  = (string)($data['redirect_url'] ?? $data['payment_url'] ?? $data['url'] ?? '');
    $providerRef = (string)($data['id'] ?? '');

    if ($paymentUrl === '') json_err('Payment URL not returned', 502);

    $pdo->prepare("UPDATE checkout_orders SET payment_reference = ?, updated_at = NOW() WHERE id = ?")
        ->execute([$providerRef !== '' ? $providerRef : null, (int)$order['id']]);
    $pdo->prepare("UPDATE payment_records SET provider_reference = ?, updated_at = NOW() WHERE checkout_order_id = ?")
        ->execute([$providerRef !== '' ? $providerRef : null, (int)$order['id']]);

    checkout_audit($pdo, 'ziina_payment_intent_created', 'checkout_order', (int)$order['id'], null, [
        'provider_reference' => $providerRef,
    ]);
} else {
    // Fallback: use static Ziina URL from settings if API key not yet configured
    $paymentUrl = checkout_payment_url($plan, $order);
    if ($paymentUrl === '') {
        $paymentUrl = 'https://mshabibanabil.com/checkout/status?status=pending&checkout_ref=' . rawurlencode($checkoutRef);
    }
}

json_ok([
    'paymentUrl'         => $paymentUrl,
    'checkoutReference'  => $checkoutRef,
]);
