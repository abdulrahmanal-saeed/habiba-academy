<?php
declare(strict_types=1);

require_once __DIR__ . '/platform-notifications.php';

if (function_exists('book_notifications_ensure_schema')) {
    return;
}

function book_notifications_column_exists(PDO $pdo, string $column): bool
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'push_notifications'
          AND COLUMN_NAME = ?
    ");
    $stmt->execute([$column]);
    return (int)$stmt->fetchColumn() > 0;
}

function book_notifications_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) return;
    platform_notifications_ensure_schema($pdo);

    $columns = [
        'notification_type' => "ALTER TABLE push_notifications ADD COLUMN notification_type VARCHAR(100) NOT NULL DEFAULT '' AFTER target_role",
        'title_en' => "ALTER TABLE push_notifications ADD COLUMN title_en VARCHAR(255) NOT NULL DEFAULT '' AFTER title",
        'title_ar' => "ALTER TABLE push_notifications ADD COLUMN title_ar VARCHAR(255) NOT NULL DEFAULT '' AFTER title_en",
        'body_en' => "ALTER TABLE push_notifications ADD COLUMN body_en TEXT NULL AFTER body",
        'body_ar' => "ALTER TABLE push_notifications ADD COLUMN body_ar TEXT NULL AFTER body_en",
        'is_read' => "ALTER TABLE push_notifications ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0 AFTER read_at",
        'student_id' => "ALTER TABLE push_notifications ADD COLUMN student_id INT NULL AFTER priority",
        'teacher_id' => "ALTER TABLE push_notifications ADD COLUMN teacher_id INT NULL AFTER student_id",
        'book_id' => "ALTER TABLE push_notifications ADD COLUMN book_id INT NULL AFTER teacher_id",
        'unit_id' => "ALTER TABLE push_notifications ADD COLUMN unit_id INT NULL AFTER book_id",
        'submission_id' => "ALTER TABLE push_notifications ADD COLUMN submission_id INT NULL AFTER unit_id",
        'activation_request_id' => "ALTER TABLE push_notifications ADD COLUMN activation_request_id INT NULL AFTER submission_id",
        'metadata_json' => "ALTER TABLE push_notifications ADD COLUMN metadata_json LONGTEXT NULL AFTER activation_request_id",
        'channel_in_app' => "ALTER TABLE push_notifications ADD COLUMN channel_in_app TINYINT(1) NOT NULL DEFAULT 1 AFTER metadata_json",
        'channel_email' => "ALTER TABLE push_notifications ADD COLUMN channel_email TINYINT(1) NOT NULL DEFAULT 0 AFTER channel_in_app",
        'channel_whatsapp' => "ALTER TABLE push_notifications ADD COLUMN channel_whatsapp TINYINT(1) NOT NULL DEFAULT 0 AFTER channel_email",
    ];
    foreach ($columns as $column => $sql) {
        try {
            if (!book_notifications_column_exists($pdo, $column)) {
                $pdo->exec($sql);
            }
        } catch (Throwable) {}
    }
    try {
        $pdo->exec("ALTER TABLE push_notifications MODIFY COLUMN event_key VARCHAR(255) NOT NULL DEFAULT ''");
    } catch (Throwable) {}
    try {
        $pdo->exec("UPDATE push_notifications SET is_read = 1 WHERE read_at IS NOT NULL AND is_read = 0");
    } catch (Throwable) {}
    $done = true;
}

function book_notification_icon(string $type): string
{
    return match ($type) {
        'book_marketing' => '📘',
        'book_activation_request', 'book_payment_activation_pending' => '🔐',
        'book_access_approved' => '✅',
        'book_access_rejected' => '⚠️',
        'book_lesson_submitted', 'book_review_submitted', 'book_final_review_submitted' => '📝',
        'book_feedback_available', 'book_resubmission_requested' => '💬',
        'book_progress_reminder', 'book_weak_words_reminder', 'book_common_mistakes_reminder' => '⏰',
        'book_completed' => '🎉',
        'book_certificate_available' => '🏆',
        'book_extra_review_session_status' => '👩‍🏫',
        'book_admin_content_update' => '📚',
        default => '📘',
    };
}

function book_notification_event_key(string $type, array $meta): string
{
    $parts = [
        $type,
        (int)($meta['student_id'] ?? 0),
        (int)($meta['book_id'] ?? 0),
        (int)($meta['unit_id'] ?? 0),
        (int)($meta['submission_id'] ?? 0),
        (int)($meta['activation_request_id'] ?? 0),
    ];
    return implode(':', $parts);
}

