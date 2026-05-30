<?php
declare(strict_types=1);

function ensure_student_notification_reads(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_notification_reads (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id INT UNSIGNED NOT NULL,
            notification_key VARCHAR(160) NOT NULL,
            read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_student_notification_read (student_id, notification_key),
            KEY idx_student_notification_reads_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $done = true;
}

function student_notification_key(string $type, int $id): string
{
    return $type . ':' . $id;
}

function student_notification_mark_read(PDO $pdo, int $studentId, string $key): void
{
    if ($studentId <= 0 || $key === '') {
        return;
    }
    ensure_student_notification_reads($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO student_notification_reads (student_id, notification_key, read_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE read_at = VALUES(read_at)
    ");
    $stmt->execute([$studentId, $key]);
}

function student_notification_read_keys(PDO $pdo, int $studentId): array
{
    if ($studentId <= 0) {
        return [];
    }
    ensure_student_notification_reads($pdo);
    $stmt = $pdo->prepare("SELECT notification_key FROM student_notification_reads WHERE student_id = ?");
    $stmt->execute([$studentId]);
    return array_flip($stmt->fetchAll(PDO::FETCH_COLUMN) ?: []);
}
