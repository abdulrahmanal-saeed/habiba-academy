<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/ai-governance.php';
require_teacher();

$pdo = get_pdo();
ai_governance_ensure($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_err('GET only', 405);
}

$feature = trim((string)($_GET['feature'] ?? ''));
$status  = trim((string)($_GET['status'] ?? ''));

$where  = [];
$params = [];
if ($feature !== '') {
    $where[]  = 'ar.feature_key = ?';
    $params[] = $feature;
}
if (in_array($status, ['success', 'failed', 'cached'], true)) {
    $where[]  = 'ar.status = ?';
    $params[] = $status;
}

$sql = "SELECT ar.id, ar.feature_key, ar.student_id, ar.model, ar.status,
               ar.cost_tokens_input, ar.cost_tokens_output, ar.estimated_cost_usd,
               ar.raw_prompt, ar.output_json, ar.error_message, ar.created_at,
               s.full_name
        FROM ai_requests ar
        LEFT JOIN students s ON s.id = ar.student_id";
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY ar.created_at DESC, ar.id DESC LIMIT 100';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$logs = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

$features = $pdo->query(
    "SELECT DISTINCT feature_key FROM ai_requests ORDER BY feature_key ASC"
)->fetchAll(PDO::FETCH_COLUMN) ?: [];

$count = static fn(string $where) =>
    (int)$pdo->query("SELECT COUNT(*) FROM ai_requests" . ($where ? " WHERE $where" : ''))->fetchColumn();

$apiKey        = (string)(getenv('ANTHROPIC_API_KEY') ?: '');
$apiConfigured = $apiKey !== '';
$apiMasked     = $apiConfigured
    ? ('Configured: ' . substr($apiKey, 0, 6) . str_repeat('*', max(4, strlen($apiKey) - 10)) . substr($apiKey, -4))
    : 'Not configured';

json_ok([
    'logs'     => $logs,
    'features' => array_values($features),
    'health'   => [
        'total'              => $count(''),
        'success'            => $count("status='success'"),
        'failed'             => $count("status='failed'"),
        'cached'             => $count("status='cached'"),
        'api_key_configured' => $apiConfigured,
        'api_key_masked'     => $apiMasked,
    ],
]);
