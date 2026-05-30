<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/student-briefs.php';
require_once __DIR__ . '/../../lib/lib/platform-notifications.php';
require_teacher();

$pdo = get_pdo();
ensure_student_brief_tables($pdo);

/* ─── GET ──────────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = (int)($_GET['id'] ?? 0);

    if ($id > 0) {
        $stmt = $pdo->prepare("
            SELECT b.*, a.name AS academy_name
            FROM student_briefs b
            LEFT JOIN academies a ON a.id = b.academy_id
            WHERE b.id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $brief = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$brief) json_err('Brief not found', 404);
        json_ok(['brief' => $brief]);
    }

    $rows = $pdo->query("
        SELECT b.*, a.name AS academy_name
        FROM student_briefs b
        LEFT JOIN academies a ON a.id = b.academy_id
        ORDER BY b.created_at DESC, b.id DESC
    ")->fetchAll(PDO::FETCH_ASSOC) ?: [];

    json_ok(['briefs' => $rows]);
}

/* ─── POST ─────────────────────────────────────────────────────────────── */
csrf_validate();
$action = trim($_POST['action'] ?? '');

if ($action === 'update_status') {
    $id     = (int)($_POST['id'] ?? 0);
    $status = trim($_POST['brief_status'] ?? 'under_review');
    $notes  = trim($_POST['owner_notes'] ?? '');

    $allowed = ['submitted','under_review','needs_more_info','accepted','converted_to_student','rejected','archived'];
    if (!in_array($status, $allowed, true)) json_err('Invalid status', 422);
    if ($id < 1) json_err('Invalid id', 422);

    $old = $pdo->prepare("SELECT * FROM student_briefs WHERE id=? LIMIT 1");
    $old->execute([$id]);
    $brief = $old->fetch(PDO::FETCH_ASSOC);
    if (!$brief) json_err('Brief not found', 404);

    $pdo->prepare("
        UPDATE student_briefs
        SET brief_status=?, owner_notes=?,
            conversion_status=IF(?='converted_to_student','converted',conversion_status),
            converted_at=IF(?='converted_to_student',NOW(),converted_at)
        WHERE id=?
    ")->execute([$status, $notes, $status, $status, $id]);

    if (!empty($brief['academy_id'])) {
        platform_notify($pdo, [
            'target_role'         => 'academy',
            'user_id'             => (int)$brief['academy_id'],
            'title'               => 'Brief status updated',
            'message'             => 'Status changed to ' . str_replace('_', ' ', $status)
                                     . ' for ' . (string)($brief['student_name'] ?? 'student') . '.',
            'action_label'        => 'Open Brief',
            'action_url'          => '/academy/briefs/detail.php?id=' . $id,
            'related_entity_type' => 'academy_brief',
            'related_entity_id'   => $id,
        ]);
    }

    json_ok(['message' => 'Brief updated', 'status' => $status]);
}

json_err('Unknown action', 400);
