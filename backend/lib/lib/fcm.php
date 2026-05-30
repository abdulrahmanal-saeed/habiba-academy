<?php
// lib/fcm.php - Firebase Cloud Messaging HTTP v1 sender for mobile app notifications.
declare(strict_types=1);
require_once __DIR__ . '/communications.php';

function fcm_ensure_tables(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS mobile_fcm_tokens (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_type ENUM('teacher','student') NOT NULL DEFAULT 'teacher',
            user_id INT NOT NULL DEFAULT 0,
            token VARCHAR(255) NOT NULL UNIQUE,
            platform VARCHAR(40) NOT NULL DEFAULT 'android',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen DATETIME NULL DEFAULT NULL,
            INDEX idx_mobile_fcm_user (user_type, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $done = true;
}

function fcm_b64u(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function fcm_service_account(): ?array {
    $json = trim((string)(getenv('FIREBASE_SERVICE_ACCOUNT_JSON') ?: ''));
    if ($json === '') {
        $file = trim((string)(getenv('FIREBASE_SERVICE_ACCOUNT_FILE') ?: dirname(__DIR__, 2) . '/firebase-service-account.json'));
        if (is_file($file)) {
            $json = (string)file_get_contents($file);
        }
    }
    if ($json === '') return null;
    $data = json_decode($json, true);
    return is_array($data) ? $data : null;
}

function fcm_access_token(): ?string {
    $sa = fcm_service_account();
    if (!$sa || empty($sa['client_email']) || empty($sa['private_key'])) return null;

    $now = time();
    $header = fcm_b64u((string)json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $claims = fcm_b64u((string)json_encode([
        'iss' => $sa['client_email'],
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
    ]));
    $toSign = $header . '.' . $claims;
    $signature = '';
    if (!openssl_sign($toSign, $signature, (string)$sa['private_key'], 'sha256WithRSAEncryption')) {
        return null;
    }
    $jwt = $toSign . '.' . fcm_b64u($signature);

    if (!function_exists('curl_init')) return null;
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT => 4,
    ]);
    $response = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code < 200 || $code >= 300 || !is_string($response)) return null;
    $payload = json_decode($response, true);
    return is_array($payload) && !empty($payload['access_token']) ? (string)$payload['access_token'] : null;
}

function fcm_project_id(): ?string {
    $sa = fcm_service_account();
    if ($sa && !empty($sa['project_id'])) return (string)$sa['project_id'];
    $project = trim((string)(getenv('FIREBASE_PROJECT_ID') ?: ''));
    return $project !== '' ? $project : null;
}

function fcm_send_to_token(string $token, string $title, string $body, string $url = '', string $waUrl = '', string $waMessage = ''): bool {
    $projectId = fcm_project_id();
    $accessToken = fcm_access_token();
    if (!$projectId || !$accessToken || !function_exists('curl_init')) return false;

    $message = [
        'message' => [
            'token' => $token,
            'data' => [
                'title' => $title,
                'body' => $body,
                'url' => $url,
                'wa_url' => $waUrl,
                'wa_message' => $waMessage,
            ],
            'android' => [
                'priority' => 'HIGH',
                'notification' => [
                    'channel_id' => 'habiba_teacher_alerts',
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ],
            ],
        ],
    ];

    $ch = curl_init('https://fcm.googleapis.com/v1/projects/' . rawurlencode($projectId) . '/messages:send');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($message, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json; charset=utf-8',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT => 4,
    ]);
    curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $code >= 200 && $code < 300;
}

function fcm_notify(PDO $pdo, string $userType, int $userId, string $title, string $body, string $url = '', string $waUrl = '', string $waMessage = ''): void {
    try {
        fcm_ensure_tables($pdo);
        $stmt = $pdo->prepare("SELECT token FROM mobile_fcm_tokens WHERE user_type = ? AND user_id = ?");
        $stmt->execute([$userType, $userId]);
        $tokens = $stmt->fetchAll(PDO::FETCH_COLUMN);
        foreach ($tokens as $token) {
            $ok = fcm_send_to_token((string)$token, $title, $body, $url, $waUrl, $waMessage);
            communications_log_push($pdo, $userType, $userId, $title, $body, (string)$token, $ok ? 'sent' : 'failed');
        }
    } catch (Throwable) {}
}
