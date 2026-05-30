<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/push.php';
require_once __DIR__ . '/communications.php';

function cron_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) return;
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS cron_job_logs (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            job_key VARCHAR(100) NOT NULL,
            status VARCHAR(40) NOT NULL,
            message TEXT NULL,
            items_count INT UNSIGNED NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_job (job_key, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS cron_sent_log (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            job_key VARCHAR(100) NOT NULL,
            entity_type VARCHAR(80) NOT NULL,
            entity_id INT UNSIGNED NOT NULL,
            recipient_type VARCHAR(40) NOT NULL,
            recipient_id INT NOT NULL DEFAULT 0,
            sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_sent (job_key, entity_type, entity_id, recipient_type, recipient_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $done = true;
}

function cron_require_token(): void
{
    $expected = trim((string)(getenv('CRON_SECRET') ?: ''));
    if ($expected === '') $expected = 'HabibaCron2026';
    $got = trim((string)($_GET['token'] ?? $_POST['token'] ?? ''));
    if (!hash_equals($expected, $got)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Invalid cron token'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function cron_log(PDO $pdo, string $job, string $status, string $message, int $count = 0): void
{
    cron_ensure_schema($pdo);
    $pdo->prepare("INSERT INTO cron_job_logs (job_key, status, message, items_count) VALUES (?, ?, ?, ?)")
        ->execute([$job, $status, $message, $count]);
}

function cron_already_sent(PDO $pdo, string $job, string $entityType, int $entityId, string $recipientType, int $recipientId): bool
{
    cron_ensure_schema($pdo);
    $stmt = $pdo->prepare("SELECT id FROM cron_sent_log WHERE job_key=? AND entity_type=? AND entity_id=? AND recipient_type=? AND recipient_id=? LIMIT 1");
    $stmt->execute([$job, $entityType, $entityId, $recipientType, $recipientId]);
    return (bool)$stmt->fetchColumn();
}

function cron_mark_sent(PDO $pdo, string $job, string $entityType, int $entityId, string $recipientType, int $recipientId): void
{
    cron_ensure_schema($pdo);
    $pdo->prepare("INSERT IGNORE INTO cron_sent_log (job_key, entity_type, entity_id, recipient_type, recipient_id) VALUES (?, ?, ?, ?, ?)")
        ->execute([$job, $entityType, $entityId, $recipientType, $recipientId]);
}

function cron_send_lesson_reminders(PDO $pdo, int $hours): int
{
    cron_ensure_schema($pdo);
    $job = 'lesson_reminder_' . $hours . 'h';
    $stmt = $pdo->prepare("
        SELECT lps.id, lps.student_id, lps.title, lps.planned_date,
               COALESCE(lps.session_time, lps.planned_time) AS session_time,
               st.full_name
        FROM lesson_plan_sessions lps
        JOIN students st ON st.id = lps.student_id
        WHERE lps.status IN ('planned','rescheduled','confirmed')
          AND TIMESTAMP(lps.planned_date, COALESCE(lps.session_time, lps.planned_time, '00:00:00'))
              BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? HOUR)
        ORDER BY lps.planned_date ASC
        LIMIT 100
    ");
    $stmt->execute([$hours]);
    $count = 0;
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $id = (int)$row['id'];
        $studentId = (int)$row['student_id'];
        if (cron_already_sent($pdo, $job, 'lesson_session', $id, 'student', $studentId)) continue;
        $title = 'Lesson reminder';
        $body = 'Your lesson is coming soon: ' . (string)$row['planned_date'] . ' ' . (string)$row['session_time'];
        push_notify_student($pdo, $studentId, $title, $body, '/student/session-notes.php');
        cron_mark_sent($pdo, $job, 'lesson_session', $id, 'student', $studentId);
        $count++;
    }
    cron_log($pdo, $job, 'ok', 'Lesson reminders processed', $count);
    return $count;
}

function cron_send_homework_reminders(PDO $pdo): int
{
    cron_ensure_schema($pdo);
    $job = 'homework_reminder';
    $stmt = $pdo->query("
        SELECT h.id, h.student_id, h.title, st.full_name
        FROM homeworks h
        JOIN students st ON st.id = h.student_id
        LEFT JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_id = h.student_id
        WHERE h.status = 'published'
          AND COALESCE(hs.is_submitted, 0) = 0
          AND COALESCE(h.publish_at, CONCAT(h.hw_date, ' 00:00:00')) <= NOW()
        ORDER BY h.id DESC
        LIMIT 100
    ");
    $count = 0;
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $id = (int)$row['id'];
        $studentId = (int)$row['student_id'];
        if (cron_already_sent($pdo, $job, 'homework', $id, 'student', $studentId)) continue;
        push_notify_student($pdo, $studentId, 'Homework reminder', 'Please complete: ' . (string)$row['title'], '/student/homework.php?homework_id=' . $id);
        cron_mark_sent($pdo, $job, 'homework', $id, 'student', $studentId);
        $count++;
    }
    cron_log($pdo, $job, 'ok', 'Homework reminders processed', $count);
    return $count;
}
