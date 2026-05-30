<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_teacher();

$pdo = get_pdo();
portals_ensure_schema($pdo);

/* ── GET ──────────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (trim((string)($_GET['action'] ?? '')) === 'students') {
        json_ok(['students' => portals_students($pdo)]);
    }

    $rows = $pdo->query("
        SELECT p.id, p.full_name, p.email, p.whatsapp, p.status, p.notes,
               p.access_code, p.created_at,
               COUNT(ps.student_id) AS student_count,
               GROUP_CONCAT(
                   CONCAT(st.full_name, ' (', st.login_code, ')')
                   ORDER BY st.full_name SEPARATOR ', '
               ) AS students
        FROM parent_contacts p
        LEFT JOIN parent_students ps ON ps.parent_id = p.id AND ps.status = 'active'
        LEFT JOIN students st ON st.id = ps.student_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
    ")->fetchAll(PDO::FETCH_ASSOC) ?: [];

    json_ok(['parents' => $rows]);
}

/* ── POST ─────────────────────────────────────────────────────────────── */
$raw    = file_get_contents('php://input');
$json   = $raw ? json_decode($raw, true) : null;
$action = (string)($json['action'] ?? $_POST['action'] ?? '');

if ($action === 'save') {
    csrf_validate();
    $name = trim((string)($json['full_name'] ?? ''));
    if ($name === '') {
        json_err('Parent name is required.', 400);
    }

    $email      = trim((string)($json['email'] ?? ''));
    $whatsapp   = trim((string)($json['whatsapp'] ?? ''));
    $status     = trim((string)($json['status'] ?? 'active'));
    $notes      = trim((string)($json['notes'] ?? ''));
    $studentIds = array_map('intval', (array)($json['student_ids'] ?? []));

    $accessCode = portals_generate_access_code('PR');
    $stmt = $pdo->prepare("
        INSERT INTO parent_contacts (full_name, email, whatsapp, status, notes, access_code, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$name, $email ?: null, $whatsapp ?: null, $status, $notes ?: null, $accessCode]);
    $parentId = (int)$pdo->lastInsertId();
    portals_sync_links($pdo, 'parent_students', 'parent_id', $parentId, $studentIds);

    json_ok(['message' => 'Parent saved.', 'access_code' => $accessCode]);
}

if ($action === 'delete') {
    csrf_validate();
    $id = (int)($json['id'] ?? 0);
    if ($id < 1) {
        json_err('Invalid ID', 400);
    }
    $pdo->prepare("UPDATE parent_contacts SET status='inactive', updated_at=NOW() WHERE id=?")
        ->execute([$id]);
    json_ok(['message' => 'Parent deactivated.']);
}

json_err('Invalid action', 400);
