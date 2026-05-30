<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (function_exists('communications_ensure_schema')) {
    return;
}

function communications_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) return;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS communication_templates (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            channel VARCHAR(30) NOT NULL,
            template_key VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL DEFAULT '',
            body TEXT NOT NULL,
            active TINYINT(1) NOT NULL DEFAULT 1,
            updated_at DATETIME NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_template (channel, template_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS email_logs (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            to_email VARCHAR(255) NOT NULL DEFAULT '',
            subject VARCHAR(255) NOT NULL DEFAULT '',
            body MEDIUMTEXT NULL,
            template_key VARCHAR(100) NOT NULL DEFAULT '',
            status VARCHAR(40) NOT NULL DEFAULT 'logged',
            error_message TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_template (template_key),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS notification_preferences (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_type VARCHAR(40) NOT NULL,
            user_id INT NOT NULL DEFAULT 0,
            event_key VARCHAR(100) NOT NULL,
            in_app_enabled TINYINT(1) NOT NULL DEFAULT 1,
            push_enabled TINYINT(1) NOT NULL DEFAULT 1,
            email_enabled TINYINT(1) NOT NULL DEFAULT 0,
            whatsapp_enabled TINYINT(1) NOT NULL DEFAULT 0,
            updated_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uniq_pref (user_type, user_id, event_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS push_logs (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_type VARCHAR(40) NOT NULL,
            user_id INT NOT NULL DEFAULT 0,
            channel VARCHAR(30) NOT NULL DEFAULT 'fcm',
            title VARCHAR(255) NOT NULL DEFAULT '',
            body TEXT NULL,
            target VARCHAR(255) NOT NULL DEFAULT '',
            status VARCHAR(40) NOT NULL DEFAULT 'queued',
            error_message TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_type, user_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS push_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_type VARCHAR(40) NOT NULL,
            user_id INT NOT NULL DEFAULT 0,
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            url VARCHAR(512) DEFAULT NULL,
            wa_url VARCHAR(512) DEFAULT NULL,
            wa_message TEXT DEFAULT NULL,
            event_key VARCHAR(100) NOT NULL DEFAULT '',
            icon VARCHAR(255) DEFAULT '/assets/img/icon-192.png',
            shown_at DATETIME DEFAULT NULL,
            read_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_type, user_id, shown_at),
            INDEX idx_read (user_type, user_id, read_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    try {
        $pdo->exec("ALTER TABLE push_notifications MODIFY COLUMN user_type VARCHAR(40) NOT NULL");
    } catch (Throwable) {}
    foreach ([
        'read_at' => "ALTER TABLE push_notifications ADD COLUMN read_at DATETIME NULL DEFAULT NULL AFTER shown_at",
        'event_key' => "ALTER TABLE push_notifications ADD COLUMN event_key VARCHAR(100) NOT NULL DEFAULT '' AFTER wa_message",
    ] as $col => $sql) {
        try {
            $stmt = $pdo->prepare("
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'push_notifications'
                  AND COLUMN_NAME = ?
            ");
            $stmt->execute([$col]);
            if ((int)$stmt->fetchColumn() === 0) $pdo->exec($sql);
        } catch (Throwable) {}
    }

    communications_seed_templates($pdo);
    $done = true;
}

function communications_default_templates(): array
{
    return [
        ['email','payment_confirmation','Payment Confirmation','Payment Confirmed - Habiba Nabil Arabic Academy',"Hi [Name],\n\nThank you for your payment.\n\nPackage: [Plan Name]\nAmount Paid: AED [Amount]\n\nNext step:\n[Student Form Link]\n\nHabiba Nabil Arabic Academy"],
        ['email','student_form_received','Student Form Received','Student Form Received - We are preparing your lesson',"Hi [Name],\n\nThank you for completing the student form.\n\nWe will review your level, goals, and learning needs.\n\n[Booking Link]"],
        ['email','lesson_confirmation','Lesson Confirmation','Your Arabic Lesson is Confirmed',"Hi [Name],\n\nYour Arabic lesson is confirmed.\n\nDate: [Lesson Date]\nTime: [Lesson Time]\n\n[Meeting Link]"],
        ['email','level_check_reminder','Level Check Reminder','Please Complete Your Arabic Level Check',"Hi [Name],\n\nPlease complete your short Arabic level check here:\n[Level Check Link]"],
        ['email','homework_corrected','Homework Corrected','Your Homework Feedback is Ready',"Hi [Name],\n\nYour homework feedback is ready.\n\n[Homework Title]\n[Login Link]"],
        ['whatsapp','after_payment','After Payment','',"Hi [Name], thank you for your payment with Habiba Nabil Arabic Academy.\n\nPlease complete your student form here:\n[Student Form Link]"],
        ['whatsapp','lesson_confirmation','Lesson Confirmation','',"Hi [Name], your Arabic lesson is confirmed.\n\nDate: [Lesson Date]\nTime: [Lesson Time]\nMeeting link: [Meeting Link]"],
        ['whatsapp','homework_published','Homework Published','',"Hi [Student Name], your new Arabic homework is ready.\n\nHomework: [Homework Title]\n\nPlease complete it before the next lesson."],
        ['whatsapp','scenario_published','Scenario Published','',"Hi [Student Name], your new speaking scenario is ready.\n\nScenario: [Scenario Title]"],
        ['whatsapp','review_published','Review Published','',"Hi [Student Name], your Arabic review is ready.\n\nReview: [Review Title]"],
        ['whatsapp','low_credits','Low Credits','',"Hi [Name], your package balance is low.\n\nRemaining sessions: [Package Balance]"],
    ];
}

function communications_seed_templates(PDO $pdo): void
{
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO communication_templates (channel, template_key, title, subject, body)
        VALUES (?, ?, ?, ?, ?)
    ");
    foreach (communications_default_templates() as $tpl) {
        $stmt->execute($tpl);
    }
}

function communications_render_template(string $body, array $vars): string
{
    foreach ($vars as $key => $value) {
        $body = str_replace('[' . $key . ']', (string)$value, $body);
    }
    return $body;
}

function communications_log_email(PDO $pdo, string $to, string $subject, string $body, string $templateKey = '', string $status = 'logged', string $error = ''): void
{
    communications_ensure_schema($pdo);
    $pdo->prepare("
        INSERT INTO email_logs (to_email, subject, body, template_key, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?)
    ")->execute([$to, $subject, $body, $templateKey, $status, $error]);
}

function communications_log_push(PDO $pdo, string $userType, int $userId, string $title, string $body, string $target = '', string $status = 'queued', string $error = ''): void
{
    communications_ensure_schema($pdo);
    $pdo->prepare("
        INSERT INTO push_logs (user_type, user_id, title, body, target, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ")->execute([$userType, $userId, $title, $body, $target, $status, $error]);
}
