<?php
declare(strict_types=1);

require_once __DIR__ . '/public-content.php';
require_once __DIR__ . '/seo_helper.php';
require_once __DIR__ . '/../includes/analytics_tracker.php';

if (!function_exists('render_public_feature_404')) {
    function render_public_feature_404(string $title = 'Page Not Found', string $message = 'This page is not available right now.'): never
    {
        http_response_code(404);
        set_meta($title, $message, ['noindex' => true, 'type' => 'website']);
        ?>
<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php render_meta_tags(); ?>
  <script src="/assets/js/theme.js"></script>
  <link id="bootstrapCSS" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link href="/assets/css/fonts.css" rel="stylesheet">
  <link href="/assets/css/app.css" rel="stylesheet">
</head>
<body class="min-vh-100 d-flex align-items-center justify-content-center" style="padding:1.5rem">
  <div class="app-card" style="max-width:560px;width:100%">
    <div class="card-body text-center" style="padding:2rem">
      <div class="display-6 mb-3" style="color:var(--warning)"><i class="bi bi-eye-slash"></i></div>
      <h1 class="h3 mb-2"><?= h($title) ?></h1>
      <p class="text-muted mb-4"><?= h($message) ?></p>
      <a href="/" class="btn btn-app">Back to Home</a>
    </div>
  </div>
</body>
</html>
        <?php
        exit;
    }
}

if (!function_exists('render_public_page_shell_start')) {
    function render_public_page_shell_start(array $options): void
    {
        $title = (string)($options['title'] ?? 'Content');
        $subtitle = (string)($options['subtitle'] ?? '');
        $nav = is_array($options['nav'] ?? null) ? $options['nav'] : [];
        ?>
<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php render_meta_tags(); ?>
  <script src="/assets/js/theme.js"></script>
  <link id="bootstrapCSS" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link href="/assets/css/fonts.css" rel="stylesheet">
  <link href="/assets/css/app.css" rel="stylesheet">
  <style>
    .public-feature-shell { min-height:100svh; background:var(--bg); }
    .public-feature-nav {
      display:flex; align-items:center; justify-content:space-between; gap:1rem;
      padding:1rem 1.5rem; border-bottom:1px solid var(--border); background:var(--card);
      position:sticky; top:0; z-index:50;
    }
    .public-feature-links { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; }
    .public-feature-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:1rem; }
    .public-feature-card { border:1px solid var(--border); border-radius:1rem; background:var(--card); padding:1.1rem; height:100%; }
    .public-feature-card h2 { font-size:1.05rem; margin:0 0 .45rem; font-weight:800; }
    .public-feature-card p { color:var(--muted); font-size:.92rem; line-height:1.65; margin:0 0 .9rem; }
    .public-feature-meta { color:var(--muted); font-size:.78rem; margin-top:.6rem; }
    .public-detail-card { border:1px solid var(--border); border-radius:1.2rem; background:var(--card); padding:1.35rem; }
    .public-detail-copy { color:var(--muted); line-height:1.8; }
    .public-detail-actions { display:flex; gap:.75rem; flex-wrap:wrap; margin-top:1rem; }
    .public-related-list { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem; }
    .public-related-item { border:1px solid var(--border); border-radius:1rem; background:var(--card); padding:1rem; }
    .public-related-item h3 { font-size:1rem; margin:0 0 .35rem; font-weight:800; }
    .public-related-item p { font-size:.9rem; color:var(--muted); line-height:1.7; margin:0 0 .75rem; }
  </style>
</head>
<body>
  <div class="public-feature-shell">
    <nav class="public-feature-nav">
      <a href="/" class="app-brand text-decoration-none"><span class="brand-dot"></span><span>Habiba Nabil</span></a>
      <div class="public-feature-links">
        <?php foreach ($nav as $link): ?>
          <a href="<?= h((string)$link['href']) ?>" class="btn btn-ghost btn-sm"><?= h((string)$link['label']) ?></a>
        <?php endforeach; ?>
        <a href="/" class="btn btn-app btn-sm">Home</a>
      </div>
    </nav>

    <main class="container py-5">
      <div class="mb-4">
        <h1 class="mb-2"><?= h($title) ?></h1>
        <?php if ($subtitle !== ''): ?>
          <p class="text-muted mb-0"><?= h($subtitle) ?></p>
        <?php endif; ?>
      </div>
        <?php
    }
}

if (!function_exists('render_public_page_shell_end')) {
    function render_public_page_shell_end(): void
    {
        ?>
    </main>
  </div>
</body>
</html>
        <?php
    }
}

