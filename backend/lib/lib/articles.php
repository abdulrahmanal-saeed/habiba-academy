<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (!function_exists('ensure_articles_table')) {
    function ensure_articles_table(PDO $pdo): void
    {
        static $done = false;
        if ($done) {
            return;
        }

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS articles (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                excerpt TEXT NULL,
                body MEDIUMTEXT NULL,
                cover_image VARCHAR(500) NULL,
                status ENUM('published','draft') NOT NULL DEFAULT 'draft',
                show_on_homepage TINYINT(1) NOT NULL DEFAULT 0,
                sort_order INT NOT NULL DEFAULT 0,
                meta_title VARCHAR(255) NULL,
                meta_description VARCHAR(255) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_articles_slug (slug),
                KEY idx_articles_status (status),
                KEY idx_articles_homepage (show_on_homepage),
                KEY idx_articles_sort (sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        ensure_feature_flag_settings($pdo);
        foreach ([
            'enable_articles_page' => '0',
            'show_articles_on_homepage' => '0',
        ] as $key => $value) {
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO " . settings_table_name($pdo) . " (`key`, `value`)
                VALUES (?, ?)
            ");
            $stmt->execute([$key, $value]);
        }

        $done = true;
    }
}

if (!function_exists('article_slugify')) {
    function article_slugify(string $text): string
    {
        $text = trim($text);
        if ($text === '') {
            return 'article';
        }

        if (function_exists('mb_strtolower')) {
            $text = mb_strtolower($text, 'UTF-8');
        } else {
            $text = strtolower($text);
        }

        $text = preg_replace('/[^\p{L}\p{N}]+/u', '-', $text) ?? '';
        $text = trim($text, '-');

        return $text !== '' ? $text : 'article';
    }
}

if (!function_exists('article_unique_slug')) {
    function article_unique_slug(PDO $pdo, string $candidate, int $excludeId = 0): string
    {
        ensure_articles_table($pdo);

        $base = article_slugify($candidate);
        $slug = $base;
        $i = 2;

        while (true) {
            $sql = "SELECT COUNT(*) FROM articles WHERE slug = ?";
            $params = [$slug];
            if ($excludeId > 0) {
                $sql .= " AND id <> ?";
                $params[] = $excludeId;
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            if ((int)$stmt->fetchColumn() === 0) {
                return $slug;
            }

            $slug = $base . '-' . $i;
            $i++;
        }
    }
}

if (!function_exists('article_upload_dir')) {
    function article_upload_dir(): string
    {
        return dirname(__DIR__) . '/uploads/articles/';
    }
}

if (!function_exists('save_article_cover')) {
    function save_article_cover(array $file): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Cover upload failed.');
        }

        if (($file['size'] ?? 0) > 2 * 1024 * 1024) {
            throw new RuntimeException('Cover image must be 2 MB or smaller.');
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $map = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($map[$mime])) {
            throw new RuntimeException('Only JPG, PNG, and WEBP cover images are allowed.');
        }

        $dir = article_upload_dir();
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = 'article_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $map[$mime];
        $dest = $dir . $filename;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            throw new RuntimeException('Could not save the uploaded cover image.');
        }

        return 'uploads/articles/' . $filename;
    }
}

if (!function_exists('delete_article_cover_file')) {
    function delete_article_cover_file(?string $relativePath): void
    {
        $relativePath = trim((string)$relativePath);
        if ($relativePath === '') {
            return;
        }

        $full = dirname(__DIR__) . '/' . ltrim($relativePath, '/');
        if (is_file($full)) {
            @unlink($full);
        }
    }
}

if (!function_exists('article_direction')) {
    function article_direction(?string $text): string
    {
        return preg_match('/\p{Arabic}/u', (string)$text) ? 'rtl' : 'ltr';
    }
}

if (!function_exists('fetch_article_by_id')) {
    function fetch_article_by_id(PDO $pdo, int $id): ?array
    {
        ensure_articles_table($pdo);
        $stmt = $pdo->prepare("SELECT * FROM articles WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}

if (!function_exists('fetch_article_by_slug')) {
    function fetch_article_by_slug(PDO $pdo, string $slug): ?array
    {
        ensure_articles_table($pdo);
        $stmt = $pdo->prepare("SELECT * FROM articles WHERE slug = ? AND status = 'published' LIMIT 1");
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}

if (!function_exists('fetch_public_articles')) {
    function fetch_public_articles(PDO $pdo, int $limit = 24, bool $homepageOnly = false): array
    {
        ensure_articles_table($pdo);

        $limit = max(1, min(200, $limit));
        $sql = "
            SELECT *
            FROM articles
            WHERE status = 'published'
        ";
        if ($homepageOnly) {
            $sql .= " AND show_on_homepage = 1";
        }
        $sql .= " ORDER BY sort_order ASC, created_at DESC LIMIT {$limit}";

        return $pdo->query($sql)->fetchAll() ?: [];
    }
}

if (!function_exists('has_homepage_articles')) {
    function has_homepage_articles(PDO $pdo): bool
    {
        ensure_articles_table($pdo);
        $stmt = $pdo->query("SELECT COUNT(*) FROM articles WHERE status = 'published' AND show_on_homepage = 1");
        return (int)$stmt->fetchColumn() > 0;
    }
}

if (!function_exists('fetch_related_articles')) {
    function fetch_related_articles(PDO $pdo, int $excludeId, int $limit = 3): array
    {
        ensure_articles_table($pdo);

        $limit = max(1, min(6, $limit));
        $stmt = $pdo->prepare("
            SELECT *
            FROM articles
            WHERE status = 'published'
              AND id <> ?
            ORDER BY sort_order ASC, created_at DESC
            LIMIT {$limit}
        ");
        $stmt->execute([$excludeId]);
        return $stmt->fetchAll() ?: [];
    }
}
