<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/materials-library.php';
require_once __DIR__ . '/../../lib/lib/learning-audit.php';
require_once __DIR__ . '/../../config/config/db.php';

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

materials_ensure_schema($pdo);
$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) json_err('Invalid ID');

$stmt = $pdo->prepare("SELECT * FROM course_materials WHERE id = ? LIMIT 1");
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) json_err('Material not found', 404);

$progress = $pdo->prepare("SELECT COUNT(*) FROM material_progress WHERE material_id = ?");
$progress->execute([$id]);
$hasProgress = (int)$progress->fetchColumn() > 0;

if ($hasProgress) {
    $pdo->prepare("
        UPDATE course_materials
        SET status = 'archived', is_published = 0, archived_at = NOW(), updated_at = NOW()
        WHERE id = ?
    ")->execute([$id]);
    learning_audit($pdo, 'material_archived', 'course_material', $id, ['reason' => 'has_progress'], $row, 'teacher', null);
    json_ok(['archived' => true]);
}

$pdo->prepare("DELETE FROM course_materials WHERE id = ?")->execute([$id]);
if (!empty($row['file_path'])) {
    $filePath = __DIR__ . '/../../' . ltrim((string)$row['file_path'], '/');
    if (is_file($filePath)) @unlink($filePath);
}
learning_audit($pdo, 'material_deleted', 'course_material', $id, [], $row, 'teacher', null);
json_ok(['deleted' => true]);