function create_book_notification(PDO $pdo, array $data): int
{
    book_notifications_ensure_schema($pdo);
    $recipientType = trim((string)($data['recipient_type'] ?? 'student'));
    $recipientId = (int)($data['recipient_id'] ?? 0);
    $type = trim((string)($data['type'] ?? 'book_marketing'));
    $titleEn = trim((string)($data['title_en'] ?? $data['title'] ?? 'Notification'));
    $titleAr = trim((string)($data['title_ar'] ?? $titleEn));
    $bodyEn = trim((string)($data['body_en'] ?? $data['body'] ?? ''));
    $bodyAr = trim((string)($data['body_ar'] ?? $bodyEn));
    $linkUrl = trim((string)($data['link_url'] ?? $data['action_url'] ?? ''));
    $priority = trim((string)($data['priority'] ?? 'normal'));
    if (!in_array($priority, ['low', 'normal', 'high'], true)) $priority = 'normal';
    $meta = (array)($data['meta'] ?? []);
    foreach (['student_id','teacher_id','book_id','unit_id','submission_id','activation_request_id'] as $key) {
        if (array_key_exists($key, $data)) $meta[$key] = $data[$key];
    }
    $eventKey = trim((string)($data['event_key'] ?? book_notification_event_key($type, $meta)));

    $dedupe = $pdo->prepare("
        SELECT id
        FROM push_notifications
        WHERE (user_type = ? OR target_role = ?)
          AND user_id = ?
          AND event_key = ?
          AND read_at IS NULL
        LIMIT 1
    ");
    $dedupe->execute([$recipientType, $recipientType, $recipientId, $eventKey]);
    $existing = (int)($dedupe->fetchColumn() ?: 0);
    if ($existing) return $existing;

    $stmt = $pdo->prepare("
        INSERT INTO push_notifications
            (user_type, user_id, target_role, notification_type, title, title_en, title_ar, body, body_en, body_ar, url, event_key,
             related_entity_type, related_entity_id, action_label, priority, student_id, teacher_id, book_id, unit_id, submission_id,
             activation_request_id, metadata_json, channel_in_app, channel_email, channel_whatsapp, shown_at)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, NULL)
    ");
    $stmt->execute([
        $recipientType,
        $recipientId,
        $recipientType,
        $type,
        $titleEn,
        $titleEn,
        $titleAr,
        $bodyEn,
        $bodyEn,
        $bodyAr,
        $linkUrl,
        $eventKey,
        (string)($data['related_entity_type'] ?? $type),
        (int)($data['related_entity_id'] ?? ($meta['submission_id'] ?? $meta['activation_request_id'] ?? $meta['book_id'] ?? 0)),
        trim((string)($data['action_label'] ?? 'Open')),
        $priority,
        $meta['student_id'] ?? null,
        $meta['teacher_id'] ?? null,
        $meta['book_id'] ?? null,
        $meta['unit_id'] ?? null,
        $meta['submission_id'] ?? null,
        $meta['activation_request_id'] ?? null,
        json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
    return (int)$pdo->lastInsertId();
}

function mark_book_notification_read(PDO $pdo, int $notificationId, string $recipientType, int $recipientId): bool
{
    book_notifications_ensure_schema($pdo);
    $stmt = $pdo->prepare("
        UPDATE push_notifications
        SET read_at = COALESCE(read_at, NOW()), is_read = 1
        WHERE id = ? AND (user_type = ? OR target_role = ?) AND user_id = ?
    ");
    $stmt->execute([$notificationId, $recipientType, $recipientType, $recipientId]);
    return $stmt->rowCount() > 0;
}

function mark_related_book_notifications_read(PDO $pdo, string $type, array $meta): void
{
    book_notifications_ensure_schema($pdo);
    $where = ["notification_type = ?"];
    $params = [$type];
    foreach (['student_id','book_id','unit_id','submission_id','activation_request_id'] as $key) {
        if (isset($meta[$key])) {
            $where[] = "$key = ?";
            $params[] = (int)$meta[$key];
        }
    }
    $sql = "UPDATE push_notifications SET read_at = COALESCE(read_at, NOW()), is_read = 1 WHERE " . implode(' AND ', $where);
    $pdo->prepare($sql)->execute($params);
}

function get_book_unread_notification_count(PDO $pdo, string $recipientType, int $recipientId): int
{
    book_notifications_ensure_schema($pdo);
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM push_notifications
        WHERE (user_type = ? OR target_role = ?)
          AND user_id = ?
          AND read_at IS NULL
          AND notification_type LIKE 'book_%'
    ");
    $stmt->execute([$recipientType, $recipientType, $recipientId]);
    return (int)$stmt->fetchColumn();
}

function book_notification_recent(PDO $pdo, string $recipientType, int $recipientId, string $type, array $meta, int $days): bool
{
    book_notifications_ensure_schema($pdo);
    $eventKey = book_notification_event_key($type, $meta);
    $stmt = $pdo->prepare("
        SELECT MAX(created_at)
        FROM push_notifications
        WHERE (user_type = ? OR target_role = ?)
          AND user_id = ?
          AND event_key = ?
    ");
    $stmt->execute([$recipientType, $recipientType, $recipientId, $eventKey]);
    $last = (string)($stmt->fetchColumn() ?: '');
    return $last !== '' && strtotime($last) >= strtotime('-' . $days . ' days');
}

