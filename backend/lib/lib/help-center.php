<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/learning-audit.php';

function help_roles(): array
{
    return [
        'public' => 'Public',
        'teacher' => 'Teacher',
        'student' => 'Student',
        'parent' => 'Parent',
        'academy' => 'Academy',
        'media_buyer' => 'Media Buyer',
    ];
}

function help_languages(): array
{
    return ['both' => 'Arabic + English', 'ar' => 'Arabic', 'en' => 'English'];
}

function help_statuses(): array
{
    return ['draft' => 'Draft', 'published' => 'Published', 'archived' => 'Archived'];
}

function help_slug(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^\p{L}\p{N}]+/u', '-', $value) ?? '';
    $value = trim($value, '-');
    return $value !== '' ? mb_substr($value, 0, 180) : ('article-' . date('YmdHis'));
}

function help_column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    ");
    $stmt->execute([$table, $column]);
    return (int)$stmt->fetchColumn() > 0;
}

function help_add_column(PDO $pdo, string $table, string $column, string $definition): void
{
    if (!help_column_exists($pdo, $table, $column)) {
        $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
    }
}

function help_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) return;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS help_categories (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(160) NOT NULL UNIQUE,
            name VARCHAR(180) NOT NULL,
            description TEXT NULL,
            role VARCHAR(40) NOT NULL DEFAULT 'public',
            sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            KEY idx_help_categories_role (role),
            KEY idx_help_categories_active (active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS help_articles (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(220) NOT NULL,
            slug VARCHAR(190) NOT NULL UNIQUE,
            role VARCHAR(40) NOT NULL DEFAULT 'public',
            category_id INT UNSIGNED NULL,
            excerpt TEXT NULL,
            content MEDIUMTEXT NULL,
            video_url VARCHAR(500) NULL,
            language VARCHAR(20) NOT NULL DEFAULT 'both',
            status VARCHAR(30) NOT NULL DEFAULT 'draft',
            sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            is_featured TINYINT(1) NOT NULL DEFAULT 0,
            created_by INT UNSIGNED NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            KEY idx_help_articles_role (role),
            KEY idx_help_articles_status (status),
            KEY idx_help_articles_category (category_id),
            KEY idx_help_articles_featured (is_featured)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_onboarding_progress (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNSIGNED NOT NULL,
            role VARCHAR(40) NOT NULL,
            checklist_key VARCHAR(120) NOT NULL,
            completed TINYINT(1) NOT NULL DEFAULT 0,
            completed_at DATETIME NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uniq_onboarding_item (user_id, role, checklist_key),
            KEY idx_onboarding_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_tour_progress (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNSIGNED NOT NULL,
            role VARCHAR(40) NOT NULL,
            tour_key VARCHAR(120) NOT NULL,
            completed TINYINT(1) NOT NULL DEFAULT 0,
            skipped TINYINT(1) NOT NULL DEFAULT 0,
            completed_at DATETIME NULL DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uniq_tour_item (user_id, role, tour_key),
            KEY idx_tour_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    help_seed_defaults($pdo);
    $done = true;
}

function help_seed_defaults(PDO $pdo): void
{
    $categories = [
        ['getting-started', 'Getting Started', 'public', 10],
        ['dashboard', 'Dashboard Guide', 'public', 20],
        ['payments', 'Payments and Packages', 'teacher', 30],
        ['learning', 'Learning Tools', 'student', 40],
        ['child-progress', 'Child Progress', 'parent', 50],
        ['briefs', 'Academy Briefs', 'academy', 60],
        ['tracking', 'Tracking and Commissions', 'media_buyer', 70],
    ];
    $catStmt = $pdo->prepare("
        INSERT IGNORE INTO help_categories (slug, name, role, sort_order)
        VALUES (?, ?, ?, ?)
    ");
    foreach ($categories as $row) {
        $catStmt->execute($row);
    }

    $articles = [
        ['student-start', 'Student quick start', 'student', 'learning', 'Open your dashboard, check notifications, complete homework, then review teacher feedback.', "Use your dashboard as the first place to check lessons, homework, materials, progress, and notifications.\n\nWhen a homework, scenario, review, or material is assigned, open it from the notification action button or the sidebar.", 10, 1],
        ['parent-start', 'Parent portal quick start', 'parent', 'child-progress', 'Use the parent portal to follow your child lessons, homework, feedback, materials, balance, and progress.', "The parent portal only shows children linked to your account.\n\nUse the child pages to view homework results, session notes, materials, and progress.", 10, 1],
        ['teacher-start', 'Teacher dashboard quick start', 'teacher', 'dashboard', 'Review pending work, payments, onboarding, students, materials, analytics, and settings from the teacher dashboard.', "Start from the teacher dashboard to see pending payments, onboarding, level tests, submissions, and analytics.\n\nUse Settings for platform configuration and Help Center to edit this guide.", 10, 1],
        ['academy-brief-flow', 'Academy brief flow', 'academy', 'briefs', 'Submit a student brief and track its review status until it is accepted, rejected, or needs more information.', "Academy accounts can only view their own briefs.\n\nAfter submission, the teacher reviews the brief and can request more information or convert it into onboarding.", 10, 1],
        ['media-buyer-tracking', 'How media buyer tracking works', 'media_buyer', 'tracking', 'Use your tracking links in campaigns. Visits and qualified orders are attributed by visitor cookie and checkout data.', "Use the website, pricing, and plan links from your dashboard.\n\nOrders count for commission only after verified payment and owner approval. Pending, failed, cancelled, or refunded orders do not count.", 10, 1],
        ['public-help', 'How this platform works', 'public', 'getting-started', 'Habiba Nabil Arabic Academy uses one platform for payment, onboarding, learning, feedback, materials, and progress.', "Choose the guide for your role to understand your dashboard and next steps.", 10, 1],
    ];

    $catId = $pdo->prepare("SELECT id FROM help_categories WHERE slug = ? LIMIT 1");
    $ins = $pdo->prepare("
        INSERT IGNORE INTO help_articles
            (title, slug, role, category_id, excerpt, content, language, status, sort_order, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, 'both', 'published', ?, ?)
    ");
    foreach ($articles as $article) {
        [$slug, $title, $role, $catSlug, $excerpt, $content, $sort, $featured] = $article;
        $catId->execute([$catSlug]);
        $categoryId = (int)$catId->fetchColumn() ?: null;
        $ins->execute([$title, $slug, $role, $categoryId, $excerpt, $content, $sort, $featured]);
    }
}

function help_categories(PDO $pdo, ?string $role = null, bool $activeOnly = false): array
{
    help_ensure_schema($pdo);
    $where = [];
    $params = [];
    if ($role !== null && $role !== '') {
        $where[] = '(role = ? OR role = "public")';
        $params[] = $role;
    }
    if ($activeOnly) {
        $where[] = 'active = 1';
    }
    $sql = 'SELECT * FROM help_categories';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY sort_order ASC, name ASC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll() ?: [];
}

function help_article(PDO $pdo, int $id): ?array
{
    help_ensure_schema($pdo);
    $stmt = $pdo->prepare("SELECT * FROM help_articles WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function help_article_by_slug(PDO $pdo, string $slug, string $role = 'public'): ?array
{
    help_ensure_schema($pdo);
    $stmt = $pdo->prepare("
        SELECT a.*, c.name AS category_name
        FROM help_articles a
        LEFT JOIN help_categories c ON c.id = a.category_id
        WHERE a.slug = ?
          AND a.status = 'published'
          AND (a.role = ? OR a.role = 'public')
        LIMIT 1
    ");
    $stmt->execute([$slug, $role]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function help_list_articles(PDO $pdo, array $filters = []): array
{
    help_ensure_schema($pdo);
    $where = [];
    $params = [];

    if (!empty($filters['role'])) {
        $where[] = 'a.role = ?';
        $params[] = (string)$filters['role'];
    }
    if (!empty($filters['visible_role'])) {
        $where[] = '(a.role = ? OR a.role = "public")';
        $params[] = (string)$filters['visible_role'];
    }
    if (!empty($filters['status'])) {
        $where[] = 'a.status = ?';
        $params[] = (string)$filters['status'];
    }
    if (!empty($filters['category_id'])) {
        $where[] = 'a.category_id = ?';
        $params[] = (int)$filters['category_id'];
    }
    if (!empty($filters['featured'])) {
        $where[] = 'a.is_featured = 1';
    }
    if (!empty($filters['q'])) {
        $q = '%' . trim((string)$filters['q']) . '%';
        $where[] = '(a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ?)';
        array_push($params, $q, $q, $q);
    }

    $sql = "
        SELECT a.*, c.name AS category_name
        FROM help_articles a
        LEFT JOIN help_categories c ON c.id = a.category_id
    ";
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY a.is_featured DESC, a.sort_order ASC, a.updated_at DESC, a.created_at DESC LIMIT 250';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll() ?: [];
}

function help_save_article(PDO $pdo, array $data, ?int $id = null): int
{
    help_ensure_schema($pdo);
    $roles = array_keys(help_roles());
    $languages = array_keys(help_languages());
    $statuses = array_keys(help_statuses());

    $title = trim((string)($data['title'] ?? ''));
    if ($title === '') {
        throw new RuntimeException('Article title is required.');
    }
    $slug = help_slug((string)($data['slug'] ?? $title));
    $role = in_array((string)($data['role'] ?? 'public'), $roles, true) ? (string)$data['role'] : 'public';
    $language = in_array((string)($data['language'] ?? 'both'), $languages, true) ? (string)$data['language'] : 'both';
    $status = in_array((string)($data['status'] ?? 'draft'), $statuses, true) ? (string)$data['status'] : 'draft';

    if ($id !== null && $id > 0) {
        $stmt = $pdo->prepare("
            UPDATE help_articles
            SET title = ?, slug = ?, role = ?, category_id = ?, excerpt = ?, content = ?, video_url = ?,
                language = ?, status = ?, sort_order = ?, is_featured = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([
            $title, $slug, $role, (int)($data['category_id'] ?? 0) ?: null,
            trim((string)($data['excerpt'] ?? '')), trim((string)($data['content'] ?? '')),
            trim((string)($data['video_url'] ?? '')), $language, $status,
            max(0, (int)($data['sort_order'] ?? 0)), !empty($data['is_featured']) ? 1 : 0, $id,
        ]);
        learning_audit($pdo, 'help_article_updated', 'help_article', $id, ['title' => $title, 'status' => $status], [], 'teacher', null);
        return $id;
    }

    $stmt = $pdo->prepare("
        INSERT INTO help_articles
            (title, slug, role, category_id, excerpt, content, video_url, language, status, sort_order, is_featured, created_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $title, $slug, $role, (int)($data['category_id'] ?? 0) ?: null,
        trim((string)($data['excerpt'] ?? '')), trim((string)($data['content'] ?? '')),
        trim((string)($data['video_url'] ?? '')), $language, $status,
        max(0, (int)($data['sort_order'] ?? 0)), !empty($data['is_featured']) ? 1 : 0,
        !empty($_SESSION['teacher_id']) ? (int)$_SESSION['teacher_id'] : null,
    ]);
    $newId = (int)$pdo->lastInsertId();
    learning_audit($pdo, 'help_article_created', 'help_article', $newId, ['title' => $title, 'status' => $status], [], 'teacher', null);
    return $newId;
}

function help_save_category(PDO $pdo, array $data, ?int $id = null): int
{
    help_ensure_schema($pdo);
    $name = trim((string)($data['name'] ?? ''));
    if ($name === '') throw new RuntimeException('Category name is required.');
    $slug = help_slug((string)($data['slug'] ?? $name));
    $role = in_array((string)($data['role'] ?? 'public'), array_keys(help_roles()), true) ? (string)$data['role'] : 'public';

    if ($id !== null && $id > 0) {
        $stmt = $pdo->prepare("UPDATE help_categories SET slug = ?, name = ?, description = ?, role = ?, sort_order = ?, active = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$slug, $name, trim((string)($data['description'] ?? '')), $role, max(0, (int)($data['sort_order'] ?? 0)), !empty($data['active']) ? 1 : 0, $id]);
        learning_audit($pdo, 'help_category_updated', 'help_category', $id, ['name' => $name], [], 'teacher', null);
        return $id;
    }

    $stmt = $pdo->prepare("INSERT INTO help_categories (slug, name, description, role, sort_order, active, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$slug, $name, trim((string)($data['description'] ?? '')), $role, max(0, (int)($data['sort_order'] ?? 0)), !empty($data['active']) ? 1 : 0]);
    $newId = (int)$pdo->lastInsertId();
    learning_audit($pdo, 'help_category_created', 'help_category', $newId, ['name' => $name], [], 'teacher', null);
    return $newId;
}

function help_checklist_items(string $role): array
{
    return match ($role) {
        'student' => [
            'profile' => 'Complete profile',
            'lesson' => 'Check upcoming lesson',
            'homework' => 'Open today homework',
            'feedback' => 'Review teacher feedback',
            'flashcards' => 'Practice flashcards',
        ],
        'parent' => [
            'child_profile' => 'Open child profile',
            'lesson' => 'Check upcoming lesson',
            'homework' => 'Review homework status',
            'balance' => 'Check package balance',
            'contact' => 'Contact teacher if needed',
        ],
        'academy' => [
            'profile' => 'Complete academy profile',
            'brief' => 'Submit first brief',
            'status' => 'Track brief status',
        ],
        'media_buyer' => [
            'agreement' => 'Accept agreement',
            'tracking' => 'Copy tracking link',
            'campaign' => 'Create first campaign',
            'orders' => 'Check attributed orders',
        ],
        default => [
            'settings' => 'Review payment settings',
            'pricing' => 'Confirm pricing',
            'notifications' => 'Check notification settings',
            'student' => 'Create first student',
            'homework' => 'Create first homework',
            'checkout' => 'Test checkout',
        ],
    };
}

function help_progress_for(PDO $pdo, int $userId, string $role): array
{
    help_ensure_schema($pdo);
    $stmt = $pdo->prepare("SELECT checklist_key, completed FROM user_onboarding_progress WHERE user_id = ? AND role = ?");
    $stmt->execute([$userId, $role]);
    $rows = [];
    foreach ($stmt->fetchAll() as $row) {
        $rows[(string)$row['checklist_key']] = (int)$row['completed'] === 1;
    }
    return $rows;
}

function help_render_checklist(PDO $pdo, int $userId, string $role): void
{
    $items = help_checklist_items($role);
    $progress = $userId > 0 ? help_progress_for($pdo, $userId, $role) : [];
    echo '<div class="app-card mb-3"><div class="card-body">';
    echo '<div class="d-flex justify-content-between align-items-center gap-2 mb-2"><div><div class="fw-bold">Start here</div><div class="text-muted small">Basic checklist for this portal.</div></div><a class="btn btn-sm btn-ghost" href="' . h(help_role_url($role)) . '">Help</a></div>';
    echo '<div class="d-grid gap-2">';
    foreach ($items as $key => $label) {
        $done = !empty($progress[$key]);
        echo '<div class="d-flex align-items-center gap-2 small"><i class="bi ' . ($done ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted') . '"></i><span>' . h($label) . '</span></div>';
    }
    echo '</div></div></div>';
}

function help_role_url(string $role): string
{
    return match ($role) {
        'teacher' => '/teacher/help/',
        'student' => '/student/help/',
        'parent' => '/parent/help/',
        'academy' => '/academy/help/',
        'media_buyer' => '/media/help/',
        default => '/help/',
    };
}
