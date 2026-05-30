<?php
// lib/helpers.php — Shared utility functions used across the entire application
declare(strict_types=1);

if (!function_exists('app_timezone')) {
    function app_timezone(): string {
        $tz = trim((string)(getenv('APP_TIMEZONE') ?: 'Asia/Dubai'));
        return $tz !== '' ? $tz : 'Asia/Dubai';
    }
}

if (!defined('APP_TIMEZONE_BOOTSTRAPPED')) {
    @date_default_timezone_set(app_timezone());
    define('APP_TIMEZONE_BOOTSTRAPPED', true);
}

// ── Session ─────────────────────────────────────────────────────────────────

/**
 * Start session if not already active.
 */
function start_session(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

// ── Output sanitization ──────────────────────────────────────────────────────

/**
 * Escape a value for safe HTML output.
 */
function h(mixed $s): string {
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

// ── JSON responses ───────────────────────────────────────────────────────────

/**
 * Send a success JSON response and exit.
 */
function json_ok(array $data = []): never {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['ok' => true], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send an error JSON response and exit.
 */
function json_err(string $message, int $httpCode = 400): never {
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// ── CSRF protection ──────────────────────────────────────────────────────────

/**
 * Generate or return the current session CSRF token.
 */
function csrf_token(): string {
    start_session();
    if (empty($_SESSION['_csrf_token'])) {
        $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['_csrf_token'];
}

/**
 * Validate the CSRF token from POST. Sends 403 + JSON error if invalid.
 */
function csrf_validate(): void {
    start_session();
    $token = trim((string)($_POST['_csrf'] ?? ''));
    if (empty($token) || !hash_equals((string)($_SESSION['_csrf_token'] ?? ''), $token)) {
        json_err('CSRF token mismatch. Please refresh the page.', 403);
    }
}

// ── Auth guards ──────────────────────────────────────────────────────────────

/**
 * Require student to be logged in. Returns student_id or redirects.
 * Call from within student/* pages (one level deep).
 */
function require_student(): int {
    start_session();
    if (empty($_SESSION['student_id'])) {
        header('Location: /student/login.php');
        exit;
    }
    return (int)$_SESSION['student_id'];
}

/**
 * Require teacher to be logged in. Redirects to teacher login if not.
 * Call from within teacher/* pages (one level deep).
 */
function require_teacher(): void {
    start_session();
    if (empty($_SESSION['teacher_logged'])) {
        header('Location: /teacher/login.php');
        exit;
    }
}

// ── File uploads ─────────────────────────────────────────────────────────────

/**
 * Save an uploaded audio file to a given directory.
 * Returns the relative path on success, or throws on failure.
 *
 * @param array  $file       Single entry from $_FILES (e.g. $_FILES['audio'])
 * @param string $uploadDir  Absolute path to the target directory
 * @param string $prefix     Filename prefix (e.g. 'sp_123_456')
 * @return string            Relative path stored in DB (e.g. 'uploads/speaking/sp_…webm')
 */
function save_audio(array $file, string $uploadDir, string $prefix): string {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload failed (error ' . $file['error'] . ')');
    }
    if ($file['size'] > 20 * 1024 * 1024) {
        throw new RuntimeException('File too large (max 20 MB)');
    }

    // Accept only audio/video MIME types (webm, ogg, mp4, wav, mp3)
    // video/mp4 kept for iOS Safari which records speaking as video/mp4
    $allowed = ['audio/webm', 'video/webm', 'audio/ogg', 'audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4'];
    $finfo   = finfo_open(FILEINFO_MIME_TYPE);
    $mime    = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, $allowed, true)) {
        throw new RuntimeException('Invalid file type: ' . $mime);
    }

    // Determine extension
    $ext = match(true) {
        str_contains($mime, 'ogg')  => 'ogg',
        str_contains($mime, 'wav')  => 'wav',
        str_contains($mime, 'mp4')  => 'mp4',
        str_contains($mime, 'mpeg') => 'mp3',
        default                     => 'webm',
    };

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $filename = $prefix . '_' . time() . '.' . $ext;
    $destPath = rtrim($uploadDir, '/') . '/' . $filename;

    // Convert uploadDir to relative path for DB storage
    // e.g. /var/www/html/uploads/speaking/ → uploads/speaking/
    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');
    $relPath = ltrim(str_replace($docRoot, '', $destPath), '/');

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        throw new RuntimeException('Failed to move uploaded file');
    }

    return $relPath;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Return today's date as Y-m-d string.
 */
function today(): string {
    return (new DateTimeImmutable('today'))->format('Y-m-d');
}

/**
 * Format a datetime string using the app timezone with 12-hour time + AM/PM.
 */
function format_app_datetime(?string $dt, string $dateFormat = 'd/m/Y'): string {
    if (!$dt) return '';
    $ts = strtotime($dt);
    if ($ts === false) return (string)$dt;
    return date($dateFormat . ' h:i A', $ts);
}

/**
 * Format only the time portion with 12-hour clock + AM/PM.
 */
function format_app_time(?string $dt): string {
    if (!$dt) return '';
    $ts = strtotime($dt);
    if ($ts === false) return (string)$dt;
    return date('h:i A', $ts);
}

/**
 * Ensure lightweight scheduling support exists on publishable tables.
 */
function ensure_publish_schedule_support(PDO $pdo): void {
    static $done = false;
    if ($done) {
        return;
    }

    $columns = [
        'homeworks' => ['publish_at', "ALTER TABLE homeworks ADD COLUMN publish_at DATETIME NULL DEFAULT NULL AFTER hw_date"],
        'scenarios' => ['publish_at', "ALTER TABLE scenarios ADD COLUMN publish_at DATETIME NULL DEFAULT NULL AFTER sc_date"],
        'student_reviews' => ['publish_at', "ALTER TABLE student_reviews ADD COLUMN publish_at DATETIME NULL DEFAULT NULL AFTER review_date"],
    ];

    foreach ($columns as $table => [$column, $sql]) {
        $check = $pdo->prepare("
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND COLUMN_NAME = ?
        ");
        $check->execute([$table, $column]);
        if ((int)$check->fetchColumn() === 0) {
            $pdo->exec($sql);
        }
    }

    $done = true;
}

/**
 * Build a publish datetime from date + optional time.
 */
function normalize_publish_at(?string $date, ?string $time): ?string {
    $date = trim((string)$date);
    $time = trim((string)$time);

    if ($date === '') {
        return null;
    }

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        return null;
    }

    if ($time === '') {
        $time = '00:00';
    }

    if (!preg_match('/^\d{2}:\d{2}$/', $time)) {
        return null;
    }

    return $date . ' ' . $time . ':00';
}

/**
 * Return the effective publish datetime, falling back to date-only legacy rows.
 */
function effective_publish_at(?string $publishAt, ?string $dateOnly): ?string {
    if ($publishAt && trim($publishAt) !== '') {
        return trim($publishAt);
    }
    return normalize_publish_at($dateOnly, '00:00');
}

/**
 * Determine teacher-facing publication status.
 */
function effective_publish_status(?string $status, ?string $publishAt, ?string $dateOnly = null): string {
    $status = trim((string)$status);
    if ($status !== 'published') {
        return $status !== '' ? $status : 'draft';
    }

    $effective = effective_publish_at($publishAt, $dateOnly);
    if (!$effective) {
        return 'published';
    }

    return strtotime($effective) > time() ? 'scheduled' : 'published';
}
