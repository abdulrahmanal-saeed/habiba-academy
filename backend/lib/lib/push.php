<?php
// lib/push.php — Web Push (VAPID) — pure PHP, no external libraries
declare(strict_types=1);
require_once __DIR__ . '/fcm.php';

// ── Helpers ──────────────────────────────────────────────────────────────────

function push_b64u_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function push_b64u_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Convert DER-encoded ECDSA signature to raw r||s (64 bytes for P-256).
 */
function push_der_to_raw_sig(string $der): string {
    $pos = 0;
    if (strlen($der) < 6 || ord($der[$pos++]) !== 0x30) return '';
    $totLen = ord($der[$pos++]);
    if ($totLen & 0x80) { $extra = $totLen & 0x7f; $pos += $extra; } // long form

    if (ord($der[$pos++]) !== 0x02) return '';
    $rLen = ord($der[$pos++]);
    $r = substr($der, $pos, $rLen); $pos += $rLen;

    if (ord($der[$pos++]) !== 0x02) return '';
    $sLen = ord($der[$pos++]);
    $s = substr($der, $pos, $sLen);

    // Normalise to 32 bytes (remove leading 0x00 padding, then left-pad)
    $r = str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT);
    $s = str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);
    return $r . $s;
}

/**
 * Build a VAPID JWT for the given endpoint audience.
 */
