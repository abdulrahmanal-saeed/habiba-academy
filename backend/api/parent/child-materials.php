<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';
require_once __DIR__ . '/../../lib/lib/materials-library.php';
start_session();

if (empty($_SESSION['parent_id'])) json_err('Not authenticated', 401);
$parent_id = (int)$_SESSION['parent_id'];
portals_ensure_schema($pdo);

$child_id = (int)($_GET['id'] ?? 0);
if (!$child_id) json_err('Missing child id', 400);

// Verify parent owns this child
$verify = $pdo->prepare("
    SELECT 1 FROM parent_students
    WHERE parent_id=? AND student_id=? AND status='active'
    LIMIT 1
");
$verify->execute([$parent_id, $child_id]);
if (!$verify->fetch()) json_err('Access denied', 403);

$childStmt = $pdo->prepare("SELECT id, full_name, login_code, level FROM students WHERE id=? LIMIT 1");
$childStmt->execute([$child_id]);
$child = $childStmt->fetch();
if (!$child) json_err('Child not found', 404);

materials_ensure_schema($pdo);

$stmt = $pdo->prepare("
    SELECT cm.id, cm.title, cm.type, cm.category, cm.description,
           cm.external_url, cm.sort_order,
           mv.viewed_at
    FROM course_materials cm
    LEFT JOIN material_views mv ON mv.material_id = cm.id AND mv.student_id = ?
    WHERE cm.student_id = ? AND cm.is_active = 1
    ORDER BY cm.sort_order ASC, cm.id DESC
    LIMIT 100
");
$stmt->execute([$child_id, $child_id]);
$materials = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

foreach ($materials as &$m) {
    $m['viewed'] = !empty($m['viewed_at']);
    unset($m['viewed_at']);
}
unset($m);

json_ok(['child' => $child, 'materials' => $materials]);
