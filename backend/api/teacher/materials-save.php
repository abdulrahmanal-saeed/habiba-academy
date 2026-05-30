<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/notify.php';
require_once __DIR__ . '/../../lib/lib/learning-audit.php';
require_once __DIR__ . '/../../lib/lib/materials-library.php';
require_once __DIR__ . '/../../config/config/db.php';

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

materials_ensure_schema($pdo);

$id         = (int)($_POST['id'] ?? 0);
$studentId  = (int)($_POST['student_id'] ?? 0);
$title      = trim((string)($_POST['title'] ?? ''));
$type       = trim((string)($_POST['type'] ?? 'link'));
$category   = trim((string)($_POST['category'] ?? ''));
$level      = trim((string)($_POST['level'] ?? ''));
$tags       = trim((string)($_POST['tags'] ?? ''));
$language   = trim((string)($_POST['language'] ?? 'both'));
$estimated  = max(0, min(999, (int)($_POST['estimated_study_minutes'] ?? 0)));
$description = trim((string)($_POST['description'] ?? ''));
$sortOrder  = max(0, (int)($_POST['sort_order'] ?? 0));
$status     = trim((string)($_POST['status'] ?? 'published'));
$showOnHomepage = (int)(!empty($_POST['show_on_homepage']));
$allowDownload  = (int)(!empty($_POST['allow_download']));
$sourceType = ($_POST['source_type'] ?? 'url') === 'file' ? 'file' : 'url';

$validTypes    = array_keys(materials_types());
$validStatuses = ['draft', 'published', 'hidden', 'archived'];
$validLanguages = ['arabic', 'english', 'both'];

if ($studentId <= 0) json_err('Please select a student');
if ($title === '') json_err('Title is required');
if (!in_array($type, $validTypes, true)) $type = 'link';
if (!in_array($status, $validStatuses, true)) $status = 'published';
if (!in_array($language, $validLanguages, true)) $language = 'both';

$url = '';
$filePath = '';
$originalFilename = '';
$mimeType = '';
$fileSize = 0;
$oldRow = null;

if ($id > 0) {
    $stmt = $pdo->prepare("SELECT * FROM course_materials WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $oldRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$oldRow) json_err('Material not found', 404);
    $filePath = (string)($oldRow['file_path'] ?? '');
    $url = (string)($oldRow['url'] ?? '');
    $originalFilename = (string)($oldRow['original_filename'] ?? '');
    $mimeType = (string)($oldRow['mime_type'] ?? '');
    $fileSize = (int)($oldRow['file_size'] ?? 0);
}

if ($sourceType === 'file') {
    $hasNewFile = !empty($_FILES['material_file']['tmp_name'])
        && ($_FILES['material_file']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK;

    if ($hasNewFile) {
        try {
            $upload = materials_save_upload($_FILES['material_file'], $studentId);
        } catch (Throwable $e) {
            json_err($e->getMessage());
        }

        if ($id > 0 && $filePath !== '') {
            $oldFile = __DIR__ . '/../../' . ltrim($filePath, '/');
            if (is_file($oldFile)) @unlink($oldFile);
        }

        $filePath = (string)$upload['file_path'];
        $originalFilename = (string)$upload['original_filename'];
        $mimeType = (string)$upload['mime_type'];
        $fileSize = (int)$upload['file_size'];
        $type = in_array($type, ['link', 'video_link'], true) ? (string)$upload['type'] : $type;
        $url = '';
    } elseif ($id <= 0) {
        json_err('Please upload a file');
    }
} else {
    $url = trim((string)($_POST['url'] ?? ''));
    if ($url === '' && !in_array($type, ['article', 'mixed'], true)) {
        json_err('URL is required');
    }
    if ($url !== '' && !preg_match('~^https?://~i', $url)) {
        json_err('URL must start with http:// or https://');
    }
    if ($url !== '' && in_array($type, ['video', 'link'], true) && materials_video_embed_url($url) !== '') {
        $type = 'video_link';
    }
    if ($id > 0 && $filePath !== '') {
        $filePath = '';
        $originalFilename = '';
        $mimeType = '';
        $fileSize = 0;
    }
}

$isPublished = $status === 'published' ? 1 : 0;
$archivedAtSql = $status === 'archived' ? 'NOW()' : 'NULL';

if ($id > 0) {
    $sql = "
        UPDATE course_materials
        SET student_id = ?, title = ?, type = ?, category = ?, level = ?, tags = ?, language = ?,
            estimated_study_minutes = ?, status = ?, url = ?, file_path = ?, original_filename = ?,
            mime_type = ?, file_size = ?, allow_download = ?, description = ?, sort_order = ?,
            is_published = ?, show_on_homepage = ?, updated_at = NOW(), archived_at = {$archivedAtSql}
        WHERE id = ?
    ";
    $pdo->prepare($sql)->execute([
        $studentId, $title, $type, $category, $level, $tags, $language,
        $estimated, $status, $url, $filePath, $originalFilename,
        $mimeType, $fileSize, $allowDownload, $description, $sortOrder,
        $isPublished, $showOnHomepage, $id,
    ]);

    if ($isPublished) {
        push_notify_student($pdo, $studentId, 'Material updated', $title, '/student/materials');
    }
    learning_audit($pdo, 'material_updated', 'course_material', $id, [
        'student_id' => $studentId,
        'title'      => $title,
        'type'       => $type,
        'status'     => $status,
    ], is_array($oldRow) ? $oldRow : [], 'teacher', null);
    json_ok(['id' => $id]);
}

$pdo->prepare("
    INSERT INTO course_materials
        (student_id, title, type, category, level, tags, language, estimated_study_minutes,
         status, url, file_path, original_filename, mime_type, file_size, allow_download,
         description, sort_order, is_published, show_on_homepage, created_by, created_at, updated_at, archived_at)
    VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW(), {$archivedAtSql})
")->execute([
    $studentId, $title, $type, $category, $level, $tags, $language, $estimated,
    $status, $url, $filePath, $originalFilename, $mimeType, $fileSize, $allowDownload,
    $description, $sortOrder, $isPublished, $showOnHomepage,
]);

$newId = (int)$pdo->lastInsertId();
if ($isPublished) {
    push_notify_student($pdo, $studentId, 'New material assigned', $title, '/student/materials');
}
learning_audit($pdo, 'material_created', 'course_material', $newId, [
    'student_id' => $studentId,
    'title'      => $title,
    'type'       => $type,
    'status'     => $status,
], [], 'teacher', null);

json_ok(['id' => $newId]);
