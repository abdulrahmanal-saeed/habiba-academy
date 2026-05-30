<?php
declare(strict_types=1);

require_once __DIR__ . '/communications.php';

if (function_exists('platform_notifications_ensure_schema')) {
    return;
}

function platform_notifications_column_exists(PDO $pdo, string $column): bool
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

function platform_notifications_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }

    communications_ensure_schema($pdo);

    $columns = [
        'target_role' => "ALTER TABLE push_notifications ADD COLUMN target_role VARCHAR(40) NOT NULL DEFAULT '' AFTER user_id",
        'related_entity_type' => "ALTER TABLE push_notifications ADD COLUMN related_entity_type VARCHAR(80) NOT NULL DEFAULT '' AFTER event_key",
        'related_entity_id' => "ALTER TABLE push_notifications ADD COLUMN related_entity_id INT NOT NULL DEFAULT 0 AFTER related_entity_type",
        'action_label' => "ALTER TABLE push_notifications ADD COLUMN action_label VARCHAR(120) NOT NULL DEFAULT '' AFTER related_entity_id",
        'priority' => "ALTER TABLE push_notifications ADD COLUMN priority VARCHAR(30) NOT NULL DEFAULT 'normal' AFTER action_label",
    ];

    foreach ($columns as $column => $sql) {
        try {
            if (!platform_notifications_column_exists($pdo, $column)) {
                $pdo->exec($sql);
            }
        } catch (Throwable) {
        }
    }

    try {
        $pdo->exec("UPDATE push_notifications SET target_role = user_type WHERE target_role = ''");
    } catch (Throwable) {
    }

    $done = true;
}

function platform_notify(PDO $pdo, array $data): int
{
    platform_notifications_ensure_schema($pdo);

    $targetRole = trim((string)($data['target_role'] ?? $data['user_type'] ?? 'teacher'));
    $userId = (int)($data['user_id'] ?? 0);
    $title = trim((string)($data['title'] ?? 'Notification'));
    $message = trim((string)($data['message'] ?? $data['body'] ?? ''));
    $actionUrl = trim((string)($data['action_url'] ?? $data['url'] ?? ''));
    $actionLabel = trim((string)($data['action_label'] ?? 'Open'));
    $relatedType = trim((string)($data['related_entity_type'] ?? ''));
    $relatedId = (int)($data['related_entity_id'] ?? 0);
    $priority = trim((string)($data['priority'] ?? 'normal'));
    $eventKey = trim((string)($data['event_key'] ?? ''));
    if ($eventKey === '') {
        $eventKey = $targetRole . ':' . $userId . ':' . $relatedType . ':' . $relatedId . ':' . sha1($title . '|' . $message . '|' . $actionUrl);
    }

    $stmt = $pdo->prepare("
        INSERT INTO push_notifications
            (user_type, user_id, target_role, title, body, url, event_key, related_entity_type, related_entity_id, action_label, priority, shown_at)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    ");
    $stmt->execute([
        $targetRole,
        $userId,
        $targetRole,
        $title,
        $message,
        $actionUrl,
        $eventKey,
        $relatedType,
        $relatedId,
        $actionLabel,
        $priority !== '' ? $priority : 'normal',
    ]);

    $id = (int)$pdo->lastInsertId();
    communications_log_push($pdo, $targetRole, $userId, $title, $message, $actionUrl, 'logged');
    return $id;
}

function platform_notification_unread_count(PDO $pdo, string $role, int $userId): int
{
    platform_notifications_ensure_schema($pdo);
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM push_notifications
        WHERE (user_type = ? OR target_role = ?)
          AND user_id = ?
          AND read_at IS NULL
          AND created_at >= '2026-05-12 00:00:00'
    ");
    $stmt->execute([$role, $role, $userId]);
    return (int)$stmt->fetchColumn();
}

function platform_notification_mark_read(PDO $pdo, int $id, string $role, int $userId): bool
{
    platform_notifications_ensure_schema($pdo);
    $stmt = $pdo->prepare("
        UPDATE push_notifications
        SET read_at = COALESCE(read_at, NOW())
        WHERE id = ?
          AND (user_type = ? OR target_role = ?)
          AND user_id = ?
    ");
    $stmt->execute([$id, $role, $role, $userId]);
    return $stmt->rowCount() > 0;
}
