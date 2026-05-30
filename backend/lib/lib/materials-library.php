<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/learning-audit.php';

function materials_types(): array
{
    return [
        'video' => 'Video',
        'video_link' => 'Video Link',
        'audio' => 'Audio',
        'pdf' => 'PDF',
        'pptx' => 'PowerPoint',
        'document' => 'Document',
        'image' => 'Image',
        'link' => 'External Link',
        'article' => 'Text Article',
        'html' => 'HTML Lesson',
        'mixed' => 'Mixed Lesson',
    ];
}

function materials_categories(): array
{
    return [
        'lesson_slides' => 'Lesson slides',
        'reading_practice' => 'Reading practice',
        'listening_practice' => 'Listening practice',
        'speaking_support' => 'Speaking support',
        'writing_practice' => 'Writing practice',
        'vocabulary' => 'Vocabulary',
        'grammar_support' => 'Grammar support',
        'child_literacy' => 'Child literacy',
        'work_arabic' => 'Work Arabic',
        'emirati_dialect' => 'Emirati dialect',
        'egyptian_dialect' => 'Egyptian dialect',
        'homework_support' => 'Homework support',
        'review_material' => 'Review material',
    ];
}

function materials_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) return;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS course_materials (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id INT UNSIGNED NOT NULL DEFAULT 0,
            title VARCHAR(300) NOT NULL,
            type VARCHAR(40) NOT NULL DEFAULT 'link',
            url VARCHAR(500) NOT NULL DEFAULT '',
            file_path VARCHAR(500) NOT NULL DEFAULT '',
            description TEXT NULL,
            sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            is_published TINYINT(1) NOT NULL DEFAULT 1,
            show_on_homepage TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_student (student_id),
            KEY idx_type (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    try {
        $pdo->exec("ALTER TABLE course_materials MODIFY COLUMN type VARCHAR(40) NOT NULL DEFAULT 'link'");
    } catch (Throwable) {}

    $columns = [
        'category' => "ALTER TABLE course_materials ADD COLUMN category VARCHAR(80) NOT NULL DEFAULT '' AFTER type",
        'level' => "ALTER TABLE course_materials ADD COLUMN level VARCHAR(40) NOT NULL DEFAULT '' AFTER category",
        'tags' => "ALTER TABLE course_materials ADD COLUMN tags VARCHAR(500) NOT NULL DEFAULT '' AFTER level",
        'language' => "ALTER TABLE course_materials ADD COLUMN language VARCHAR(20) NOT NULL DEFAULT 'both' AFTER tags",
        'estimated_study_minutes' => "ALTER TABLE course_materials ADD COLUMN estimated_study_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER language",
        'status' => "ALTER TABLE course_materials ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'published' AFTER estimated_study_minutes",
        'original_filename' => "ALTER TABLE course_materials ADD COLUMN original_filename VARCHAR(255) NOT NULL DEFAULT '' AFTER file_path",
        'mime_type' => "ALTER TABLE course_materials ADD COLUMN mime_type VARCHAR(120) NOT NULL DEFAULT '' AFTER original_filename",
        'file_size' => "ALTER TABLE course_materials ADD COLUMN file_size INT UNSIGNED NOT NULL DEFAULT 0 AFTER mime_type",
        'allow_download' => "ALTER TABLE course_materials ADD COLUMN allow_download TINYINT(1) NOT NULL DEFAULT 1 AFTER file_size",
        'created_by' => "ALTER TABLE course_materials ADD COLUMN created_by INT UNSIGNED NOT NULL DEFAULT 0 AFTER allow_download",
        'updated_at' => "ALTER TABLE course_materials ADD COLUMN updated_at DATETIME NULL DEFAULT NULL AFTER created_at",
        'archived_at' => "ALTER TABLE course_materials ADD COLUMN archived_at DATETIME NULL DEFAULT NULL AFTER updated_at",
    ];

    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'course_materials'
          AND COLUMN_NAME = ?
    ");
    foreach ($columns as $column => $sql) {
        try {
            $stmt->execute([$column]);
            if ((int)$stmt->fetchColumn() === 0) {
                $pdo->exec($sql);
            }
        } catch (Throwable) {}
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS material_categories (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(160) NOT NULL,
            description TEXT NULL,
            sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS material_progress (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            material_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            viewed_at DATETIME NULL DEFAULT NULL,
            last_opened_at DATETIME NULL DEFAULT NULL,
            completed_at DATETIME NULL DEFAULT NULL,
            download_count INT UNSIGNED NOT NULL DEFAULT 0,
            status VARCHAR(30) NOT NULL DEFAULT 'assigned',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uniq_material_student (material_id, student_id),
            KEY idx_student (student_id),
            KEY idx_material (material_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $ins = $pdo->prepare("
        INSERT IGNORE INTO material_categories (slug, name, sort_order)
        VALUES (?, ?, ?)
    ");
    $i = 10;
    foreach (materials_categories() as $slug => $name) {
        $ins->execute([$slug, $name, $i]);
        $i += 10;
    }

    try {
        $pdo->exec("UPDATE course_materials SET status = IF(is_published = 1, 'published', 'draft') WHERE status = '' OR status IS NULL");
    } catch (Throwable) {}

    $done = true;
}

function materials_allowed_extensions(): array
{
    return [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'mp3' => 'audio/mpeg',
        'ogg' => 'audio/ogg',
        'wav' => 'audio/wav',
        'm4a' => 'audio/mp4',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'ppt' => 'application/vnd.ms-powerpoint',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'html' => 'text/html',
        'htm' => 'text/html',
    ];
}

function materials_blocked_extensions(): array
{
    return ['php','phtml','exe','bat','cmd','sh','js','msi','dll','com','scr','ps1'];
}

function materials_type_from_extension(string $ext, string $fallback = 'link'): string
{
    return match ($ext) {
        'mp4', 'webm' => 'video',
        'mp3', 'ogg', 'wav', 'm4a' => 'audio',
        'pdf' => 'pdf',
        'ppt', 'pptx' => 'pptx',
        'doc', 'docx' => 'document',
        'jpg', 'jpeg', 'png', 'gif', 'webp' => 'image',
        'html', 'htm' => 'html',
        default => $fallback,
    };
}

function materials_save_upload(array $file, int $studentId): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('File upload failed.');
    }
    if ((int)$file['size'] > 80 * 1024 * 1024) {
        throw new RuntimeException('File too large. Maximum is 80 MB.');
    }

    $original = basename((string)($file['name'] ?? 'material'));
    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    if ($ext === '' || in_array($ext, materials_blocked_extensions(), true)) {
        throw new RuntimeException('This file type is not allowed.');
    }

    $allowed = materials_allowed_extensions();
    if (!isset($allowed[$ext])) {
        throw new RuntimeException('This file extension is not allowed.');
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = $finfo ? (string)finfo_file($finfo, (string)$file['tmp_name']) : '';
    if ($finfo) finfo_close($finfo);

    if (in_array($mime, ['application/zip', 'application/octet-stream'], true)) {
        $mime = $allowed[$ext];
    }
    if ($ext === 'html' || $ext === 'htm') {
        $mime = 'text/html';
    }

    $expected = $allowed[$ext];
    $compatible = $mime === $expected
        || ($expected === 'audio/mpeg' && $mime === 'audio/mp3')
        || ($expected === 'audio/mp4' && in_array($mime, ['audio/x-m4a','video/mp4','application/octet-stream'], true));
    if (!$compatible) {
        throw new RuntimeException('File type not allowed: ' . $mime);
    }

    $uploadDir = __DIR__ . '/../uploads/materials/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $filename = 'mat_' . $studentId . '_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $dest = $uploadDir . $filename;
    if (!move_uploaded_file((string)$file['tmp_name'], $dest)) {
        throw new RuntimeException('Could not save uploaded file.');
    }

    return [
        'file_path' => 'uploads/materials/' . $filename,
        'original_filename' => $original,
        'mime_type' => $mime,
        'file_size' => (int)$file['size'],
        'type' => materials_type_from_extension($ext),
    ];
}

function materials_student_can_access(PDO $pdo, int $studentId, int $materialId): bool
{
    materials_ensure_schema($pdo);
    $stmt = $pdo->prepare("
        SELECT id
        FROM course_materials
        WHERE id = ?
          AND student_id = ?
          AND status = 'published'
          AND is_published = 1
          AND archived_at IS NULL
        LIMIT 1
    ");
    $stmt->execute([$materialId, $studentId]);
    return (bool)$stmt->fetchColumn();
}

function materials_get_for_student(PDO $pdo, int $studentId, int $materialId): ?array
{
    materials_ensure_schema($pdo);
    $stmt = $pdo->prepare("
        SELECT cm.*, mp.viewed_at, mp.last_opened_at, mp.completed_at, mp.download_count, mp.status AS progress_status
        FROM course_materials cm
        LEFT JOIN material_progress mp ON mp.material_id = cm.id AND mp.student_id = ?
        WHERE cm.id = ?
          AND cm.student_id = ?
          AND cm.status = 'published'
          AND cm.is_published = 1
          AND cm.archived_at IS NULL
        LIMIT 1
    ");
    $stmt->execute([$studentId, $materialId, $studentId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return is_array($row) ? $row : null;
}

function materials_mark_viewed(PDO $pdo, int $studentId, int $materialId): void
{
    materials_ensure_schema($pdo);
    $pdo->prepare("
        INSERT INTO material_progress (material_id, student_id, viewed_at, last_opened_at, status, updated_at)
        VALUES (?, ?, NOW(), NOW(), 'viewed', NOW())
        ON DUPLICATE KEY UPDATE
            viewed_at = COALESCE(viewed_at, NOW()),
            last_opened_at = NOW(),
            status = IF(completed_at IS NULL, 'viewed', status),
            updated_at = NOW()
    ")->execute([$materialId, $studentId]);
}

function materials_mark_completed(PDO $pdo, int $studentId, int $materialId): void
{
    materials_ensure_schema($pdo);
    $pdo->prepare("
        INSERT INTO material_progress (material_id, student_id, viewed_at, last_opened_at, completed_at, status, updated_at)
        VALUES (?, ?, NOW(), NOW(), NOW(), 'completed', NOW())
        ON DUPLICATE KEY UPDATE
            viewed_at = COALESCE(viewed_at, NOW()),
            last_opened_at = NOW(),
            completed_at = NOW(),
            status = 'completed',
            updated_at = NOW()
    ")->execute([$materialId, $studentId]);
    learning_audit($pdo, 'material_completed', 'course_material', $materialId, ['student_id' => $studentId], [], 'student', $studentId);
}

function materials_increment_download(PDO $pdo, int $studentId, int $materialId): void
{
    materials_ensure_schema($pdo);
    $pdo->prepare("
        INSERT INTO material_progress (material_id, student_id, viewed_at, last_opened_at, download_count, status, updated_at)
        VALUES (?, ?, NOW(), NOW(), 1, 'viewed', NOW())
        ON DUPLICATE KEY UPDATE
            viewed_at = COALESCE(viewed_at, NOW()),
            last_opened_at = NOW(),
            download_count = download_count + 1,
            updated_at = NOW()
    ")->execute([$materialId, $studentId]);
}

function materials_href(array $material): string
{
    $file = trim((string)($material['file_path'] ?? ''));
    if ($file !== '') return '/' . ltrim($file, '/');
    return trim((string)($material['url'] ?? ''));
}

function materials_viewer_html(array $m): string
{
    $type = (string)($m['type'] ?? 'link');
    $href = materials_href($m);
    $safeHref = h($href);
    $title = h((string)($m['title'] ?? 'Material'));
    $description = trim((string)($m['description'] ?? ''));

    if ($type === 'article' || $type === 'mixed') {
        return '<article class="material-reader">' . nl2br(h($description)) . '</article>';
    }
    if ($href === '') {
        return '<div class="text-muted">No material source is attached.</div>';
    }
    if ($type === 'video') {
        return '<video class="w-100 rounded-3" controls preload="metadata" src="' . $safeHref . '"></video>';
    }
    if ($type === 'video_link') {
        $embed = materials_video_embed_url($href);
        if ($embed !== '') {
            return '<div class="ratio ratio-16x9"><iframe src="' . h($embed) . '" title="' . $title . '" allowfullscreen loading="lazy"></iframe></div>';
        }
        return '<a class="btn btn-app" target="_blank" rel="noopener" href="' . $safeHref . '">Open Video</a>';
    }
    if ($type === 'audio') {
        return '<audio class="w-100" controls preload="metadata" src="' . $safeHref . '"></audio>';
    }
    if ($type === 'pdf') {
        return '<iframe class="material-frame" src="' . $safeHref . '#toolbar=1" title="' . $title . '"></iframe>';
    }
    if ($type === 'image') {
        return '<img class="img-fluid rounded-3 border" src="' . $safeHref . '" alt="' . $title . '">';
    }
    if ($type === 'html') {
        return '<iframe class="material-frame" sandbox="allow-scripts allow-forms allow-popups" src="' . $safeHref . '" title="' . $title . '"></iframe>';
    }
    return '<a class="btn btn-app" target="_blank" rel="noopener" href="' . $safeHref . '">Open Material</a>';
}

function materials_video_embed_url(string $url): string
{
    if (preg_match('~(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([A-Za-z0-9_-]{6,})~', $url, $m)) {
        return 'https://www.youtube.com/embed/' . $m[1];
    }
    if (preg_match('~vimeo\.com/(?:video/)?(\d+)~', $url, $m)) {
        return 'https://player.vimeo.com/video/' . $m[1];
    }
    return '';
}
