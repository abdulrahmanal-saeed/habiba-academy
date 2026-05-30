<?php
declare(strict_types=1);

if (function_exists('media_buyer_ensure_schema')) {
    return;
}

function media_buyer_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) return;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS media_buyer_campaigns (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            media_buyer_id INT UNSIGNED NOT NULL,
            name VARCHAR(190) NOT NULL,
            tracking_code VARCHAR(80) NOT NULL,
            utm_source VARCHAR(120) NOT NULL DEFAULT '',
            utm_medium VARCHAR(120) NOT NULL DEFAULT '',
            utm_campaign VARCHAR(120) NOT NULL DEFAULT '',
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_tracking_code (tracking_code),
            KEY idx_buyer (media_buyer_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS media_buyer_visits (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            media_buyer_id INT UNSIGNED NOT NULL,
            campaign_id INT UNSIGNED NULL,
            session_token CHAR(64) NOT NULL,
            tracking_code VARCHAR(80) NOT NULL DEFAULT '',
            landing_url VARCHAR(700) NOT NULL DEFAULT '',
            target_url VARCHAR(700) NOT NULL DEFAULT '',
            referrer VARCHAR(700) NOT NULL DEFAULT '',
            source_label VARCHAR(80) NOT NULL DEFAULT '',
            utm_source VARCHAR(120) NOT NULL DEFAULT '',
            utm_medium VARCHAR(120) NOT NULL DEFAULT '',
            utm_campaign VARCHAR(120) NOT NULL DEFAULT '',
            device_type VARCHAR(30) NOT NULL DEFAULT '',
            country VARCHAR(80) NOT NULL DEFAULT '',
            user_agent_hash CHAR(64) NOT NULL DEFAULT '',
            ip_hash CHAR(64) NOT NULL DEFAULT '',
            first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen_at DATETIME NULL,
            duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
            last_path VARCHAR(700) NOT NULL DEFAULT '',
            last_event VARCHAR(120) NOT NULL DEFAULT '',
            KEY idx_buyer_created (media_buyer_id, first_seen_at),
            KEY idx_session (session_token),
            KEY idx_campaign (campaign_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS marketing_attributions (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            visitor_id CHAR(64) NOT NULL,
            media_buyer_id INT UNSIGNED NOT NULL,
            campaign_id INT UNSIGNED NULL,
            tracking_code VARCHAR(80) NOT NULL DEFAULT '',
            attribution_rule VARCHAR(60) NOT NULL DEFAULT 'last_click_30_days',
            email_hash CHAR(64) NOT NULL DEFAULT '',
            whatsapp_hash CHAR(64) NOT NULL DEFAULT '',
            first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            source_label VARCHAR(80) NOT NULL DEFAULT '',
            utm_source VARCHAR(120) NOT NULL DEFAULT '',
            utm_medium VARCHAR(120) NOT NULL DEFAULT '',
            utm_campaign VARCHAR(120) NOT NULL DEFAULT '',
            last_visit_id INT UNSIGNED NULL,
            converted_checkout_order_id INT UNSIGNED NULL,
            converted_at DATETIME NULL,
            KEY idx_visitor_expires (visitor_id, expires_at),
            KEY idx_buyer_seen (media_buyer_id, last_seen_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS media_buyer_agreement_templates (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(190) NOT NULL,
            version VARCHAR(40) NOT NULL DEFAULT '1.0',
            content MEDIUMTEXT NOT NULL,
            active TINYINT(1) NOT NULL DEFAULT 1,
            requires_reacceptance TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS media_buyer_commissions (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            media_buyer_id INT UNSIGNED NOT NULL,
            checkout_order_id INT UNSIGNED NULL,
            campaign_id INT UNSIGNED NULL,
            order_amount_aed DECIMAL(10,2) NOT NULL DEFAULT 0,
            commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
            commission_amount_aed DECIMAL(10,2) NOT NULL DEFAULT 0,
            status VARCHAR(30) NOT NULL DEFAULT 'pending',
            notes TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            KEY idx_buyer_status (media_buyer_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    foreach (['media_buyer_id' => 'INT UNSIGNED NULL', 'media_campaign_id' => 'INT UNSIGNED NULL',
              'attribution_code' => 'VARCHAR(80) NULL', 'utm_source' => 'VARCHAR(120) NULL',
              'utm_medium' => 'VARCHAR(120) NULL', 'utm_campaign' => 'VARCHAR(120) NULL'] as $col => $def) {
        try {
            $chk = $pdo->query("SHOW COLUMNS FROM checkout_orders LIKE " . $pdo->quote($col));
            if ($chk && !$chk->fetchColumn()) {
                $pdo->exec("ALTER TABLE checkout_orders ADD COLUMN {$col} {$def}");
            }
        } catch (Throwable) {}
    }

    $count = (int)$pdo->query("SELECT COUNT(*) FROM media_buyer_agreement_templates")->fetchColumn();
    if ($count === 0) {
        $pdo->prepare("INSERT INTO media_buyer_agreement_templates (title, version, content, active) VALUES (?, ?, ?, 1)")
            ->execute(['Media Buyer Commission Agreement', '1.0',
                'This agreement covers campaign tracking, commissions, refund reversals, and data privacy. Edit before real use.']);
    }

    $done = true;
}
