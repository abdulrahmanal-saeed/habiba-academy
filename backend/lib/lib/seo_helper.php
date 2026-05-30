<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

if (!function_exists('seo_site_name')) {
    function seo_site_name(): string
    {
        $name = trim((string)(getenv('SEO_SITE_NAME') ?: 'Habiba Nabil Arabic Academy'));
        return $name !== '' ? $name : 'Habiba Nabil Arabic Academy';
    }
}

if (!function_exists('seo_teacher_name')) {
    function seo_teacher_name(): string
    {
        $name = trim((string)(getenv('SEO_TEACHER_NAME') ?: 'Habiba Nabil'));
        return $name !== '' ? $name : 'Habiba Nabil';
    }
}

if (!function_exists('seo_site_url')) {
    function seo_site_url(): string
    {
        $base = trim((string)(getenv('APP_URL') ?: 'https://mshabibanabil.com'));
        return rtrim($base !== '' ? $base : 'https://mshabibanabil.com', '/');
    }
}

if (!function_exists('seo_abs_url')) {
    function seo_abs_url(string $path = '/'): string
    {
        if (preg_match('#^https?://#i', $path)) {
            return $path;
        }

        return seo_site_url() . '/' . ltrim($path, '/');
    }
}

if (!function_exists('seo_current_url')) {
    function seo_current_url(): string
    {
        $uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
        if ($uri === '') {
            $uri = '/';
        }
        return seo_abs_url($uri);
    }
}

if (!function_exists('seo_default_image')) {
    function seo_default_image(): string
    {
        $jpg = dirname(__DIR__) . '/assets/img/spaeking_1.jpg';
        if (is_file($jpg)) {
            return seo_abs_url('/assets/img/spaeking_1.jpg');
        }

        return seo_abs_url('/assets/img/hn-logo-transparent.svg');
    }
}

if (!function_exists('seo_plain_text')) {
    function seo_plain_text(?string $text): string
    {
        $text = trim((string)$text);
        if ($text === '') {
            return '';
        }

        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return trim((string)preg_replace('/\s+/u', ' ', $text));
    }
}

if (!function_exists('seo_excerpt')) {
    function seo_excerpt(?string $text, int $max = 160): string
    {
        $plain = seo_plain_text($text);
        if ($plain === '') {
            return '';
        }

        if (function_exists('mb_strlen') && function_exists('mb_substr')) {
            if (mb_strlen($plain) <= $max) {
                return $plain;
            }
            return rtrim(mb_substr($plain, 0, $max - 1)) . '…';
        }

        if (strlen($plain) <= $max) {
            return $plain;
        }

        return rtrim(substr($plain, 0, $max - 1)) . '…';
    }
}

if (!function_exists('seo_meta_store')) {
    function &seo_meta_store(): array
    {
        static $store = [
            'title' => null,
            'description' => null,
            'robots' => 'index, follow',
            'url' => null,
            'image' => null,
            'type' => 'website',
            'canonical' => null,
            'schemas' => [],
        ];

        return $store;
    }
}

if (!function_exists('set_meta')) {
    function set_meta(string $title, string $description, array $og = []): void
    {
        $store = &seo_meta_store();
        $store['title'] = trim($title);
        $store['description'] = trim($description);
        $store['robots'] = !empty($og['noindex']) ? 'noindex, nofollow' : (string)($og['robots'] ?? 'index, follow');
        $store['url'] = (string)($og['url'] ?? seo_current_url());
        $store['image'] = (string)($og['image'] ?? seo_default_image());
        $store['type'] = (string)($og['type'] ?? 'website');
        $store['canonical'] = (string)($og['canonical'] ?? $store['url']);
    }
}

if (!function_exists('set_noindex')) {
    function set_noindex(bool $noindex = true): void
    {
        $store = &seo_meta_store();
        $store['robots'] = $noindex ? 'noindex, nofollow' : 'index, follow';
    }
}

if (!function_exists('add_structured_data')) {
    function add_structured_data(array $schema): void
    {
        $store = &seo_meta_store();
        $store['schemas'][] = $schema;
    }
}

if (!function_exists('render_meta_tags')) {
    function render_meta_tags(): void
    {
        $store = seo_meta_store();
        $title = trim((string)($store['title'] ?? seo_site_name()));
        $description = trim((string)($store['description'] ?? ''));
        $robots = trim((string)($store['robots'] ?? 'index, follow'));
        $url = trim((string)($store['url'] ?? seo_current_url()));
        $image = trim((string)($store['image'] ?? seo_default_image()));
        $type = trim((string)($store['type'] ?? 'website'));
        $canonical = trim((string)($store['canonical'] ?? $url));
        $fullTitle = $title === seo_site_name() ? $title : ($title . ' | ' . seo_site_name());
        ?>
  <title><?= h($fullTitle) ?></title>
  <?php if ($description !== ''): ?>
  <meta name="description" content="<?= h($description) ?>">
  <?php endif; ?>
  <meta name="robots" content="<?= h($robots) ?>">
  <link rel="canonical" href="<?= h($canonical) ?>">
  <meta property="og:title" content="<?= h($title) ?>">
  <?php if ($description !== ''): ?>
  <meta property="og:description" content="<?= h($description) ?>">
  <?php endif; ?>
  <meta property="og:url" content="<?= h($url) ?>">
  <meta property="og:image" content="<?= h($image) ?>">
  <meta property="og:type" content="<?= h($type) ?>">
  <?php foreach (($store['schemas'] ?? []) as $schema): ?>
  <script type="application/ld+json"><?= json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?></script>
  <?php endforeach; ?>
        <?php
    }
}

if (!function_exists('organization_schema')) {
    function organization_schema(string $description): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => seo_site_name(),
            'url' => seo_site_url(),
            'description' => $description,
        ];
    }
}

if (!function_exists('article_schema')) {
    function article_schema(array $article): array
    {
        $title = (string)($article['meta_title'] ?? $article['title'] ?? '');
        $description = (string)($article['meta_description'] ?? $article['excerpt'] ?? $article['description'] ?? '');
        $published = (string)($article['created_at'] ?? '');
        $modified = (string)($article['updated_at'] ?? $published);
        $image = (string)($article['image'] ?? seo_default_image());

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $title,
            'description' => seo_excerpt($description, 200),
            'image' => $image,
            'datePublished' => $published,
            'dateModified' => $modified,
            'mainEntityOfPage' => seo_current_url(),
        ];
    }
}

if (!function_exists('video_schema')) {
    function video_schema(array $video): array
    {
        $title = (string)($video['title'] ?? '');
        $description = (string)($video['short_description'] ?? $video['description'] ?? '');
        $thumbnail = (string)($video['thumbnail_url'] ?? seo_default_image());
        $embedUrl = (string)($video['embed_url'] ?? $video['public_url'] ?? '');
        $uploadDate = (string)($video['created_at'] ?? '');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'VideoObject',
            'name' => $title,
            'description' => seo_excerpt($description, 200),
            'thumbnailUrl' => [$thumbnail],
            'embedUrl' => $embedUrl,
            'uploadDate' => $uploadDate,
        ];
    }
}
