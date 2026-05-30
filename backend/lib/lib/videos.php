<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (!function_exists('ensure_videos_table')) {
    function ensure_videos_table(PDO $pdo): void
    {
        static $done = false;
        if ($done) {
            return;
        }

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS videos (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                youtube_url VARCHAR(500) NOT NULL,
                youtube_video_id VARCHAR(32) NOT NULL,
                youtube_embed_url VARCHAR(500) NOT NULL,
                short_description TEXT NULL,
                thumbnail_url VARCHAR(500) NOT NULL,
                status ENUM('published','draft') NOT NULL DEFAULT 'draft',
                show_on_homepage TINYINT(1) NOT NULL DEFAULT 0,
                sort_order INT NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_videos_slug (slug),
                KEY idx_videos_status (status),
                KEY idx_videos_homepage (show_on_homepage),
                KEY idx_videos_sort (sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        ensure_feature_flag_settings($pdo);
        foreach ([
            'enable_videos_page' => '0',
            'show_videos_on_homepage' => '0',
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

if (!function_exists('video_slugify')) {
    function video_slugify(string $text): string
    {
        $text = trim($text);
        if ($text === '') {
            return 'video';
        }

        if (function_exists('mb_strtolower')) {
            $text = mb_strtolower($text, 'UTF-8');
        } else {
            $text = strtolower($text);
        }

        $text = preg_replace('/[^\p{L}\p{N}]+/u', '-', $text) ?? '';
        $text = trim($text, '-');
        return $text !== '' ? $text : 'video';
    }
}

if (!function_exists('video_unique_slug')) {
    function video_unique_slug(PDO $pdo, string $candidate, int $excludeId = 0): string
    {
        ensure_videos_table($pdo);

        $base = video_slugify($candidate);
        $slug = $base;
        $i = 2;

        while (true) {
            $sql = "SELECT COUNT(*) FROM videos WHERE slug = ?";
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

if (!function_exists('extract_youtube_video_id')) {
    function extract_youtube_video_id(string $url): ?string
    {
        $url = trim($url);
        if ($url === '') {
            return null;
        }

        $parts = @parse_url($url);
        if (!$parts || empty($parts['host'])) {
            return null;
        }

        $host = strtolower((string)$parts['host']);
        $path = trim((string)($parts['path'] ?? ''), '/');

        if (str_contains($host, 'youtu.be')) {
            $id = explode('/', $path)[0] ?? '';
            return preg_match('/^[A-Za-z0-9_-]{11}$/', $id) ? $id : null;
        }

        if (str_contains($host, 'youtube.com') || str_contains($host, 'youtube-nocookie.com')) {
            if ($path === 'watch') {
                parse_str((string)($parts['query'] ?? ''), $query);
                $id = (string)($query['v'] ?? '');
                return preg_match('/^[A-Za-z0-9_-]{11}$/', $id) ? $id : null;
            }

            if (str_starts_with($path, 'embed/')) {
                $id = explode('/', substr($path, 6))[0] ?? '';
                return preg_match('/^[A-Za-z0-9_-]{11}$/', $id) ? $id : null;
            }
        }

        return null;
    }
}

if (!function_exists('youtube_embed_url')) {
    function youtube_embed_url(string $videoId): string
    {
        return 'https://www.youtube.com/embed/' . $videoId;
    }
}

if (!function_exists('youtube_thumbnail_url')) {
    function youtube_thumbnail_url(string $videoId): string
    {
        return 'https://img.youtube.com/vi/' . $videoId . '/hqdefault.jpg';
    }
}

if (!function_exists('fetch_video_by_id')) {
    function fetch_video_by_id(PDO $pdo, int $id): ?array
    {
        ensure_videos_table($pdo);
        $stmt = $pdo->prepare("SELECT * FROM videos WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}

if (!function_exists('fetch_video_by_slug')) {
    function fetch_video_by_slug(PDO $pdo, string $slug): ?array
    {
        ensure_videos_table($pdo);
        $stmt = $pdo->prepare("SELECT * FROM videos WHERE slug = ? AND status = 'published' LIMIT 1");
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}

if (!function_exists('fetch_public_videos')) {
    function fetch_public_videos(PDO $pdo, int $limit = 24, bool $homepageOnly = false): array
    {
        ensure_videos_table($pdo);
        $limit = max(1, min(200, $limit));
        $sql = "SELECT * FROM videos WHERE status = 'published'";
        if ($homepageOnly) {
            $sql .= " AND show_on_homepage = 1";
        }
        $sql .= " ORDER BY sort_order ASC, created_at DESC LIMIT {$limit}";
        return $pdo->query($sql)->fetchAll() ?: [];
    }
}

if (!function_exists('has_homepage_videos')) {
    function has_homepage_videos(PDO $pdo): bool
    {
        ensure_videos_table($pdo);
        $stmt = $pdo->query("SELECT COUNT(*) FROM videos WHERE status = 'published' AND show_on_homepage = 1");
        return (int)$stmt->fetchColumn() > 0;
    }
}

if (!function_exists('fetch_related_videos')) {
    function fetch_related_videos(PDO $pdo, int $excludeId, int $limit = 3): array
    {
        ensure_videos_table($pdo);
        $limit = max(1, min(6, $limit));
        $stmt = $pdo->prepare("
            SELECT *
            FROM videos
            WHERE status = 'published'
              AND id <> ?
            ORDER BY sort_order ASC, created_at DESC
            LIMIT {$limit}
        ");
        $stmt->execute([$excludeId]);
        return $stmt->fetchAll() ?: [];
    }
}
