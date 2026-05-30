<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_teacher();

$pdo = get_pdo();
portals_ensure_schema($pdo);

/* ─── GET ──────────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = trim($_GET['action'] ?? '');

    if ($action === 'students') {
        $rows = portals_students($pdo);
        json_ok(['students' => $rows]);
    }

    $rows = $pdo->query("
        SELECT a.*,
               COUNT(ast.student_id) AS student_count,
               COALESCE(GROUP_CONCAT(
                   CONCAT(st.full_name, ' (', st.login_code, ')')
                   ORDER BY st.full_name SEPARATOR ', '
               ), '') AS students
        FROM academies a
        LEFT JOIN academy_students ast ON ast.academy_id = a.id AND ast.status = 'active'
        LEFT JOIN students st ON st.id = ast.student_id
        GROUP BY a.id
        ORDER BY a.created_at DESC
    ")->fetchAll(PDO::FETCH_ASSOC) ?: [];

    foreach ($rows as &$r) {
        $r['student_count'] = (int)$r['student_count'];
    }
    unset($r);

    json_ok(['academies' => $rows]);
}

/* ─── POST ─────────────────────────────────────────────────────────────── */
csrf_validate();
$action = trim($_POST['action'] ?? '');

if ($action === 'save') {
    $id       = (int)($_POST['id'] ?? 0);
    $name     = trim($_POST['name'] ?? '');
    if ($name === '') json_err('Academy name is required', 422);

    $contact    = trim($_POST['contact_name'] ?? '');
    $email      = trim($_POST['email'] ?? '');
    $whatsapp   = trim($_POST['whatsapp'] ?? '');
    $status     = in_array($_POST['status'] ?? '', ['active','paused','inactive'], true)
                    ? (string)$_POST['status'] : 'active';
    $notes      = trim($_POST['notes'] ?? '');
    $studentIds = portals_selected_student_ids($_POST);

    if ($id === 0) {
        $accessCode = portals_generate_access_code('AC');
        $stmt = $pdo->prepare("
            INSERT INTO academies (name, contact_name, email, whatsapp, status, notes, access_code, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$name, $contact ?: null, $email ?: null, $whatsapp ?: null, $status, $notes ?: null, $accessCode]);
        $id = (int)$pdo->lastInsertId();
    } else {
        $pdo->prepare("
            UPDATE academies
            SET name=?, contact_name=?, email=?, whatsapp=?, status=?, notes=?, updated_at=NOW()
            WHERE id=?
        ")->execute([$name, $contact ?: null, $email ?: null, $whatsapp ?: null, $status, $notes ?: null, $id]);
    }

    portals_sync_links($pdo, 'academy_students', 'academy_id', $id, $studentIds);
    json_ok(['id' => $id, 'message' => 'Academy saved']);
}

if ($action === 'delete') {
    $id = (int)($_POST['academy_id'] ?? 0);
    if ($id < 1) json_err('Invalid id', 422);
    $pdo->prepare("UPDATE academies SET status='inactive', updated_at=NOW() WHERE id=?")
        ->execute([$id]);
    json_ok(['message' => 'Academy deactivated']);
}

json_err('Unknown action', 400);