if (!function_exists('render_public_material_index_page')) {
    function render_public_material_index_page(array $options): void
    {
        $items = is_array($options['items'] ?? null) ? $options['items'] : [];
        $emptyTitle = (string)($options['empty_title'] ?? 'No items yet');
        $emptyBody = (string)($options['empty_body'] ?? 'Nothing has been published here yet.');

        render_public_page_shell_start($options);
        if (!$items): ?>
          <div class="app-card">
            <div class="card-body text-center py-5">
              <div class="display-6 mb-3" style="color:var(--muted)"><i class="bi bi-collection-play"></i></div>
              <div class="fw-bold mb-2"><?= h($emptyTitle) ?></div>
              <div class="text-muted"><?= h($emptyBody) ?></div>
            </div>
          </div>
        <?php else: ?>
          <div class="public-feature-grid">
            <?php foreach ($items as $item): ?>
              <article class="public-feature-card">
                <h2><a href="<?= h(material_detail_href($item)) ?>" class="text-decoration-none link-body-emphasis"><?= h((string)$item['title']) ?></a></h2>
                <?php if (!empty($item['description'])): ?>
                  <p><?= h(seo_excerpt((string)$item['description'], 180)) ?></p>
                <?php endif; ?>
                <div class="d-flex gap-2 flex-wrap">
                  <a href="<?= h(material_detail_href($item)) ?>" class="btn btn-app btn-sm">View Details</a>
                  <a href="<?= h(material_public_href($item)) ?>" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">
                    <i class="bi bi-box-arrow-up-right me-1"></i>Open
                  </a>
                </div>
                <?php if (!empty($item['created_at'])): ?>
                  <div class="public-feature-meta">Published: <?= h(format_app_datetime((string)$item['created_at'])) ?></div>
                <?php endif; ?>
              </article>
            <?php endforeach; ?>
          </div>
        <?php endif;
        render_public_page_shell_end();
    }
}

if (!function_exists('render_public_material_detail_page')) {
    function render_public_material_detail_page(array $options): void
    {
        $item = is_array($options['item'] ?? null) ? $options['item'] : [];
        $related = is_array($options['related'] ?? null) ? $options['related'] : [];
        $typeLabel = (string)($options['type_label'] ?? 'Content');
        $relatedTitle = (string)($options['related_title'] ?? 'Related content');
        $description = seo_plain_text((string)($item['description'] ?? ''));
        $publicUrl = material_public_href($item);

        render_public_page_shell_start($options);
        ?>
      <article class="public-detail-card mb-4">
        <div class="text-muted small text-uppercase fw-semibold mb-2"><?= h($typeLabel) ?></div>
        <?php if ($description !== ''): ?>
          <p class="public-detail-copy mb-0"><?= nl2br(h($description)) ?></p>
        <?php else: ?>
          <p class="public-detail-copy mb-0">Open this <?= h(strtolower($typeLabel)) ?> to continue learning with Habiba Nabil Arabic Academy.</p>
        <?php endif; ?>
        <div class="public-detail-actions">
          <a href="<?= h($publicUrl) ?>" target="_blank" rel="noopener" class="btn btn-app">
            <i class="bi bi-box-arrow-up-right me-1"></i><?= $typeLabel === 'Video' ? 'Watch Video' : 'Read Article' ?>
          </a>
          <a href="<?= h(material_listing_href((string)($item['type'] ?? 'article'))) ?>" class="btn btn-ghost">Back to <?= h($typeLabel) ?>s</a>
        </div>
        <?php if (!empty($item['created_at'])): ?>
          <div class="public-feature-meta">Published: <?= h(format_app_datetime((string)$item['created_at'])) ?></div>
        <?php endif; ?>
      </article>

      <?php if ($related): ?>
        <section aria-labelledby="relatedTitle">
          <h2 id="relatedTitle" class="mb-3"><?= h($relatedTitle) ?></h2>
          <div class="public-related-list">
            <?php foreach ($related as $relatedItem): ?>
              <article class="public-related-item">
                <h3><a href="<?= h(material_detail_href($relatedItem)) ?>" class="text-decoration-none link-body-emphasis"><?= h((string)$relatedItem['title']) ?></a></h3>
                <?php if (!empty($relatedItem['description'])): ?>
                  <p><?= h(seo_excerpt((string)$relatedItem['description'], 120)) ?></p>
                <?php endif; ?>
                <a href="<?= h(material_detail_href($relatedItem)) ?>" class="btn btn-ghost btn-sm">View</a>
              </article>
            <?php endforeach; ?>
          </div>
        </section>
      <?php endif;
        render_public_page_shell_end();
    }
}
