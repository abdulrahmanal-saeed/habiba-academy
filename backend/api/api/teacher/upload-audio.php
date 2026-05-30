<?php
// api/teacher/upload-audio.php — Upload an audio file for homework listening section
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$type = trim((string)($_POST['type'] ?? 'listening'));
if (!in_array($type, ['listening', 'scenario'], true)) $type = 'listening';

if (empty($_FILES['audio']) || $_FILES['audio']['error'] === UPLOAD_ERR_NO_FILE) {
    json_err('No file uploaded');
}

$uploadDir = __DIR__ . '/../../uploads/' . $type . '/';
$prefix    = 'teacher_' . $type . '_' . time();

try {
    $relPath = save_audio($_FILES['audio'], $uploadDir, $prefix);
    json_ok(['path' => $relPath, 'url' => '/' . $relPath]);
} catch (RuntimeException $e) {
    json_err($e->getMessage());
}
