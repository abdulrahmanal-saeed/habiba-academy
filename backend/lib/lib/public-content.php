<?php
declare(strict_types=1);

require_once __DIR__ . '/settings.php';

if (!function_exists('course_materials_has_column')) {
    function course_materials_has_column(PDO $pdo, string $column): bool
    {
        static $cache = [];
        if (isset($cache[$column])) {
            return $cache[$column];
        }

        $stmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'course_materials'
              AND COLUMN_NAME = ?
        ");
        $stmt->execute([$column]);
        $cache[$column] = (int)$stmt->fetchColumn() > 0;
        return $cache[$column];
    }
}

if (!function_exists('ensure_course_materials_visibility_support')) {
    function ensure_course_materials_visibility_support(PDO $pdo): void
    {
        static $done = false;
        if ($done) {
            return;
        }

        $stmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'course_materials'
              AND COLUMN_NAME = 'show_on_homepage'
        ");
        $stmt->execute();
        if ((int)$stmt->fetchColumn() === 0) {
            $pdo->exec("
                ALTER TABLE course_materials
                ADD COLUMN show_on_homepage TINYINT(1) NOT NULL DEFAULT 0
                AFTER is_published
            ");
        }

        $done = true;
    }
}

if (!function_exists('course_materials_select_fields')) {
    function course_materials_select_fields(PDO $pdo): string
    {
        $fields = [
            'id',
            'title',
            'type',
            'url',
            'file_path',
            'description',
            'created_at',
        ];

        foreach (['updated_at', 'slug', 'meta_title', 'meta_description', 'excerpt', 'short_description', 'thumbnail_url', 'embed_url'] as $column) {
            if (course_materials_has_column($pdo, $column)) {
                $fields[] = $column;
            }
        }

        return implode(', ', $fields);
    }
}

if (!function_exists('fetch_public_materials')) {
    function fetch_public_materials(PDO $pdo, string $type, int $limit = 12, bool $homepageOnly = false): array
    {
        ensure_course_materials_visibility_support($pdo);

        $limit = max(1, min(500, $limit));
        $whereHomepage = $homepageOnly ? " AND show_on_homepage = 1" : '';
        $sql = "
            SELECT " . course_materials_select_fields($pdo) . "
            FROM course_materials
            WHERE is_published = 1
              AND type = ?
              {$whereHomepage}
            ORDER BY sort_order ASC, id DESC
            LIMIT {$limit}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$type]);
        return $stmt->fetchAll() ?: [];
    }
}

if (!function_exists('fetch_public_material_by_id')) {
    function fetch_public_material_by_id(PDO $pdo, string $type, int $id): ?array
    {
        ensure_course_materials_visibility_support($pdo);

        $stmt = $pdo->prepare("
            SELECT " . course_materials_select_fields($pdo) . "
            FROM course_materials
            WHERE is_published = 1
              AND type = ?
              AND id = ?
            LIMIT 1
        ");
        $stmt->execute([$type, $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}

if (!function_exists('fetch_related_public_materials')) {
    function fetch_related_public_materials(PDO $pdo, string $type, int $currentId, int $limit = 3): array
    {
        ensure_course_materials_visibility_support($pdo);

        $limit = max(1, min(6, $limit));
        $stmt = $pdo->prepare("
            SELECT " . course_materials_select_fields($pdo) . "
            FROM course_materials
            WHERE is_published = 1
              AND type = ?
              AND id <> ?
            ORDER BY sort_order ASC, id DESC
            LIMIT {$limit}
        ");
        $stmt->execute([$type, $currentId]);
        return $stmt->fetchAll() ?: [];
    }
}

if (!function_exists('has_homepage_materials')) {
    function has_homepage_materials(PDO $pdo, string $type): bool
    {
        ensure_course_materials_visibility_support($pdo);

        $stmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM course_materials
            WHERE is_published = 1
              AND type = ?
              AND show_on_homepage = 1
        ");
        $stmt->execute([$type]);
        return (int)$stmt->fetchColumn() > 0;
    }
}

if (!function_exists('material_listing_href')) {
    function material_listing_href(string $type): string
    {
        return $type === 'video' ? '/videos/' : '/articles/';
    }
}

if (!function_exists('material_detail_href')) {
    function material_detail_href(array $item): string
    {
        $type = (string)($item['type'] ?? 'article');
        return material_listing_href($type) . '?id=' . (int)($item['id'] ?? 0);
    }
}

if (!function_exists('material_public_href')) {
    function material_public_href(array $item): string
    {
        $filePath = trim((string)($item['file_path'] ?? ''));
        if ($filePath !== '') {
            return '/' . ltrim($filePath, '/');
        }
        return trim((string)($item['url'] ?? ''));
    }
}
