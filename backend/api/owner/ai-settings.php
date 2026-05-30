<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/ai-governance.php';
require_teacher();

$pdo = get_pdo();
ai_governance_ensure($pdo);

/* ── GET ──────────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $keys = [
        'ai_enabled', 'ai_provider', 'ai_model',
        'ai_regenerate_limit_per_day', 'ai_cost_per_1k_input', 'ai_cost_per_1k_output',
    ];
    $settings = [];
    foreach ($keys as $key) {
        $settings[$key] = ai_governance_setting($pdo, $key, '');
    }

    $apiKey = (string)(getenv('ANTHROPIC_API_KEY') ?: '');
    if ($apiKey === '') {
        $apiKeyStatus = 'Not configured';
    } else {
        $apiKeyStatus = 'Configured: '
            . substr($apiKey, 0, 6)
            . str_repeat('*', max(4, strlen($apiKey) - 10))
            . substr($apiKey, -4);
    }

    json_ok([
        'settings'             => $settings,
        'api_key_status'       => $apiKeyStatus,
        'connection'           => ai_governance_status($pdo),
        'connection_checked_at'=> ai_governance_setting($pdo, 'ai_connection_checked_at', ''),
    ]);
}

/* ── POST ─────────────────────────────────────────────────────────────── */
$raw    = file_get_contents('php://input');
$json   = $raw ? json_decode($raw, true) : null;
$action = (string)($json['action'] ?? $_POST['action'] ?? '');

if ($action === 'save') {
    csrf_validate();
    $keys = [
        'ai_enabled', 'ai_provider', 'ai_model',
        'ai_regenerate_limit_per_day', 'ai_cost_per_1k_input', 'ai_cost_per_1k_output',
    ];
    foreach ($keys as $key) {
        $value = trim((string)($json[$key] ?? ''));
        if ($value !== '') {
            ai_governance_save_setting($pdo, $key, $value);
        }
    }
    json_ok(['message' => 'Settings saved.']);
}

if ($action === 'test_connection') {
    csrf_validate();
    $result = ai_governance_test_connection($pdo);
    json_ok($result);
}

json_err('Invalid action', 400);
