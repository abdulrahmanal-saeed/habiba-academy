<?php
// api/teacher/student-materials.php — Get materials for a specific student (teacher view)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$student_id = (int)($_GET['student_id'] ?? 0);
if ($student_id <= 0) json_err('Invalid student');

try {
    $stmt = $pdo->prepare("
        SELECT id, title, type, url, file_path, description, sort_order, is_published, created_at
        FROM   course_materials
        WHERE  student_id = ?
        ORDER  BY sort_order ASC, id ASC
    ");
    $stmt->execute([$student_id]);
    $rows = $stmt->fetchAll();
} catch (Throwable $e) {
    json_ok(['items' => []]);
    exit;
}

foreach ($rows as &$row) {
    $row['href']    = $row['file_path'] ? '/' . ltrim($row['file_path'], '/') : $row['url'];
    $row['is_file'] = (bool)$row['file_path'];
    unset($row['file_path'], $row['url']);
}
unset($row);

json_ok(['items' => $rows]);
