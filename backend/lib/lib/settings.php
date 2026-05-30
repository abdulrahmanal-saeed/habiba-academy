<?php
declare(strict_types=1);

if (!function_exists('settings_table_name')) {
    function settings_table_name(PDO $pdo): string
    {
        static $tableName = null;

        if (is_string($tableName) && $tableName !== '') {
            return $tableName;
        }

        foreach (['site_settings', 'settings'] as $candidate) {
            try {
                $stmt = $pdo->prepare('SHOW TABLES LIKE ?');
                $stmt->execute([$candidate]);
                if ($stmt->fetchColumn()) {
                    $tableName = $candidate;
                    ensure_feature_flag_settings($pdo, $tableName);
                    return $tableName;
                }
            } catch (Throwable $ignored) {
                // Fall through to the next candidate.
            }
        }

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS site_settings (
                `key` VARCHAR(190) NOT NULL PRIMARY KEY,
                `value` TEXT NULL,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $tableName = 'site_settings';
        ensure_feature_flag_settings($pdo, $tableName);
        return $tableName;
    }
}

if (!function_exists('ensure_feature_flag_settings')) {
    function ensure_feature_flag_settings(PDO $pdo, ?string $tableName = null): void
    {
        static $seededTables = [];

        $tableName ??= settings_table_name($pdo);
        if (isset($seededTables[$tableName])) {
            return;
        }

        $stmt = $pdo->prepare("
            INSERT IGNORE INTO `{$tableName}` (`key`, `value`)
            VALUES
              ('enable_videos_page', '0'),
              ('show_videos_on_homepage', '0'),
              ('enable_articles_page', '0'),
              ('show_articles_on_homepage', '0')
        ");
        $stmt->execute();
        $seededTables[$tableName] = true;
    }
}

if (!function_exists('get_setting')) {
    function get_setting(string $key, mixed $default = null): mixed
    {
        $cache =& settings_request_cache();

        if (array_key_exists($key, $cache)) {
            return $cache[$key];
        }

        global $pdo;
        if (!($pdo instanceof PDO)) {
            return $default;
        }

        $tableName = settings_table_name($pdo);
        $stmt = $pdo->prepare("SELECT `value` FROM `{$tableName}` WHERE `key` = ? LIMIT 1");
        $stmt->execute([$key]);
        $value = $stmt->fetchColumn();

        if ($value === false) {
            $cache[$key] = $default;
            return $default;
        }

        $cache[$key] = $value;
        return $value;
    }
}

if (!function_exists('update_setting')) {
    function update_setting(string $key, string $value): bool
    {
        $cache =& settings_request_cache();

        global $pdo;
        if (!($pdo instanceof PDO)) {
            return false;
        }

        $tableName = settings_table_name($pdo);
        $stmt = $pdo->prepare("
            INSERT INTO `{$tableName}` (`key`, `value`)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)
        ");
        $ok = $stmt->execute([$key, $value]);
        if ($ok) {
            $cache[$key] = $value;
        }
        return $ok;
    }
}

if (!function_exists('setting_enabled')) {
    function setting_enabled(string $key, bool $default = false): bool
    {
        return (string)get_setting($key, $default ? '1' : '0') === '1';
    }
}

if (!function_exists('settings_request_cache')) {
    function &settings_request_cache(): array
    {
        static $cache = [];
        return $cache;
    }
}
