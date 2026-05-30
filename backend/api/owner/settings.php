<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/settings.php';
require_teacher();

$pdo  = get_pdo();
$tbl  = settings_table_name($pdo);

$PROFILE_KEYS = ['contact_whatsapp','social_instagram','social_facebook','social_youtube','social_tiktok','teacher_photo_v'];
$FLAG_KEYS    = ['enable_videos_page','show_videos_on_homepage','enable_articles_page','show_articles_on_homepage'];

/* ─── GET ─────────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $flags   = [];
    $profile = [];

    foreach ($FLAG_KEYS as $k) {
        $flags[$k] = setting_enabled($k, false);
    }
    foreach ($PROFILE_KEYS as $k) {
        $defaults = ['contact_whatsapp' => '971509298326', 'teacher_photo_v' => '1'];
        $profile[$k] = get_setting($k, $defaults[$k] ?? '');
    }

    json_ok(['flags' => $flags, 'profile' => $profile]);
}

/* ─── POST ────────────────────────────────────────────────────────────── */
$raw    = file_get_contents('php://input');
$json   = $raw ? json_decode($raw, true) : null;
$action = $json['action'] ?? $_POST['action'] ?? '';

if ($action === 'update_flags') {
    csrf_validate();
    foreach ($FLAG_KEYS as $k) {
        if (isset($json[$k])) {
            update_setting($k, $json[$k] ? '1' : '0');
        }
    }
    json_ok(['message' => 'Flags updated']);
}

if ($action === 'update_profile') {
    csrf_validate();

    $whatsapp = preg_replace('/\D/', '', $_POST['contact_whatsapp'] ?? '');
    if ($whatsapp !== '') update_setting('contact_whatsapp', $whatsapp);

    foreach (['social_instagram','social_facebook','social_youtube','social_tiktok'] as $k) {
        if (isset($_POST[$k])) update_setting($k, trim($_POST[$k]));
    }

    /* Photo upload */
    if (!empty($_FILES['teacher_photo']['tmp_name'])) {
        $file = $_FILES['teacher_photo'];
        $allowed = ['image/jpeg','image/png','image/webp'];
        if (!in_array($file['type'], $allowed, true)) json_err('Invalid image type', 422);
        if ($file['size'] > 2 * 1024 * 1024)          json_err('Image too large (max 2 MB)', 422);

        $dest = __DIR__ . '/../../assets/img/habiba.jpg';
        if (!move_uploaded_file($file['tmp_name'], $dest)) json_err('Upload failed', 500);

        $v = (string) time();
        update_setting('teacher_photo_v', $v);
    }

    json_ok(['message' => 'Profile updated']);
}

json_err('Unknown action', 400);
