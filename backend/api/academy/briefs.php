<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/student-briefs.php';
require_once __DIR__ . '/../../lib/lib/platform-notifications.php';

start_session();
if (empty($_SESSION['academy_id'])) json_err('Not authenticated', 401);
$academy_id = (int)$_SESSION['academy_id'];
portals_ensure_schema($pdo);
ensure_student_brief_tables($pdo);

$method = $_SERVER['REQUEST_METHOD'];

// GET ?id=N — single brief detail
if ($method === 'GET' && !empty($_GET['id'])) {
    $id   = (int)$_GET['id'];
    $stmt = $pdo->prepare('SELECT * FROM student_briefs WHERE id = ? AND academy_id = ? LIMIT 1');
    $stmt->execute([$id, $academy_id]);
    $brief = $stmt->fetch();
    if (!$brief) json_err('Brief not found', 404);
    json_ok(['brief' => $brief]);
}

// GET — list all briefs
if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, student_name, main_goal, brief_status, created_at
         FROM student_briefs
         WHERE academy_id = ?
         ORDER BY created_at DESC, id DESC'
    );
    $stmt->execute([$academy_id]);
    json_ok(['briefs' => $stmt->fetchAll() ?: []]);
}

// POST — create new brief
if ($method === 'POST') {
    $input = (array)(json_decode((string)file_get_contents('php://input'), true) ?? $_POST);

    [$data, $errors] = student_brief_validate($input, 'academy');
    if ($errors) json_err(array_values($errors)[0], 400);

    $aStmt = $pdo->prepare('SELECT name, email FROM academies WHERE id = ? LIMIT 1');
    $aStmt->execute([$academy_id]);
    $acad = $aStmt->fetch() ?: [];

    $ins = $pdo->prepare("
        INSERT INTO student_briefs
            (academy_id, student_name, age, source_name, source_email, nationality,
             contracted_hours, native_language, studied_arabic_before, learning_reason,
             main_goal, target_duration, additional_notes, speaking_ability,
             reading_writing_ability, parent_contact_info, preferred_schedule,
             submitted_by_role, brief_status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'academy','submitted')
    ");
    $ins->execute([
        $academy_id,
        $data['student_name'],
        trim((string)($input['age'] ?? '')),
        $acad['name'] ?? '',
        $acad['email'] ?? '',
        $data['nationality'],
        $data['contracted_hours'],
        $data['native_language'],
        $data['studied_arabic_before'],
        $data['learning_reason'],
        $data['main_goal'],
        $data['target_duration'],
        $data['additional_notes'] ?: null,
        trim((string)($input['speaking_ability'] ?? '')) ?: null,
        trim((string)($input['reading_writing_ability'] ?? '')) ?: null,
        trim((string)($input['parent_contact_info'] ?? '')) ?: null,
        trim((string)($input['preferred_schedule'] ?? '')) ?: null,
    ]);
    $briefId = (int)$pdo->lastInsertId();

    platform_notify($pdo, [
        'target_role'         => 'teacher',
        'user_id'             => 0,
        'title'               => 'New academy brief',
        'message'             => 'Academy submitted a new brief for ' . $data['student_name'],
        'action_label'        => 'Review Brief',
        'action_url'          => '/owner/academy-briefs/detail.php?id=' . $briefId,
        'related_entity_type' => 'academy_brief',
        'related_entity_id'   => $briefId,
    ]);

    json_ok(['id' => $briefId]);
}

json_err('Method not allowed', 405);
