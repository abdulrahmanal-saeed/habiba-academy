<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/ai-helpers.php';
require_once __DIR__ . '/../../lib/lib/book-notifications.php';
require_once __DIR__ . '/../../config/config/db.php';

$pdo = get_db();
book_notifications_ensure_schema($pdo);

$teacherId = ai_teacher_id($pdo);

/* ── GET — list notifications ──────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $limit      = max(1, min(100, (int)($_GET['limit'] ?? 30)));
    $offset     = max(0, (int)($_GET['offset'] ?? 0));
    $unreadOnly = isset($_GET['unread_only']) && $_GET['unread_only'] === '1';

    $where  = "(user_type = 'teacher' OR target_role = 'teacher') AND user_id = ? AND channel_in_app = 1";
    $params = [$teacherId];

    if ($unreadOnly) {
        $where .= ' AND is_read = 0';
    }

    $rows = $pdo->prepare(
        "SELECT id, notification_type, title, body, url, action_label, priority,
                is_read, read_at, created_at, student_id, submission_id, book_id, metadata_json
         FROM push_notifications
         WHERE {$where}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?"
    );
    $rows->execute([...$params, $limit, $offset]);
    $notifications = $rows->fetchAll(PDO::FETCH_ASSOC) ?: [];

    foreach ($notifications as &$n) {
        $n['is_read']      = (bool)$n['is_read'];
        $n['student_id']   = $n['student_id']   !== null ? (int)$n['student_id']   : null;
        $n['submission_id']= $n['submission_id'] !== null ? (int)$n['submission_id'] : null;
        $n['book_id']      = $n['book_id']       !== null ? (int)$n['book_id']       : null;
    }
    unset($n);

    $totalStmt = $pdo->prepare(
        "SELECT COUNT(*) FROM push_notifications WHERE {$where}"
    );
    $totalStmt->execute($params);
    $total = (int)$totalStmt->fetchColumn();

    $countStmt = $pdo->prepare(
        "SELECT COUNT(*) FROM push_notifications
         WHERE (user_type = 'teacher' OR target_role = 'teacher')
           AND user_id = ? AND is_read = 0 AND channel_in_app = 1"
    );
    $countStmt->execute([$teacherId]);
    $unreadCount = (int)$countStmt->fetchColumn();

    json_ok(['notifications' => $notifications, 'unread_count' => $unreadCount, 'total' => $total]);
    exit;
}

/* ── POST — mark read ──────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_validate();
    $action = trim((string)($_POST['action'] ?? ''));

    if ($action === 'mark_all') {
        $pdo->prepare(
            "UPDATE push_notifications
             SET read_at = COALESCE(read_at, NOW()), is_read = 1
             WHERE (user_type = 'teacher' OR target_role = 'teacher') AND user_id = ?"
        )->execute([$teacherId]);
    } elseif ($action === 'mark_read') {
        $notifId = (int)($_POST['notification_id'] ?? 0);
        if ($notifId <= 0) { json_err('notification_id required'); exit; }
        $pdo->prepare(
            "UPDATE push_notifications
             SET read_at = COALESCE(read_at, NOW()), is_read = 1
             WHERE id = ? AND (user_type = 'teacher' OR target_role = 'teacher') AND user_id = ?"
        )->execute([$notifId, $teacherId]);
    } else {
        json_err('invalid action');
        exit;
    }

    $countStmt = $pdo->prepare(
        "SELECT COUNT(*) FROM push_notifications
         WHERE (user_type = 'teacher' OR target_role = 'teacher')
           AND user_id = ? AND is_read = 0 AND channel_in_app = 1"
    );
    $countStmt->execute([$teacherId]);
    json_ok(['unread_count' => (int)$countStmt->fetchColumn()]);
    exit;
}

json_err('method not allowed');
