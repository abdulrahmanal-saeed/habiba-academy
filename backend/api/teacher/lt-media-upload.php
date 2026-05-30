<?php
// api/teacher/lt-media-upload.php — Upload audio or image files for the level test question bank
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/settings.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

// CSRF token in POST body (multipart/form-data cannot use headers)
$csrfInput = trim((string)($_POST['csrf_token'] ?? $_POST['_csrf'] ?? ''));
$csrfSess  = (string)($_SESSION['csrf_token'] ?? '');
if ($csrfSess === '' || !hash_equals($csrfSess, $csrfInput)) {
    json_err('CSRF token mismatch', 403);
}

$mediaType = trim((string)($_POST['media_type'] ?? ''));

if ($mediaType === 'audio') {
    if (empty($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        json_err('No file uploaded');
    }
    $f = $_FILES['file'];
    if ($f['error'] !== UPLOAD_ERR_OK)   json_err('Upload error: ' . $f['error']);
    if ($f['size'] <= 0)                  json_err('File is empty');
    if ($f['size'] > 50 * 1024 * 1024)   json_err('Audio file too large (max 50 MB)');

    $allowedAudio = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'video/webm'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $f['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, $allowedAudio, true)) {
        json_err('Invalid audio type: ' . $mime . '. Allowed: MP3, M4A, OGG, WAV, WebM');
    }

    $ext = match(true) {
        str_contains($mime, 'ogg')  => 'ogg',
        str_contains($mime, 'wav')  => 'wav',
        str_contains($mime, 'mp4')  => 'm4a',
        str_contains($mime, 'mpeg') => 'mp3',
        default                     => 'webm',
    };

    $dir = __DIR__ . '/../../assets/audio/leveltest/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $filename = 'lt_audio_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $dest     = $dir . $filename;

    if (!move_uploaded_file($f['tmp_name'], $dest)) json_err('Failed to save audio file');

    $path = 'assets/audio/leveltest/' . $filename;
    json_ok(['path' => $path, 'url' => '/' . $path]);
}

if ($mediaType === 'image') {
    $settingKey = trim((string)($_POST['setting_key'] ?? ''));

    if (empty($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        json_err('No file uploaded');
    }
    $f = $_FILES['file'];
    if ($f['error'] !== UPLOAD_ERR_OK)   json_err('Upload error: ' . $f['error']);
    if ($f['size'] <= 0)                  json_err('File is empty');
    if ($f['size'] > 10 * 1024 * 1024)   json_err('Image too large (max 10 MB)');

    $allowedImages = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $f['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, $allowedImages, true)) {
        json_err('Invalid image type: ' . $mime . '. Allowed: JPG, PNG, WEBP');
    }

    $ext = match($mime) {
        'image/png'  => 'png',
        'image/webp' => 'webp',
        default      => 'jpg',
    };

    $dir = __DIR__ . '/../../assets/img/leveltest/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $filename = 'lt_img_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $dest     = $dir . $filename;

    if (!move_uploaded_file($f['tmp_name'], $dest)) json_err('Failed to save image file');

    $path = 'assets/img/leveltest/' . $filename;

    if ($settingKey !== '' && preg_match('/^lt_sp\d+_image$/', $settingKey)) {
        update_setting($settingKey, $path);
    }

    json_ok(['path' => $path, 'url' => '/' . $path]);
}

json_err('Unknown media_type. Use "audio" or "image".');
