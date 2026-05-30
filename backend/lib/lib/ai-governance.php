<?php
declare(strict_types=1);

if (defined('AI_GOVERNANCE_LOADED')) {
    return;
}
define('AI_GOVERNANCE_LOADED', true);

require_once __DIR__ . '/ai-system.php';
require_once __DIR__ . '/ai-helpers.php';

function ai_governance_column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    ");
    $stmt->execute([$table, $column]);
    return (int)$stmt->fetchColumn() > 0;
}

function ai_governance_add_column(PDO $pdo, string $table, string $column, string $definition): void
{
    if (!ai_governance_column_exists($pdo, $table, $column)) {
        $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
    }
}

function ai_governance_ensure(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }

    ai_ensure_tables($pdo);

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_settings (
            setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
            setting_value TEXT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    ai_governance_add_column($pdo, 'ai_requests', 'provider', "VARCHAR(50) NOT NULL DEFAULT 'anthropic'");
    ai_governance_add_column($pdo, 'ai_requests', 'raw_prompt', 'MEDIUMTEXT NULL');
    ai_governance_add_column($pdo, 'ai_requests', 'raw_response', 'MEDIUMTEXT NULL');
    ai_governance_add_column($pdo, 'ai_requests', 'related_entity_type', 'VARCHAR(80) NULL');
    ai_governance_add_column($pdo, 'ai_requests', 'related_entity_id', 'INT NULL');
    ai_governance_add_column($pdo, 'ai_requests', 'estimated_cost_usd', 'DECIMAL(10,6) NOT NULL DEFAULT 0');
    ai_governance_add_column($pdo, 'ai_requests', 'applied_at', 'DATETIME NULL');

    $defaults = [
        'ai_enabled' => '1',
        'ai_provider' => 'anthropic',
        'ai_model' => 'claude-haiku-4-5-20251001',
        'ai_regenerate_limit_per_day' => '25',
        'ai_cost_per_1k_input' => '0',
        'ai_cost_per_1k_output' => '0',
    ];

    $stmt = $pdo->prepare("
        INSERT IGNORE INTO ai_settings (setting_key, setting_value)
        VALUES (?, ?)
    ");
    foreach ($defaults as $key => $value) {
        $stmt->execute([$key, $value]);
    }

    $done = true;
}

function ai_governance_setting(PDO $pdo, string $key, string $default = ''): string
{
    ai_governance_ensure($pdo);
    $stmt = $pdo->prepare("SELECT setting_value FROM ai_settings WHERE setting_key = ? LIMIT 1");
    $stmt->execute([$key]);
    $value = $stmt->fetchColumn();
    return $value === false ? $default : (string)$value;
}

function ai_governance_save_setting(PDO $pdo, string $key, string $value): void
{
    ai_governance_ensure($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO ai_settings (setting_key, setting_value, updated_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
    ");
    $stmt->execute([$key, $value]);
}

function ai_governance_estimate_tokens(string $text): int
{
    return max(1, (int)ceil(strlen($text) / 4));
}

function ai_governance_estimate_cost(PDO $pdo, int $inputTokens, int $outputTokens): float
{
    $inputRate = (float)ai_governance_setting($pdo, 'ai_cost_per_1k_input', '0');
    $outputRate = (float)ai_governance_setting($pdo, 'ai_cost_per_1k_output', '0');
    return round(($inputTokens / 1000 * $inputRate) + ($outputTokens / 1000 * $outputRate), 6);
}

function ai_governance_check_limit(PDO $pdo, string $featureKey): void
{
    ai_governance_ensure($pdo);
    if (ai_governance_setting($pdo, 'ai_enabled', '1') !== '1') {
        throw new RuntimeException('AI_DISABLED');
    }

    $limit = max(1, (int)ai_governance_setting($pdo, 'ai_regenerate_limit_per_day', '25'));
    $teacherId = ai_teacher_id();
    $sql = "
        SELECT COUNT(*)
        FROM ai_requests
        WHERE feature_key = ?
          AND status = 'success'
          AND created_at >= CURDATE()
    ";
    $params = [$featureKey];
    if ($teacherId !== null) {
        $sql .= " AND teacher_id = ?";
        $params[] = $teacherId;
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    if ((int)$stmt->fetchColumn() >= $limit) {
        throw new RuntimeException('AI_LIMIT_REACHED');
    }
}

function ai_governance_log(PDO $pdo, array $data): int
{
    ai_governance_ensure($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO ai_requests (
            teacher_id, student_id, feature_key, prompt_version_id, model,
            input_hash, input_summary, output_json, status, error_message,
            cost_tokens_input, cost_tokens_output, provider, raw_prompt,
            raw_response, related_entity_type, related_entity_id, estimated_cost_usd
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['teacher_id'] ?? ai_teacher_id(),
        $data['student_id'] ?? null,
        $data['feature_key'] ?? 'unknown',
        $data['prompt_version_id'] ?? null,
        $data['model'] ?? ai_governance_setting($pdo, 'ai_model', 'claude-haiku-4-5-20251001'),
        $data['input_hash'] ?? null,
        $data['input_summary'] ?? null,
        $data['output_json'] ?? null,
        $data['status'] ?? 'success',
        $data['error_message'] ?? null,
        (int)($data['cost_tokens_input'] ?? 0),
        (int)($data['cost_tokens_output'] ?? 0),
        $data['provider'] ?? ai_governance_setting($pdo, 'ai_provider', 'anthropic'),
        $data['raw_prompt'] ?? null,
        $data['raw_response'] ?? null,
        $data['related_entity_type'] ?? null,
        $data['related_entity_id'] ?? null,
        (float)($data['estimated_cost_usd'] ?? 0),
    ]);
    return (int)$pdo->lastInsertId();
}

function ai_governance_logged_claude_json(
    PDO $pdo,
    string $featureKey,
    ?int $studentId,
    string $system,
    string $user,
    int $maxTokens = 2000,
    string $inputSummary = '',
    ?int $relatedEntityId = null,
    ?string $relatedEntityType = null
): array {
    ai_governance_ensure($pdo);
    ai_governance_check_limit($pdo, $featureKey);

    $apiKey = getenv('ANTHROPIC_API_KEY');
    if (!$apiKey) {
        ai_governance_log($pdo, [
            'student_id' => $studentId,
            'feature_key' => $featureKey,
            'status' => 'failed',
            'error_message' => 'NO_API_KEY',
            'raw_prompt' => $system . "\n\n" . $user,
            'input_summary' => $inputSummary,
            'input_hash' => hash('sha256', $system . "\n" . $user),
            'related_entity_id' => $relatedEntityId,
            'related_entity_type' => $relatedEntityType,
        ]);
        throw new RuntimeException('NO_API_KEY');
    }

    $model = ai_governance_setting($pdo, 'ai_model', 'claude-haiku-4-5-20251001');
    $inputTokens = ai_governance_estimate_tokens($system . "\n" . $user);
    $inputHash = hash('sha256', $system . "\n" . $user);
    $rawPrompt = $system . "\n\n--- USER ---\n" . $user;

    $payload = json_encode([
        'model' => $model,
        'max_tokens' => $maxTokens,
        'system' => $system,
        'messages' => [
            ['role' => 'user', 'content' => $user],
        ],
    ], JSON_UNESCAPED_UNICODE);

    $raw = null;
    try {
        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_HTTPHEADER => [
                'x-api-key: ' . $apiKey,
                'anthropic-version: 2023-06-01',
                'content-type: application/json',
            ],
        ]);

        $raw = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            throw new RuntimeException('CURL_ERROR: ' . $err);
        }

        $body = json_decode((string)$raw, true);
        if ($status !== 200 || !isset($body['content'][0]['text'])) {
            $msg = $body['error']['message'] ?? ('API error HTTP ' . $status);
            throw new RuntimeException('API_ERROR: ' . $msg);
        }

        $text = strip_json_fences((string)$body['content'][0]['text']);
        $result = json_decode($text, true);
        if (!is_array($result)) {
            throw new RuntimeException('INVALID_JSON: ' . substr($text, 0, 200));
        }

        $outputTokens = ai_governance_estimate_tokens($text);
        $requestId = ai_governance_log($pdo, [
            'student_id' => $studentId,
            'feature_key' => $featureKey,
            'model' => $model,
            'input_hash' => $inputHash,
            'input_summary' => $inputSummary,
            'output_json' => json_encode($result, JSON_UNESCAPED_UNICODE),
            'status' => 'success',
            'cost_tokens_input' => $inputTokens,
            'cost_tokens_output' => $outputTokens,
            'raw_prompt' => $rawPrompt,
            'raw_response' => $raw,
            'related_entity_id' => $relatedEntityId,
            'related_entity_type' => $relatedEntityType,
            'estimated_cost_usd' => ai_governance_estimate_cost($pdo, $inputTokens, $outputTokens),
        ]);

        return ['result' => $result, 'request_id' => $requestId];
    } catch (RuntimeException $e) {
        ai_governance_log($pdo, [
            'student_id' => $studentId,
            'feature_key' => $featureKey,
            'model' => $model,
            'input_hash' => $inputHash,
            'input_summary' => $inputSummary,
            'output_json' => null,
            'status' => 'failed',
            'error_message' => $e->getMessage(),
            'cost_tokens_input' => $inputTokens,
            'cost_tokens_output' => 0,
            'raw_prompt' => $rawPrompt,
            'raw_response' => $raw,
            'related_entity_id' => $relatedEntityId,
            'related_entity_type' => $relatedEntityType,
        ]);
        throw $e;
    }
}

function ai_governance_json_error(RuntimeException $e): void
{
    $msg = $e->getMessage();
    if ($msg === 'NO_API_KEY') {
        json_err('AI service not configured. Add ANTHROPIC_API_KEY on the server.', 503);
    }
    if ($msg === 'AI_DISABLED') {
        json_err('AI tools are disabled in settings.', 403);
    }
    if ($msg === 'AI_LIMIT_REACHED') {
        json_err('Daily AI limit reached for this tool.', 429);
    }
    json_err('AI generation failed: ' . $msg, 502);
}

function ai_governance_status(PDO $pdo): array
{
    ai_governance_ensure($pdo);
    $apiKey = (string)(getenv('ANTHROPIC_API_KEY') ?: '');
    if ($apiKey === '') {
        return ['status' => 'not configured', 'message' => 'ANTHROPIC_API_KEY is missing.'];
    }

    $savedStatus = ai_governance_setting($pdo, 'ai_connection_status', '');
    if ($savedStatus === 'connection failed') {
        return ['status' => 'connection failed', 'message' => 'The last AI connection test failed. Run Test AI Connection after updating the server key.'];
    }

    return ['status' => 'configured', 'message' => 'API key exists on the server.'];
}

function ai_governance_test_connection(PDO $pdo): array
{
    ai_governance_ensure($pdo);
    $apiKey = (string)(getenv('ANTHROPIC_API_KEY') ?: '');
    if ($apiKey === '') {
        ai_governance_save_setting($pdo, 'ai_connection_status', 'not configured');
        return ['ok' => false, 'status' => 'not configured', 'message' => 'ANTHROPIC_API_KEY is missing.'];
    }

    $model = ai_governance_setting($pdo, 'ai_model', 'claude-haiku-4-5-20251001');
    $payload = json_encode([
        'model' => $model,
        'max_tokens' => 8,
        'messages' => [
            ['role' => 'user', 'content' => 'Reply with OK only.'],
        ],
    ], JSON_UNESCAPED_UNICODE);

    $raw = null;
    try {
        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => [
                'x-api-key: ' . $apiKey,
                'anthropic-version: 2023-06-01',
                'content-type: application/json',
            ],
        ]);
        $raw = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if ($err) {
            throw new RuntimeException('CURL_ERROR: ' . $err);
        }
        $body = json_decode((string)$raw, true);
        if ($status !== 200) {
            $msg = $body['error']['message'] ?? ('HTTP ' . $status);
            throw new RuntimeException($msg);
        }
        ai_governance_save_setting($pdo, 'ai_connection_status', 'configured');
        ai_governance_save_setting($pdo, 'ai_connection_checked_at', date('Y-m-d H:i:s'));
        return ['ok' => true, 'status' => 'configured', 'message' => 'Connection successful.'];
    } catch (RuntimeException $e) {
        ai_governance_save_setting($pdo, 'ai_connection_status', 'connection failed');
        ai_governance_save_setting($pdo, 'ai_connection_checked_at', date('Y-m-d H:i:s'));
        ai_governance_log($pdo, [
            'feature_key' => 'ai_connection_test',
            'model' => $model,
            'status' => 'failed',
            'error_message' => $e->getMessage(),
            'raw_prompt' => 'Reply with OK only.',
            'raw_response' => $raw,
        ]);
        return ['ok' => false, 'status' => 'connection failed', 'message' => $e->getMessage()];
    }
}
