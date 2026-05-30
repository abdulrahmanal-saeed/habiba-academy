<?php
declare(strict_types=1);

function ensure_testimonial_tables(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_testimonials (
            id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id         INT UNSIGNED NOT NULL,
            token              CHAR(64) NOT NULL,
            student_name       VARCHAR(190) NOT NULL,
            student_level      VARCHAR(32) NULL,
            rating             TINYINT UNSIGNED NOT NULL DEFAULT 5,
            testimonial_text   TEXT NULL,
            review_status      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
            is_published       TINYINT(1) NOT NULL DEFAULT 0,
            created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_student (student_id),
            UNIQUE KEY uq_token (token),
            KEY idx_published (is_published, updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $colStmt = $pdo->query("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'student_testimonials'
          AND COLUMN_NAME = 'review_status'
    ");
    $hasReviewStatus = (int)$colStmt->fetchColumn() > 0;
    if (!$hasReviewStatus) {
        $pdo->exec("
            ALTER TABLE student_testimonials
            ADD COLUMN review_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER testimonial_text
        ");
        $pdo->exec("
            UPDATE student_testimonials
            SET review_status = CASE WHEN is_published = 1 THEN 'approved' ELSE 'pending' END
        ");
    }

    $done = true;
}

function testimonials_cache_path(): string
{
    $dir = __DIR__ . '/../storage/cache';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return $dir . '/published-testimonials.json';
}

function clear_testimonials_cache(): void
{
    $path = testimonials_cache_path();
    if (is_file($path)) {
        @unlink($path);
    }
}

function testimonials_base_url(): string
{
    $envUrl = trim((string)(getenv('APP_BASE_URL') ?: ''));
    if ($envUrl !== '') {
        return rtrim($envUrl, '/');
    }
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $host = trim((string)($_SERVER['HTTP_HOST'] ?? 'mshabibanabil.com'));
    return ($https ? 'https://' : 'http://') . $host;
}

function ensure_student_testimonial_token(PDO $pdo, int $studentId): array
{
    ensure_testimonial_tables($pdo);

    $studentStmt = $pdo->prepare("SELECT id, full_name, level FROM students WHERE id = ? LIMIT 1");
    $studentStmt->execute([$studentId]);
    $student = $studentStmt->fetch();
    if (!$student) {
        throw new RuntimeException('Student not found');
    }

    $existingStmt = $pdo->prepare("SELECT id, token, testimonial_text, is_published, rating FROM student_testimonials WHERE student_id = ? LIMIT 1");
    $existingStmt->execute([$studentId]);
    $existing = $existingStmt->fetch();

    if ($existing) {
        $pdo->prepare("
            UPDATE student_testimonials
            SET student_name = ?, student_level = ?
            WHERE id = ?
        ")->execute([
            (string)$student['full_name'],
            (string)($student['level'] ?? ''),
            (int)$existing['id'],
        ]);

        return [
            'id' => (int)$existing['id'],
            'token' => (string)$existing['token'],
            'testimonial_text' => (string)($existing['testimonial_text'] ?? ''),
            'is_published' => (int)($existing['is_published'] ?? 0),
            'review_status' => (string)($existing['review_status'] ?? 'pending'),
            'rating' => (int)($existing['rating'] ?? 5),
            'student_name' => (string)$student['full_name'],
            'student_level' => (string)($student['level'] ?? ''),
        ];
    }

    $token = bin2hex(random_bytes(32));
    $ins = $pdo->prepare("
        INSERT INTO student_testimonials (student_id, token, student_name, student_level, rating, is_published)
        VALUES (?, ?, ?, ?, 5, 0)
    ");
    $ins->execute([
        $studentId,
        $token,
        (string)$student['full_name'],
        (string)($student['level'] ?? ''),
    ]);

    return [
        'id' => (int)$pdo->lastInsertId(),
        'token' => $token,
        'testimonial_text' => '',
        'is_published' => 0,
        'review_status' => 'pending',
        'rating' => 5,
        'student_name' => (string)$student['full_name'],
        'student_level' => (string)($student['level'] ?? ''),
    ];
}

function student_testimonial_link(PDO $pdo, int $studentId): string
{
    $row = ensure_student_testimonial_token($pdo, $studentId);
    return testimonials_base_url() . '/testimonial.php?token=' . urlencode((string)$row['token']);
}

function fetch_testimonial_by_token(PDO $pdo, string $token): ?array
{
    ensure_testimonial_tables($pdo);
    $stmt = $pdo->prepare("
        SELECT t.*, s.is_active
        FROM student_testimonials t
        JOIN students s ON s.id = t.student_id
        WHERE t.token = ?
        LIMIT 1
    ");
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function fetch_published_testimonials(PDO $pdo, int $limit = 6): array
{
    ensure_testimonial_tables($pdo);
    $limit = max(1, min(20, $limit));
    $cachePath = testimonials_cache_path();
    if (is_file($cachePath) && (time() - (int)@filemtime($cachePath)) < 180) {
        $cached = json_decode((string)@file_get_contents($cachePath), true);
        if (is_array($cached)) {
            return array_slice($cached, 0, $limit);
        }
    }

    $stmt = $pdo->query("
        SELECT student_name, student_level, rating, testimonial_text, updated_at
        FROM student_testimonials
        WHERE is_published = 1
          AND review_status = 'approved'
          AND testimonial_text IS NOT NULL
          AND TRIM(testimonial_text) <> ''
        ORDER BY updated_at DESC, id DESC
        LIMIT {$limit}
    ");
    $items = $stmt->fetchAll() ?: [];
    @file_put_contents($cachePath, json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    return $items;
}

function fetch_teacher_testimonials(PDO $pdo): array
{
    ensure_testimonial_tables($pdo);
    $stmt = $pdo->query("
        SELECT id, student_id, student_name, student_level, rating, testimonial_text, review_status, is_published, updated_at
        FROM student_testimonials
        WHERE testimonial_text IS NOT NULL AND TRIM(testimonial_text) <> ''
        ORDER BY
          CASE review_status
            WHEN 'pending' THEN 0
            WHEN 'rejected' THEN 1
            ELSE 2
          END,
          updated_at DESC,
          id DESC
    ");
    return $stmt->fetchAll() ?: [];
}

// ─── Public Testimonials (shareable link, no student account needed) ─────────

function ensure_public_testimonial_table(PDO $pdo): void
{
    static $done = false;
    if ($done) return;
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS public_testimonials (
            id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name         VARCHAR(200) NOT NULL,
            level        VARCHAR(10)  NOT NULL DEFAULT 'A1',
            rating       TINYINT UNSIGNED NOT NULL DEFAULT 5,
            message      TEXT NOT NULL,
            is_approved  TINYINT(1) NOT NULL DEFAULT 0,
            ip_address   VARCHAR(45)  NOT NULL DEFAULT '',
            submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_approved (is_approved, submitted_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $done = true;
}

function ensure_platform_testimonial_table(PDO $pdo): void
{
    static $done = false;
    if ($done) return;
    $portalLib = __DIR__ . '/roles-portals.php';
    if (is_file($portalLib)) {
        require_once $portalLib;
        if (function_exists('portals_ensure_schema')) {
            portals_ensure_schema($pdo);
        }
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS platform_testimonials (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            submitter_type VARCHAR(30) NOT NULL DEFAULT 'student',
            student_id INT UNSIGNED NULL,
            parent_id INT UNSIGNED NULL,
            child_student_id INT UNSIGNED NULL,
            source VARCHAR(80) NOT NULL DEFAULT '',
            rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
            testimonial_text TEXT NULL,
            audio_url VARCHAR(500) NULL,
            audio_original_filename VARCHAR(255) NULL,
            audio_mime_type VARCHAR(120) NULL,
            audio_file_size INT UNSIGNED NULL,
            media_type VARCHAR(30) NOT NULL DEFAULT 'text',
            display_preference VARCHAR(40) NOT NULL DEFAULT 'full_name',
            public_display_name VARCHAR(190) NOT NULL DEFAULT '',
            level VARCHAR(32) NOT NULL DEFAULT '',
            learning_goal VARCHAR(120) NOT NULL DEFAULT '',
            permission_to_publish TINYINT(1) NOT NULL DEFAULT 0,
            review_status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
            is_published TINYINT(1) NOT NULL DEFAULT 0,
            featured TINYINT(1) NOT NULL DEFAULT 0,
            show_on_homepage TINYINT(1) NOT NULL DEFAULT 0,
            show_on_testimonials_page TINYINT(1) NOT NULL DEFAULT 1,
            sort_order INT NOT NULL DEFAULT 0,
            teacher_notes TEXT NULL,
            approved_at DATETIME NULL,
            rejected_at DATETIME NULL,
            archived_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_status (review_status, created_at),
            KEY idx_public (is_published, show_on_homepage, show_on_testimonials_page),
            KEY idx_student (student_id),
            KEY idx_parent (parent_id),
            KEY idx_child (child_student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $done = true;
}

function testimonial_audio_upload_dir(): string
{
    $dir = __DIR__ . '/../uploads/testimonials/audio';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return $dir;
}

function testimonial_store_audio_upload(array $file): ?array
{
    if (empty($file['tmp_name']) || (int)($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ((int)$file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Audio upload failed.');
    }

    $max = 25 * 1024 * 1024;
    $size = (int)($file['size'] ?? 0);
    if ($size <= 0 || $size > $max) {
        throw new RuntimeException('Audio file is too large. Maximum size is 25MB.');
    }

    $tmp = (string)$file['tmp_name'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$finfo->file($tmp);
    $allowed = [
        'audio/mpeg' => 'mp3',
        'audio/mp3' => 'mp3',
        'audio/wav' => 'wav',
        'audio/x-wav' => 'wav',
        'audio/mp4' => 'm4a',
        'audio/x-m4a' => 'm4a',
        'audio/webm' => 'webm',
        'video/webm' => 'webm',
    ];
    if (!isset($allowed[$mime])) {
        throw new RuntimeException('Audio type is not allowed.');
    }

    $ext = $allowed[$mime];
    $name = 'testimonial_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $target = testimonial_audio_upload_dir() . '/' . $name;
    if (!move_uploaded_file($tmp, $target)) {
        throw new RuntimeException('Could not save audio file.');
    }

    return [
        'url' => '/uploads/testimonials/audio/' . $name,
        'original' => (string)($file['name'] ?? ''),
        'mime' => $mime,
        'size' => $size,
    ];
}

function platform_testimonial_public_name(array $person, string $preference, string $fallback = 'Student'): string
{
    $name = trim((string)($person['full_name'] ?? $person['name'] ?? $fallback));
    if ($preference === 'anonymous') {
        return 'Anonymous';
    }
    if ($preference === 'first_name' || $preference === 'child_first_name' || $preference === 'parent_first_name') {
        $parts = preg_split('/\s+/', $name) ?: [];
        return (string)($parts[0] ?? $fallback);
    }
    return $name !== '' ? $name : $fallback;
}

function save_platform_testimonial(PDO $pdo, array $data): int
{
    ensure_platform_testimonial_table($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO platform_testimonials
            (submitter_type, student_id, parent_id, child_student_id, source, rating, testimonial_text,
             audio_url, audio_original_filename, audio_mime_type, audio_file_size, media_type,
             display_preference, public_display_name, level, learning_goal, permission_to_publish,
             review_status, is_published)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', 0)
    ");
    $hasText = trim((string)($data['testimonial_text'] ?? '')) !== '';
    $hasAudio = trim((string)($data['audio_url'] ?? '')) !== '';
    $mediaType = $hasText && $hasAudio ? 'mixed' : ($hasAudio ? 'audio' : 'text');
    $stmt->execute([
        (string)($data['submitter_type'] ?? 'student'),
        $data['student_id'] ?? null,
        $data['parent_id'] ?? null,
        $data['child_student_id'] ?? null,
        (string)($data['source'] ?? ''),
        max(1, min(5, (int)($data['rating'] ?? 5))),
        trim((string)($data['testimonial_text'] ?? '')),
        $data['audio_url'] ?? null,
        $data['audio_original_filename'] ?? null,
        $data['audio_mime_type'] ?? null,
        $data['audio_file_size'] ?? null,
        $mediaType,
        (string)($data['display_preference'] ?? 'full_name'),
        (string)($data['public_display_name'] ?? ''),
        (string)($data['level'] ?? ''),
        (string)($data['learning_goal'] ?? ''),
        !empty($data['permission_to_publish']) ? 1 : 0,
    ]);
    clear_testimonials_cache();
    return (int)$pdo->lastInsertId();
}

function fetch_teacher_platform_testimonials(PDO $pdo): array
{
    ensure_platform_testimonial_table($pdo);
    $stmt = $pdo->query("
        SELECT pt.*, st.full_name AS student_name, child.full_name AS child_name, p.full_name AS parent_name
        FROM platform_testimonials pt
        LEFT JOIN students st ON st.id = pt.student_id
        LEFT JOIN students child ON child.id = pt.child_student_id
        LEFT JOIN parent_contacts p ON p.id = pt.parent_id
        ORDER BY
            CASE pt.review_status
                WHEN 'pending_review' THEN 0
                WHEN 'approved' THEN 1
                WHEN 'rejected' THEN 2
                ELSE 3
            END,
            pt.created_at DESC
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function fetch_published_platform_testimonials(PDO $pdo, int $limit = 20, bool $homepageOnly = false): array
{
    ensure_platform_testimonial_table($pdo);
    $limit = max(1, min(50, $limit));
    $extra = $homepageOnly ? "AND show_on_homepage = 1" : "AND show_on_testimonials_page = 1";
    $stmt = $pdo->query("
        SELECT public_display_name AS student_name, level AS student_level, rating, testimonial_text,
               audio_url, media_type, updated_at AS sort_at
        FROM platform_testimonials
        WHERE is_published = 1
          AND review_status = 'approved'
          AND permission_to_publish = 1
          {$extra}
          AND (
              (testimonial_text IS NOT NULL AND TRIM(testimonial_text) <> '')
              OR audio_url IS NOT NULL
          )
        ORDER BY featured DESC, sort_order ASC, updated_at DESC
        LIMIT {$limit}
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

/**
 * Fetch all approved testimonials (both student + public) normalised
 * to the same field names used in index.php: student_name, student_level,
 * rating, testimonial_text, updated_at / submitted_at.
 */
function fetch_all_published_testimonials(PDO $pdo, int $limit = 8): array
{
    ensure_testimonial_tables($pdo);
    ensure_public_testimonial_table($pdo);
    ensure_platform_testimonial_table($pdo);
    $limit = max(1, min(20, $limit));

    try {
        $stmt = $pdo->query("
            SELECT student_name, student_level, rating, testimonial_text,
                   NULL AS audio_url, 'text' AS media_type, updated_at AS sort_at
            FROM student_testimonials
            WHERE is_published = 1
              AND review_status = 'approved'
              AND testimonial_text IS NOT NULL
              AND TRIM(testimonial_text) <> ''
            UNION ALL
            SELECT name        AS student_name,
                   level       AS student_level,
                   rating,
                   message     AS testimonial_text,
                   NULL AS audio_url,
                   'text' AS media_type,
                   submitted_at AS sort_at
            FROM public_testimonials
            WHERE is_approved = 1
              AND TRIM(message) <> ''
            UNION ALL
            SELECT public_display_name AS student_name,
                   level AS student_level,
                   rating,
                   testimonial_text,
                   audio_url,
                   media_type,
                   updated_at AS sort_at
            FROM platform_testimonials
            WHERE is_published = 1
              AND review_status = 'approved'
              AND permission_to_publish = 1
              AND show_on_homepage = 1
            ORDER BY sort_at DESC
            LIMIT " . $limit . "
        ");
        return $stmt->fetchAll() ?: [];
    } catch (\Throwable $e) {
        // Fall back to student-only if public table query fails
        return fetch_published_testimonials($pdo, $limit);
    }
}

function fetch_teacher_public_testimonials(PDO $pdo): array
{
    ensure_public_testimonial_table($pdo);
    $stmt = $pdo->query("
        SELECT id, name, level, rating, message, is_approved, submitted_at
        FROM public_testimonials
        ORDER BY is_approved ASC, submitted_at DESC
    ");
    return $stmt->fetchAll() ?: [];
}
