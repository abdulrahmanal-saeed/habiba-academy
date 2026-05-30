<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../config/db.php';

if (!function_exists('ensure_analytics_tables')) {
    function ensure_analytics_tables(PDO $pdo): void
    {
        static $done = false;
        if ($done) {
            return;
        }

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS visits (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(64) NOT NULL,
                user_id INT NULL,
                ip_address VARCHAR(45) NULL,
                user_agent VARCHAR(500) NULL,
                device_type ENUM('desktop','mobile','tablet') NOT NULL DEFAULT 'desktop',
                browser VARCHAR(50) NULL,
                referrer VARCHAR(500) NULL,
                country VARCHAR(50) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_visits_session_id (session_id),
                KEY idx_visits_created_at (created_at),
                KEY idx_visits_last_activity (last_activity_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS page_views (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(64) NOT NULL,
                page_url VARCHAR(500) NOT NULL,
                page_title VARCHAR(255) NULL,
                time_spent INT NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_page_views_session_id (session_id),
                KEY idx_page_views_created_at (created_at),
                KEY idx_page_views_page_url (page_url(191))
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS events (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(64) NOT NULL,
                event_name VARCHAR(100) NOT NULL,
                metadata JSON NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_events_session_id (session_id),
                KEY idx_events_event_name (event_name),
                KEY idx_events_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $done = true;
    }
}

if (!function_exists('analytics_is_teacher_context')) {
    function analytics_is_teacher_context(): bool
    {
        start_session();
        if (!empty($_SESSION['teacher_logged'])) {
            return true;
        }

        $path = (string)parse_url((string)($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
        return str_starts_with($path, '/teacher/') || str_starts_with($path, '/api/teacher/');
    }
}

if (!function_exists('analytics_cookie_name')) {
    function analytics_cookie_name(): string
    {
        return 'hna_sid';
    }
}

if (!function_exists('analytics_current_session_id')) {
    function analytics_current_session_id(): ?string
    {
        start_session();
        $sessionSid = trim((string)($_SESSION['analytics_session_id'] ?? ''));
        if ($sessionSid !== '' && preg_match('/^[a-f0-9]{64}$/', $sessionSid)) {
            return $sessionSid;
        }

        $sid = trim((string)($_COOKIE[analytics_cookie_name()] ?? ''));
        if ($sid === '' || !preg_match('/^[a-f0-9]{64}$/', $sid)) {
            return null;
        }
        return $sid;
    }
}

if (!function_exists('analytics_client_ip')) {
    function analytics_client_ip(): ?string
    {
        $candidates = [
            $_SERVER['HTTP_CF_CONNECTING_IP'] ?? null,
            $_SERVER['HTTP_X_FORWARDED_FOR'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            $candidate = trim((string)$candidate);
            if ($candidate === '') {
                continue;
            }
            $parts = array_map('trim', explode(',', $candidate));
            foreach ($parts as $ip) {
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return null;
    }
}

if (!function_exists('analytics_detect_device_type')) {
    function analytics_detect_device_type(?string $userAgent): string
    {
        $ua = strtolower((string)$userAgent);
        if ($ua === '') {
            return 'desktop';
        }
        if (str_contains($ua, 'tablet') || str_contains($ua, 'ipad')) {
            return 'tablet';
        }
        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
            return 'mobile';
        }
        return 'desktop';
    }
}

if (!function_exists('analytics_detect_browser')) {
    function analytics_detect_browser(?string $userAgent): string
    {
        $ua = strtolower((string)$userAgent);
        return match (true) {
            str_contains($ua, 'edg/') => 'Edge',
            str_contains($ua, 'chrome/') && !str_contains($ua, 'edg/') => 'Chrome',
            str_contains($ua, 'firefox/') => 'Firefox',
            str_contains($ua, 'safari/') && !str_contains($ua, 'chrome/') => 'Safari',
            str_contains($ua, 'opr/') || str_contains($ua, 'opera') => 'Opera',
            default => 'Other',
        };
    }
}

if (!function_exists('analytics_country_code')) {
    function analytics_country_code(): ?string
    {
        $country = strtoupper(trim((string)($_SERVER['HTTP_CF_IPCOUNTRY'] ?? '')));
        if ($country === '' || $country === 'XX') {
            return null;
        }
        return $country;
    }
}

if (!function_exists('analytics_guess_page_title')) {
    function analytics_guess_page_title(): string
    {
        $path = (string)parse_url((string)($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
        $path = trim($path, '/');
        if ($path === '') {
            return 'Homepage';
        }

        $last = basename($path);
        $last = preg_replace('/\.php$/i', '', $last) ?? $last;
        $last = str_replace(['-', '_'], ' ', $last);
        return ucwords($last);
    }
}

if (!function_exists('analytics_current_url')) {
    function analytics_current_url(): string
    {
        $uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
        return mb_substr($uri !== '' ? $uri : '/', 0, 500);
    }
}

if (!function_exists('analytics_register_page_view')) {
    function analytics_register_page_view(PDO $pdo, string $sessionId): void
    {
        start_session();

        $previousId = (int)($_SESSION['analytics_last_page_view_id'] ?? 0);
        $previousTs = (int)($_SESSION['analytics_last_page_view_ts'] ?? 0);
        if ($previousId > 0 && $previousTs > 0) {
            $elapsed = max(0, min(1800, time() - $previousTs));
            $update = $pdo->prepare("UPDATE page_views SET time_spent = ? WHERE id = ?");
            $update->execute([$elapsed, $previousId]);
        }

        $insert = $pdo->prepare("
            INSERT INTO page_views (session_id, page_url, page_title, time_spent)
            VALUES (?, ?, ?, 0)
        ");
        $insert->execute([$sessionId, analytics_current_url(), analytics_guess_page_title()]);

        $_SESSION['analytics_last_page_view_id'] = (int)$pdo->lastInsertId();
        $_SESSION['analytics_last_page_view_ts'] = time();
    }
}

if (!function_exists('analytics_bootstrap_request')) {
    function analytics_bootstrap_request(): ?string
    {
        global $pdo;

        if (!isset($pdo) || !($pdo instanceof PDO) || analytics_is_teacher_context()) {
            return null;
        }

        try {
            ensure_analytics_tables($pdo);

            $existingCookie = analytics_current_session_id();
            $sessionId = $existingCookie;

            if ($sessionId !== null) {
                $check = $pdo->prepare("
                    SELECT id
                    FROM visits
                    WHERE session_id = ?
                      AND last_activity_at >= (NOW() - INTERVAL 30 MINUTE)
                    ORDER BY id DESC
                    LIMIT 1
                ");
                $check->execute([$sessionId]);
                if (!$check->fetch()) {
                    $sessionId = null;
                }
            }

            if ($sessionId === null) {
                $sessionId = bin2hex(random_bytes(32));
                setcookie(analytics_cookie_name(), $sessionId, [
                    'expires' => time() + (30 * 86400),
                    'path' => '/',
                    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
                    'httponly' => true,
                    'samesite' => 'Lax',
                ]);

                $insertVisit = $pdo->prepare("
                    INSERT INTO visits (
                        session_id, user_id, ip_address, user_agent, device_type, browser, referrer, country, created_at, last_activity_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $insertVisit->execute([
                    $sessionId,
                    !empty($_SESSION['student_id']) ? (int)$_SESSION['student_id'] : null,
                    analytics_client_ip(),
                    mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
                    analytics_detect_device_type((string)($_SERVER['HTTP_USER_AGENT'] ?? '')),
                    analytics_detect_browser((string)($_SERVER['HTTP_USER_AGENT'] ?? '')),
                    mb_substr((string)($_SERVER['HTTP_REFERER'] ?? ''), 0, 500),
                    analytics_country_code(),
                ]);
            } else {
                $updateVisit = $pdo->prepare("
                    UPDATE visits
                    SET user_id = ?, ip_address = ?, user_agent = ?, device_type = ?, browser = ?, referrer = ?, country = ?, last_activity_at = NOW()
                    WHERE session_id = ?
                ");
                $updateVisit->execute([
                    !empty($_SESSION['student_id']) ? (int)$_SESSION['student_id'] : null,
                    analytics_client_ip(),
                    mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
                    analytics_detect_device_type((string)($_SERVER['HTTP_USER_AGENT'] ?? '')),
                    analytics_detect_browser((string)($_SERVER['HTTP_USER_AGENT'] ?? '')),
                    mb_substr((string)($_SERVER['HTTP_REFERER'] ?? ''), 0, 500),
                    analytics_country_code(),
                    $sessionId,
                ]);
            }

            $_SESSION['analytics_session_id'] = $sessionId;
            analytics_register_page_view($pdo, $sessionId);
            return $sessionId;
        } catch (Throwable $e) {
            return null;
        }
    }
}

if (!function_exists('track_event')) {
    function track_event(string $eventName, array $metadata = []): bool
    {
        global $pdo;

        if (!isset($pdo) || !($pdo instanceof PDO) || analytics_is_teacher_context()) {
            return false;
        }

        try {
            ensure_analytics_tables($pdo);
            $sessionId = analytics_current_session_id();
            if ($sessionId === null) {
                $sessionId = analytics_bootstrap_request();
            }
            if ($sessionId === null) {
                return false;
            }

            unset($metadata['password'], $metadata['pass'], $metadata['token'], $metadata['_csrf']);
            $payload = $metadata ? json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;

            $stmt = $pdo->prepare("
                INSERT INTO events (session_id, event_name, metadata, created_at)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$sessionId, mb_substr(trim($eventName), 0, 100), $payload]);
            return true;
        } catch (Throwable $e) {
            return false;
        }
    }
}
