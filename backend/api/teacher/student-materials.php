<?php
// api/teacher/student-materials.php — Get materials for a specific student (teacher view)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$student_id = (int)($_GET['student_id'] ?? 0);
if ($student_id <= 0) json_err('Invalid student');

try {
    $stmt = $pdo->prepare("
        SELECT id, student_id, title, type, category, level, tags, language,
               estimated_study_minutes, status, url, file_path, original_filename,
               allow_download, show_on_homepage, description, sort_order,
               is_published, created_at, updated_at
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
    $row['href']        = $row['file_path'] ? '/' . ltrim((string)$row['file_path'], '/') : $row['url'];
    $row['is_file']     = (bool)$row['file_path'];
    $row['source_type'] = $row['file_path'] ? 'file' : 'url';
    $row['allow_download']   = (bool)$row['allow_download'];
    $row['show_on_homepage'] = (bool)$row['show_on_homepage'];
    $row['is_published']     = (bool)$row['is_published'];
    $row['estimated_study_minutes'] = (int)$row['estimated_study_minutes'];
    $row['sort_order']  = (int)$row['sort_order'];
    $row['student_id']  = (int)$row['student_id'];
    $row['id']          = (int)$row['id'];
    unset($row['file_path'], $row['url']);
}
unset($row);

json_ok(['items' => $rows]);
