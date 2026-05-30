<?php
// api/student/material-detail.php — Fetch material + auto-mark viewed
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/materials-library.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
$student_id  = (int)$_SESSION['student_id'];
$material_id = (int)($_GET['id'] ?? 0);
if (!$material_id) json_err('Missing id');

$material = materials_get_for_student($pdo, $student_id, $material_id);
if (!$material) json_err('Material not found', 404);

// Auto-mark viewed on detail load — mirrors PHP page behaviour
materials_mark_viewed($pdo, $student_id, $material_id);

$href = materials_href($material);

json_ok([
    'data' => [
        'id'                      => (int)$material['id'],
        'title'                   => $material['title'],
        'type'                    => $material['type'],
        'href'                    => $href,
        'is_file'                 => !empty($material['file_path']),
        'description'             => $material['description'],
        'sort_order'              => (int)$material['sort_order'],
        'category'                => $material['category'] ?? '',
        'level'                   => $material['level'] ?? '',
        'language'                => $material['language'] ?? 'both',
        'estimated_study_minutes' => (int)($material['estimated_study_minutes'] ?? 0),
        'allow_download'          => (int)($material['allow_download'] ?? 1),
        'mime_type'               => $material['mime_type'] ?? '',
        'original_filename'       => $material['original_filename'] ?? '',
        'viewed_at'               => $material['viewed_at'],
        'completed_at'            => $material['completed_at'],
        'progress_status'         => $material['progress_status'] ?? 'assigned',
        'download_count'          => (int)($material['download_count'] ?? 0),
    ],
]);