function push_vapid_jwt(string $endpoint, string $subject, string $privatePem): string {
    $parts   = parse_url($endpoint);
    $audience = ($parts['scheme'] ?? 'https') . '://' . ($parts['host'] ?? '');

    $header  = push_b64u_encode((string)json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
    $payload = push_b64u_encode((string)json_encode([
        'aud' => $audience,
        'exp' => time() + 3600,
        'sub' => $subject,
    ]));
    $toSign = $header . '.' . $payload;

    $privKey = openssl_pkey_get_private($privatePem);
    if (!$privKey) return '';
    openssl_sign($toSign, $derSig, $privKey, 'SHA256');
    $rawSig = push_der_to_raw_sig($derSig);
    if (strlen($rawSig) !== 64) return '';

    return $toSign . '.' . push_b64u_encode($rawSig);
}

/**
 * Send a "ping" push (empty body) to one endpoint.
 * Returns false if the subscription is dead (410/404) so caller can purge it.
 */
function push_ping(string $endpoint, int $ttl = 86400): bool {
    $vapidPublic  = trim((string)(getenv('VAPID_PUBLIC_KEY')  ?: ''));
    $vapidPrivate = trim((string)(getenv('VAPID_PRIVATE_PEM') ?: ''));
    $vapidSubject = trim((string)(getenv('VAPID_SUBJECT')     ?: 'mailto:info@mshabibanabil.com'));

    if (!$vapidPublic || !$vapidPrivate || !function_exists('curl_init')) return false;

    $jwt = push_vapid_jwt($endpoint, $vapidSubject, $vapidPrivate);
    if (!$jwt) return false;

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => '',
        CURLOPT_HTTPHEADER     => [
            'Authorization: vapid t=' . $jwt . ',k=' . $vapidPublic,
            'TTL: ' . $ttl,
            'Content-Length: 0',
            'Content-Type: application/octet-stream',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // 201/200 = OK | 410/404 = subscription gone → purge
    if ($code === 410 || $code === 404) return false;
    return true; // treat anything else as alive
}

// ── DB ───────────────────────────────────────────────────────────────────────

function push_ensure_tables(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id        INT AUTO_INCREMENT PRIMARY KEY,
            user_type ENUM('teacher','student') NOT NULL,
            user_id   INT NOT NULL DEFAULT 0,
            endpoint  TEXT NOT NULL,
            p256dh    VARCHAR(512) NOT NULL,
            auth_key  VARCHAR(256) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_ep (endpoint(512))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS push_notifications (
            id        INT AUTO_INCREMENT PRIMARY KEY,
            user_type ENUM('teacher','student') NOT NULL,
            user_id   INT NOT NULL DEFAULT 0,
            title     VARCHAR(255) NOT NULL,
            body      TEXT NOT NULL,
            url       VARCHAR(512) DEFAULT NULL,
            wa_url    VARCHAR(512) DEFAULT NULL,
            wa_message TEXT DEFAULT NULL,
            icon      VARCHAR(255) DEFAULT '/assets/img/icon-192.png',
            shown_at  DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_type, user_id, shown_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM push_notifications")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('wa_message', $cols, true)) {
            $pdo->exec("ALTER TABLE push_notifications ADD COLUMN wa_message TEXT DEFAULT NULL AFTER wa_url");
        }
    } catch (Throwable) {}
    $done = true;
}

function push_save_subscription(PDO $pdo, string $userType, int $userId, string $endpoint, string $p256dh, string $auth): void {
    push_ensure_tables($pdo);
    $pdo->prepare("
        INSERT INTO push_subscriptions (user_type, user_id, endpoint, p256dh, auth_key)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE user_type=VALUES(user_type), user_id=VALUES(user_id),
                                p256dh=VALUES(p256dh), auth_key=VALUES(auth_key)
    ")->execute([$userType, $userId, $endpoint, $p256dh, $auth]);
}

function push_remove_subscription(PDO $pdo, string $endpoint): void {
    push_ensure_tables($pdo);
    $pdo->prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")->execute([$endpoint]);
}

function push_queue_notification(PDO $pdo, string $userType, int $userId, string $title, string $body, string $url = '', string $waUrl = '', string $waMessage = ''): void {
    push_ensure_tables($pdo);
    $urlValue = $url !== '' ? $url : null;
    $waUrlValue = $waUrl !== '' ? $waUrl : null;
    $waMessageValue = $waMessage !== '' ? $waMessage : null;
    $pdo->prepare("
        INSERT INTO push_notifications (user_type, user_id, title, body, url, wa_url, wa_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ")->execute([$userType, $userId, $title, $body, $urlValue, $waUrlValue, $waMessageValue]);
}

// ── Main API ─────────────────────────────────────────────────────────────────

/**
 * Queue a notification AND ping all subscriptions for that user.
 */
function push_notify(PDO $pdo, string $userType, int $userId, string $title, string $body, string $url = '', string $waUrl = '', string $waMessage = ''): void {
    push_queue_notification($pdo, $userType, $userId, $title, $body, $url, $waUrl, $waMessage);
    fcm_notify($pdo, $userType, $userId, $title, $body, $url, $waUrl, $waMessage);

    // Ping each subscription (fire-and-forget, don't block the request)
    try {
        push_ensure_tables($pdo);
        $stmt = $pdo->prepare("SELECT endpoint FROM push_subscriptions WHERE user_type = ? AND user_id = ?");
        $stmt->execute([$userType, $userId]);
        $endpoints = $stmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($endpoints as $ep) {
            $alive = push_ping((string)$ep);
            if (!$alive) {
                push_remove_subscription($pdo, (string)$ep); // purge dead subscription
            }
        }
    } catch (Throwable) {}
}

/**
 * Notify teacher (user_id = 0) with optional WhatsApp deep link.
 */
function push_notify_teacher(PDO $pdo, string $title, string $body, string $url = '', string $studentWhatsapp = '', string $whatsappMessage = ''): void {
    if ($whatsappMessage === '') $whatsappMessage = $body;
    $waUrl = '';
    if ($studentWhatsapp !== '') {
        $phone = preg_replace('/\D+/', '', $studentWhatsapp);
        if ($phone !== '') {
            $waUrl = 'https://wa.me/' . $phone . '?text=' . rawurlencode($whatsappMessage);
        }
    }
    push_notify($pdo, 'teacher', 0, $title, $body, $url, $waUrl, $whatsappMessage);
}

/**
 * Notify a student.
 */
function push_notify_student(PDO $pdo, int $studentId, string $title, string $body, string $url = ''): void {
    push_notify($pdo, 'student', $studentId, $title, $body, $url);
}

function push_student_row(PDO $pdo, int $studentId): array {
    $stmt = $pdo->prepare("SELECT full_name, login_code, whatsapp FROM students WHERE id = ? LIMIT 1");
    $stmt->execute([$studentId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return is_array($row) ? $row : ['full_name' => 'Student', 'login_code' => '', 'whatsapp' => ''];
}

function whatsapp_homework_message(array $student, string $homeworkTitle): string {
    return "Hi {$student['full_name']} 👋\n\n"
        . "Your new Arabic homework is ready.\n\n"
        . "Your Code: {$student['login_code']}\n"
        . "Homework: {$homeworkTitle}\n\n"
        . "Please complete it before the next lesson so we can review your progress together.\n\n"
        . "Small steps every day make a big difference 🌟";
}

function whatsapp_scenario_message(array $student, string $scenarioTitle): string {
    return "Hi {$student['full_name']} 🎙️\n\n"
        . "Your new speaking scenario is ready.\n\n"
        . "Your Code: {$student['login_code']}\n"
        . "Scenario: {$scenarioTitle}\n\n"
        . "This task will help you practise Arabic in a real-life situation.\n"
        . "Don’t worry about mistakes — mistakes are part of learning.\n\n"
        . "Try your best and record your answer with confidence 💪";
}

function whatsapp_review_message(array $student, string $reviewType): string {
    if ($reviewType === 'monthly_review') {
        return "Hi {$student['full_name']} 🏆\n\n"
            . "Your monthly Arabic progress review is ready.\n\n"
            . "Your Code: {$student['login_code']}\n"
            . "Review Type: Monthly Review\n\n"
            . "This report shows your progress, strengths, weak areas, and the recommended focus for the next stage.\n\n"
            . "You have done great work this month. Now we will use this review to make your next lessons even better.";
    }

    return "Hi {$student['full_name']} 🌟\n\n"
        . "Your weekly Arabic review is ready.\n\n"
        . "Your Code: {$student['login_code']}\n"
        . "Review Type: Weekly Review\n\n"
        . "In this review, you will see:\n\n"
        . "* What improved this week\n"
        . "* What still needs practice\n"
        . "* Your next focus\n\n"
        . "You are making progress step by step. Keep going 💪";
}
