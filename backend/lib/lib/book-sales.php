<?php
declare(strict_types=1);

require_once __DIR__ . '/interactive-books.php';
require_once __DIR__ . '/platform-notifications.php';

if (function_exists('book_sales_ensure_schema')) {
    return;
}

function book_sales_column_exists(PDO $pdo, string $table, string $column): bool
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

function book_sales_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }

    interactive_books_ensure_schema($pdo);

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            package_key VARCHAR(100) NOT NULL,
            title_en VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255) NOT NULL,
            description_en TEXT NULL,
            description_ar TEXT NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            original_price DECIMAL(10,2) NOT NULL DEFAULT 0,
            currency VARCHAR(12) NOT NULL DEFAULT 'AED',
            includes_teacher_feedback TINYINT(1) NOT NULL DEFAULT 0,
            includes_extra_review_session TINYINT(1) NOT NULL DEFAULT 0,
            status ENUM('active','draft','hidden') NOT NULL DEFAULT 'active',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            UNIQUE KEY uniq_book_package (book_id, package_key),
            KEY idx_book_packages_book (book_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_activation_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            book_id INT NOT NULL,
            package_id INT NOT NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            currency VARCHAR(12) NOT NULL DEFAULT 'AED',
            payment_method VARCHAR(60) NOT NULL DEFAULT '',
            payment_reference VARCHAR(255) NULL,
            payment_proof_path VARCHAR(500) NULL,
            student_notes TEXT NULL,
            status ENUM('pending','approved','rejected','needs_more_info') NOT NULL DEFAULT 'pending',
            admin_note TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            approved_at DATETIME NULL,
            approved_by INT NULL,
            KEY idx_book_activation_student (student_id, book_id),
            KEY idx_book_activation_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_marketing_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            event_key VARCHAR(100) NOT NULL,
            event_value TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            KEY idx_student_marketing_student_key (student_id, event_key, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_units (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            source_lesson_id INT NULL,
            unit_type VARCHAR(40) NOT NULL DEFAULT 'lesson',
            title_en VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            sort_order DECIMAL(7,2) NULL,
            status ENUM('draft','published','hidden','archived') NOT NULL DEFAULT 'draft',
            content_json LONGTEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            created_by INT NULL,
            updated_by INT NULL,
            UNIQUE KEY uniq_book_unit_slug (book_id, slug),
            KEY idx_book_units_book (book_id, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_unit_versions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            unit_id INT NOT NULL,
            version_number INT NOT NULL DEFAULT 1,
            content_json LONGTEXT NULL,
            change_note TEXT NULL,
            created_by INT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_book_unit_versions_unit (unit_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_launch_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            student_visibility_status VARCHAR(50) NOT NULL DEFAULT 'teacher_preview_only',
            dashboard_card_enabled TINYINT(1) NOT NULL DEFAULT 0,
            fixed_icon_enabled TINYINT(1) NOT NULL DEFAULT 0,
            login_banner_enabled TINYINT(1) NOT NULL DEFAULT 0,
            homework_popup_enabled TINYINT(1) NOT NULL DEFAULT 0,
            feedback_popup_enabled TINYINT(1) NOT NULL DEFAULT 0,
            product_page_enabled TINYINT(1) NOT NULL DEFAULT 0,
            preview_enabled TINYINT(1) NOT NULL DEFAULT 0,
            checkout_enabled TINYINT(1) NOT NULL DEFAULT 0,
            locked_cta_enabled TINYINT(1) NOT NULL DEFAULT 0,
            coming_soon_card_enabled TINYINT(1) NOT NULL DEFAULT 0,
            marketing_notifications_enabled TINYINT(1) NOT NULL DEFAULT 0,
            activation_notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
            submission_feedback_notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
            allow_existing_access_when_paused TINYINT(1) NOT NULL DEFAULT 1,
            launched_at DATETIME NULL,
            launched_by INT NULL,
            updated_by INT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            UNIQUE KEY uniq_book_launch_settings (book_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_launch_audit_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            old_status VARCHAR(50) NULL,
            new_status VARCHAR(50) NULL,
            changed_settings_json LONGTEXT NULL,
            changed_by INT NULL,
            change_note TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_book_launch_audit_book (book_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $accessColumns = [
        'package_id' => "ALTER TABLE student_book_access ADD COLUMN package_id INT NULL AFTER book_id",
        'price_paid' => "ALTER TABLE student_book_access ADD COLUMN price_paid DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER purchase_status",
        'currency' => "ALTER TABLE student_book_access ADD COLUMN currency VARCHAR(12) NOT NULL DEFAULT 'AED' AFTER price_paid",
        'includes_teacher_feedback' => "ALTER TABLE student_book_access ADD COLUMN includes_teacher_feedback TINYINT(1) NOT NULL DEFAULT 0 AFTER currency",
        'includes_extra_review_session' => "ALTER TABLE student_book_access ADD COLUMN includes_extra_review_session TINYINT(1) NOT NULL DEFAULT 0 AFTER includes_teacher_feedback",
        'extra_review_session_status' => "ALTER TABLE student_book_access ADD COLUMN extra_review_session_status ENUM('not_scheduled','scheduled','completed','cancelled') NOT NULL DEFAULT 'not_scheduled' AFTER includes_extra_review_session",
        'activated_at' => "ALTER TABLE student_book_access ADD COLUMN activated_at DATETIME NULL AFTER extra_review_session_status",
        'activated_by' => "ALTER TABLE student_book_access ADD COLUMN activated_by INT NULL AFTER activated_at",
    ];
    foreach ($accessColumns as $column => $sql) {
        try {
            if (!book_sales_column_exists($pdo, 'student_book_access', $column)) {
                $pdo->exec($sql);
            }
        } catch (Throwable) {
        }
    }

    book_sales_seed_package($pdo);
    book_sales_seed_units($pdo);
    book_sales_seed_launch_settings($pdo);
    $done = true;
}

function book_sales_launch_defaults(): array
{
    return [
        'student_visibility_status' => 'teacher_preview_only',
        'dashboard_card_enabled' => 0,
        'fixed_icon_enabled' => 0,
        'login_banner_enabled' => 0,
        'homework_popup_enabled' => 0,
        'feedback_popup_enabled' => 0,
        'product_page_enabled' => 0,
        'preview_enabled' => 0,
        'checkout_enabled' => 0,
        'locked_cta_enabled' => 0,
        'coming_soon_card_enabled' => 0,
        'marketing_notifications_enabled' => 0,
        'activation_notifications_enabled' => 1,
        'submission_feedback_notifications_enabled' => 1,
        'allow_existing_access_when_paused' => 1,
    ];
}

function book_sales_book(PDO $pdo): ?array
{
    $book = interactive_books_beginner_book($pdo);
    return $book ?: null;
}

function book_sales_seed_package(PDO $pdo): void
{
    $book = book_sales_book($pdo);
    if (!$book) {
        return;
    }
    $stmt = $pdo->prepare("SELECT id FROM book_packages WHERE book_id = ? AND package_key = ? LIMIT 1");
    $stmt->execute([(int)$book['id'], 'teacher_feedback_extra_review']);
    $id = (int)($stmt->fetchColumn() ?: 0);
    $data = [
        (int)$book['id'],
        'teacher_feedback_extra_review',
        'Interactive Book + Teacher Feedback + Extra Review Session',
        'الكتاب التفاعلي + تصحيح المدرّس + حصة مراجعة إضافية',
        'Full interactive book access with teacher correction and one extra review session.',
        'تفعيل الكتاب التفاعلي كاملًا مع تصحيح المدرّس وحصة مراجعة إضافية.',
        80,
        120,
        'AED',
        1,
        1,
        'active',
    ];
    if ($id) {
        $pdo->prepare("
            UPDATE book_packages
            SET title_en = ?, title_ar = ?, description_en = ?, description_ar = ?, price = ?, original_price = ?, currency = ?,
                includes_teacher_feedback = ?, includes_extra_review_session = ?, status = ?, updated_at = NOW()
            WHERE id = ?
        ")->execute(array_merge(array_slice($data, 2), [$id]));
    } else {
        $pdo->prepare("
            INSERT INTO book_packages
                (book_id, package_key, title_en, title_ar, description_en, description_ar, price, original_price, currency, includes_teacher_feedback, includes_extra_review_session, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ")->execute($data);
    }
    $pdo->prepare("UPDATE books SET price = 80, updated_at = NOW() WHERE id = ?")->execute([(int)$book['id']]);
}

function book_sales_seed_units(PDO $pdo): void
{
    $book = book_sales_book($pdo);
    if (!$book) {
        return;
    }
    $bookId = (int)$book['id'];
    $static = [
        ['cover', 'cover', 'Front Cover', 'الغلاف الأمامي', 'cover', 0.10],
        ['intro_page', 'thank-you', 'Thank You for Purchasing', 'شكرًا لشرائك هذا الكتاب', 'thank-you', 0.20],
        ['intro_page', 'benefit', 'How to Benefit from This Book', 'كيف تستفيد من هذا الكتاب؟', 'benefit', 0.30],
        ['intro_page', 'learn', 'What Will You Learn in This Book?', 'ماذا ستتعلم في هذا الكتاب؟', 'learn', 0.40],
        ['intro_page', 'works', 'How This Book Works', 'كيف يعمل هذا الكتاب؟', 'works', 0.50],
        ['contents', 'contents', 'Book Contents', 'محتوى الكتاب', 'contents', 0.60],
        ['intro_page', 'sounds', 'Arabic Sounds & Letters Quick Start', 'بداية سريعة للأصوات والحروف العربية', 'sounds', 0.70],
        ['ending_page', 'end-thank-you', 'End Thank You', 'أحسنت! لقد أنهيت الكتاب', 'end-thank-you', 99.10],
        ['ending_page', 'final-word', 'Final Word', 'كلمة أخيرة', 'final-word', 99.20],
        ['back_cover', 'back-cover', 'Back Cover', 'الغلاف الخلفي', 'back-cover', 99.30],
    ];
    $upsert = $pdo->prepare("
        INSERT INTO book_units (book_id, unit_type, title_en, title_ar, slug, sort_order, status, content_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'published', ?, NOW())
        ON DUPLICATE KEY UPDATE unit_type = VALUES(unit_type), title_en = VALUES(title_en), title_ar = VALUES(title_ar),
            sort_order = VALUES(sort_order), updated_at = NOW()
    ");
    foreach ($static as [$type, $key, $titleEn, $titleAr, $slug, $sortOrder]) {
        $upsert->execute([$bookId, $type, $titleEn, $titleAr, $slug, $sortOrder, json_encode(['page_key' => $key], JSON_UNESCAPED_UNICODE)]);
    }

    $stmt = $pdo->prepare("SELECT * FROM book_lessons WHERE book_id = ? ORDER BY COALESCE(sort_order, lesson_number), id");
    $stmt->execute([$bookId]);
    foreach (($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []) as $lesson) {
        $unitType = (string)($lesson['slug'] ?? '') === 'final-review-beginner'
            ? 'final_review'
            : ((string)($lesson['unit_type'] ?? 'lesson') === 'review' ? 'review' : 'lesson');
        $upsertLesson = $pdo->prepare("
            INSERT INTO book_units (book_id, source_lesson_id, unit_type, title_en, title_ar, slug, sort_order, status, content_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE source_lesson_id = VALUES(source_lesson_id), unit_type = VALUES(unit_type),
                title_en = VALUES(title_en), title_ar = VALUES(title_ar), sort_order = VALUES(sort_order), status = VALUES(status), updated_at = NOW()
        ");
        $upsertLesson->execute([
            $bookId,
            (int)$lesson['id'],
            $unitType,
            (string)$lesson['title_en'],
            (string)$lesson['title_ar'],
            (string)$lesson['slug'],
            (float)($lesson['sort_order'] ?? $lesson['lesson_number']),
            (string)$lesson['status'] === 'published' ? 'published' : 'draft',
            json_encode(['source' => 'book_lessons', 'lesson_id' => (int)$lesson['id']], JSON_UNESCAPED_UNICODE),
        ]);
    }
}

function book_sales_seed_launch_settings(PDO $pdo): void
{
    $book = book_sales_book($pdo);
    if (!$book) {
        return;
    }
    $stmt = $pdo->prepare("SELECT id FROM book_launch_settings WHERE book_id = ? LIMIT 1");
    $stmt->execute([(int)$book['id']]);
    if ($stmt->fetchColumn()) {
        return;
    }
    $defaults = book_sales_launch_defaults();
    $pdo->prepare("
        INSERT INTO book_launch_settings
            (book_id, student_visibility_status, dashboard_card_enabled, fixed_icon_enabled, login_banner_enabled,
             homework_popup_enabled, feedback_popup_enabled, product_page_enabled, preview_enabled, checkout_enabled,
             locked_cta_enabled, coming_soon_card_enabled, marketing_notifications_enabled, activation_notifications_enabled,
             submission_feedback_notifications_enabled, allow_existing_access_when_paused, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ")->execute([
        (int)$book['id'],
        $defaults['student_visibility_status'],
        $defaults['dashboard_card_enabled'],
        $defaults['fixed_icon_enabled'],
        $defaults['login_banner_enabled'],
        $defaults['homework_popup_enabled'],
        $defaults['feedback_popup_enabled'],
        $defaults['product_page_enabled'],
        $defaults['preview_enabled'],
        $defaults['checkout_enabled'],
        $defaults['locked_cta_enabled'],
        $defaults['coming_soon_card_enabled'],
        $defaults['marketing_notifications_enabled'],
        $defaults['activation_notifications_enabled'],
        $defaults['submission_feedback_notifications_enabled'],
        $defaults['allow_existing_access_when_paused'],
    ]);
}

function book_sales_launch_settings(PDO $pdo, int $bookId): array
{
    book_sales_ensure_schema($pdo);
    $stmt = $pdo->prepare("SELECT * FROM book_launch_settings WHERE book_id = ? LIMIT 1");
    $stmt->execute([$bookId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        $defaults = book_sales_launch_defaults();
        $pdo->prepare("
            INSERT INTO book_launch_settings
                (book_id, student_visibility_status, dashboard_card_enabled, fixed_icon_enabled, login_banner_enabled,
                 homework_popup_enabled, feedback_popup_enabled, product_page_enabled, preview_enabled, checkout_enabled,
                 locked_cta_enabled, coming_soon_card_enabled, marketing_notifications_enabled, activation_notifications_enabled,
                 submission_feedback_notifications_enabled, allow_existing_access_when_paused, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ")->execute([
            $bookId,
            $defaults['student_visibility_status'],
            $defaults['dashboard_card_enabled'],
            $defaults['fixed_icon_enabled'],
            $defaults['login_banner_enabled'],
            $defaults['homework_popup_enabled'],
            $defaults['feedback_popup_enabled'],
            $defaults['product_page_enabled'],
            $defaults['preview_enabled'],
            $defaults['checkout_enabled'],
            $defaults['locked_cta_enabled'],
            $defaults['coming_soon_card_enabled'],
            $defaults['marketing_notifications_enabled'],
            $defaults['activation_notifications_enabled'],
            $defaults['submission_feedback_notifications_enabled'],
            $defaults['allow_existing_access_when_paused'],
        ]);
        $stmt->execute([$bookId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    return array_merge(book_sales_launch_defaults(), $row ?: []);
}

function book_sales_launch_status_label(string $status): array
{
    return match ($status) {
        'hidden' => ['Hidden from students', 'مخفي عن الطلاب', 'secondary'],
        'coming_soon' => ['Coming Soon', 'قريبًا', 'warning'],
        'launched' => ['Live for Students', 'ظاهر للطلاب', 'success'],
        'paused' => ['Paused', 'متوقف مؤقتًا', 'danger'],
        default => ['Teacher Preview Only', 'معاينة المدرّس فقط', 'info'],
    };
}

function book_sales_is_student_launched(array $settings): bool
{
    return (string)($settings['student_visibility_status'] ?? '') === 'launched';
}

function book_sales_student_can_view_product(array $settings): bool
{
    $status = (string)($settings['student_visibility_status'] ?? 'teacher_preview_only');
    return ($status === 'launched' && (int)($settings['product_page_enabled'] ?? 0) === 1)
        || ($status === 'coming_soon' && (int)($settings['coming_soon_card_enabled'] ?? 0) === 1);
}

function book_sales_student_can_checkout(array $settings): bool
{
    return book_sales_is_student_launched($settings) && (int)($settings['checkout_enabled'] ?? 0) === 1;
}

function book_sales_student_can_preview(array $settings): bool
{
    return book_sales_is_student_launched($settings) && (int)($settings['preview_enabled'] ?? 0) === 1;
}

function book_sales_student_can_continue_with_access(array $settings): bool
{
    $status = (string)($settings['student_visibility_status'] ?? 'teacher_preview_only');
    return $status === 'launched' || ($status === 'paused' && (int)($settings['allow_existing_access_when_paused'] ?? 0) === 1);
}

function book_sales_unavailable_message(array $settings): array
{
    $status = (string)($settings['student_visibility_status'] ?? 'teacher_preview_only');
    if ($status === 'paused') {
        return ['This book is currently unavailable for new activation.', 'هذا الكتاب غير متاح للتفعيل الجديد حاليًا.'];
    }
    if ($status === 'coming_soon') {
        return ['This book is coming soon.', 'هذا الكتاب سيكون متاحًا قريبًا.'];
    }
    return ['This book is not available yet.', 'هذا الكتاب غير متاح حاليًا.'];
}

function book_sales_log_launch_change(PDO $pdo, int $bookId, ?string $oldStatus, ?string $newStatus, array $changedSettings, int $changedBy, string $note): void
{
    try {
        $pdo->prepare("
            INSERT INTO book_launch_audit_log (book_id, old_status, new_status, changed_settings_json, changed_by, change_note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ")->execute([
            $bookId,
            $oldStatus,
            $newStatus,
            json_encode($changedSettings, JSON_UNESCAPED_UNICODE),
            $changedBy,
            $note,
        ]);
    } catch (Throwable) {
    }
}

function book_sales_save_launch_settings(PDO $pdo, int $bookId, array $settings, int $teacherId, string $note = ''): void
{
    $current = book_sales_launch_settings($pdo, $bookId);
    $defaults = book_sales_launch_defaults();
    $allowedStatuses = ['hidden', 'teacher_preview_only', 'coming_soon', 'launched', 'paused'];
    $status = (string)($settings['student_visibility_status'] ?? $defaults['student_visibility_status']);
    if (!in_array($status, $allowedStatuses, true)) {
        $status = $defaults['student_visibility_status'];
    }
    $payload = array_merge($defaults, $settings);
    $payload['student_visibility_status'] = $status;

    $fields = [
        'dashboard_card_enabled', 'fixed_icon_enabled', 'login_banner_enabled', 'homework_popup_enabled',
        'feedback_popup_enabled', 'product_page_enabled', 'preview_enabled', 'checkout_enabled',
        'locked_cta_enabled', 'coming_soon_card_enabled', 'marketing_notifications_enabled',
        'activation_notifications_enabled', 'submission_feedback_notifications_enabled', 'allow_existing_access_when_paused',
    ];
    foreach ($fields as $field) {
        $payload[$field] = (int)!empty($payload[$field]);
    }

    $launchedAtSql = $status === 'launched' && empty($current['launched_at']) ? ', launched_at = NOW(), launched_by = ?' : '';
    $params = [
        $payload['student_visibility_status'],
        $payload['dashboard_card_enabled'],
        $payload['fixed_icon_enabled'],
        $payload['login_banner_enabled'],
        $payload['homework_popup_enabled'],
        $payload['feedback_popup_enabled'],
        $payload['product_page_enabled'],
        $payload['preview_enabled'],
        $payload['checkout_enabled'],
        $payload['locked_cta_enabled'],
        $payload['coming_soon_card_enabled'],
        $payload['marketing_notifications_enabled'],
        $payload['activation_notifications_enabled'],
        $payload['submission_feedback_notifications_enabled'],
        $payload['allow_existing_access_when_paused'],
        $teacherId,
    ];
    if ($launchedAtSql !== '') {
        $params[] = $teacherId;
    }
    $params[] = $bookId;
    $pdo->prepare("
        UPDATE book_launch_settings
        SET student_visibility_status = ?,
            dashboard_card_enabled = ?,
            fixed_icon_enabled = ?,
            login_banner_enabled = ?,
            homework_popup_enabled = ?,
            feedback_popup_enabled = ?,
            product_page_enabled = ?,
            preview_enabled = ?,
            checkout_enabled = ?,
            locked_cta_enabled = ?,
            coming_soon_card_enabled = ?,
            marketing_notifications_enabled = ?,
            activation_notifications_enabled = ?,
            submission_feedback_notifications_enabled = ?,
            allow_existing_access_when_paused = ?,
            updated_by = ?,
            updated_at = NOW()
            {$launchedAtSql}
        WHERE book_id = ?
    ")->execute($params);
    book_sales_log_launch_change($pdo, $bookId, (string)($current['student_visibility_status'] ?? ''), $status, $payload, $teacherId, $note);
}

function book_sales_package(PDO $pdo, int $bookId): ?array
{
    book_sales_ensure_schema($pdo);
    $stmt = $pdo->prepare("SELECT * FROM book_packages WHERE book_id = ? AND package_key = ? LIMIT 1");
    $stmt->execute([$bookId, 'teacher_feedback_extra_review']);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function book_sales_access(PDO $pdo, int $studentId, int $bookId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM student_book_access WHERE student_id = ? AND book_id = ? LIMIT 1");
    $stmt->execute([$studentId, $bookId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function book_sales_has_active_access(PDO $pdo, int $studentId, int $bookId): bool
{
    $access = book_sales_access($pdo, $studentId, $bookId);
    return $access && (string)$access['access_status'] === 'active' && (empty($access['expires_at']) || strtotime((string)$access['expires_at']) >= time());
}

function book_sales_latest_request(PDO $pdo, int $studentId, int $bookId): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM book_activation_requests WHERE student_id = ? AND book_id = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$studentId, $bookId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function book_sales_track(PDO $pdo, int $studentId, string $eventKey, string $eventValue = ''): void
{
    try {
        book_sales_ensure_schema($pdo);
        $stmt = $pdo->prepare("INSERT INTO student_marketing_events (student_id, event_key, event_value, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
        $stmt->execute([$studentId, $eventKey, $eventValue]);
    } catch (Throwable) {
    }
}

function book_sales_last_event_at(PDO $pdo, int $studentId, string $eventKey): ?int
{
    $stmt = $pdo->prepare("SELECT MAX(created_at) FROM student_marketing_events WHERE student_id = ? AND event_key = ?");
    $stmt->execute([$studentId, $eventKey]);
    $value = (string)($stmt->fetchColumn() ?: '');
    return $value !== '' ? strtotime($value) : null;
}

function book_sales_recent(PDO $pdo, int $studentId, string $eventKey, int $days): bool
{
    $last = book_sales_last_event_at($pdo, $studentId, $eventKey);
    return $last !== null && $last >= strtotime('-' . $days . ' days');
}

function book_sales_create_activation_request(PDO $pdo, int $studentId, int $bookId, int $packageId, array $data): int
{
    $package = book_sales_package($pdo, $bookId);
    if (!$package || (int)$package['id'] !== $packageId) {
        throw new RuntimeException('Package not found.');
    }
    $stmt = $pdo->prepare("
        INSERT INTO book_activation_requests
            (student_id, book_id, package_id, price, currency, payment_method, payment_reference, payment_proof_path, student_notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
    ");
    $stmt->execute([
        $studentId,
        $bookId,
        $packageId,
        (float)$package['price'],
        (string)$package['currency'],
        trim((string)($data['payment_method'] ?? '')),
        trim((string)($data['payment_reference'] ?? '')),
        trim((string)($data['payment_proof_path'] ?? '')),
        trim((string)($data['student_notes'] ?? '')),
    ]);
    $requestId = (int)$pdo->lastInsertId();
    book_sales_track($pdo, $studentId, 'book_activation_requested', (string)$requestId);
    platform_notify($pdo, [
        'target_role' => 'teacher',
        'user_id' => 0,
        'title' => 'New Book Activation Request',
        'message' => 'A student requested activation for Arabic for Daily Life.',
        'action_label' => 'Review Request',
        'action_url' => '/teacher-book-activation-requests.php',
        'related_entity_type' => 'book_activation_request',
        'related_entity_id' => $requestId,
        'priority' => 'high',
    ]);
    return $requestId;
}

function book_sales_approve_request(PDO $pdo, int $requestId, int $teacherId, string $adminNote = ''): void
{
    $stmt = $pdo->prepare("SELECT r.*, p.includes_teacher_feedback, p.includes_extra_review_session FROM book_activation_requests r JOIN book_packages p ON p.id = r.package_id WHERE r.id = ? LIMIT 1");
    $stmt->execute([$requestId]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$request) {
        throw new RuntimeException('Request not found.');
    }
    $pdo->prepare("
        INSERT INTO student_book_access
            (student_id, book_id, package_id, access_status, purchase_status, price_paid, currency, includes_teacher_feedback, includes_extra_review_session, extra_review_session_status, activated_at, activated_by, started_at, created_at)
        VALUES (?, ?, ?, 'active', 'paid', ?, ?, ?, ?, 'not_scheduled', NOW(), ?, NULL, NOW())
        ON DUPLICATE KEY UPDATE
            package_id = VALUES(package_id),
            access_status = 'active',
            purchase_status = 'paid',
            price_paid = VALUES(price_paid),
            currency = VALUES(currency),
            includes_teacher_feedback = VALUES(includes_teacher_feedback),
            includes_extra_review_session = VALUES(includes_extra_review_session),
            activated_at = NOW(),
            activated_by = VALUES(activated_by),
            updated_at = NOW()
    ")->execute([
        (int)$request['student_id'],
        (int)$request['book_id'],
        (int)$request['package_id'],
        (float)$request['price'],
        (string)$request['currency'],
        (int)$request['includes_teacher_feedback'],
        (int)$request['includes_extra_review_session'],
        $teacherId,
    ]);
    $pdo->prepare("UPDATE book_activation_requests SET status = 'approved', admin_note = ?, approved_at = NOW(), approved_by = ?, updated_at = NOW() WHERE id = ?")
        ->execute([$adminNote, $teacherId, $requestId]);
    platform_notify($pdo, [
        'target_role' => 'student',
        'user_id' => (int)$request['student_id'],
        'title' => 'Your interactive book is now active',
        'message' => 'تم تفعيل كتابك التفاعلي الآن.',
        'action_label' => 'Open Book',
        'action_url' => '/student-book-view.php?book_id=' . (int)$request['book_id'],
        'related_entity_type' => 'book',
        'related_entity_id' => (int)$request['book_id'],
        'priority' => 'high',
    ]);
}

function book_sales_update_request_status(PDO $pdo, int $requestId, string $status, string $adminNote, int $teacherId): void
{
    if (!in_array($status, ['rejected', 'needs_more_info'], true)) {
        throw new RuntimeException('Invalid status.');
    }
    $stmt = $pdo->prepare("SELECT * FROM book_activation_requests WHERE id = ? LIMIT 1");
    $stmt->execute([$requestId]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$request) {
        throw new RuntimeException('Request not found.');
    }
    $pdo->prepare("UPDATE book_activation_requests SET status = ?, admin_note = ?, approved_by = ?, updated_at = NOW() WHERE id = ?")
        ->execute([$status, $adminNote, $teacherId, $requestId]);
    platform_notify($pdo, [
        'target_role' => 'student',
        'user_id' => (int)$request['student_id'],
        'title' => $status === 'needs_more_info' ? 'Book activation needs more information' : 'Book activation request update',
        'message' => $adminNote !== '' ? $adminNote : 'Please contact the academy about your book activation request.',
        'action_label' => 'Open Request',
        'action_url' => '/student-book-checkout.php?book_id=' . (int)$request['book_id'],
        'related_entity_type' => 'book_activation_request',
        'related_entity_id' => $requestId,
        'priority' => 'normal',
    ]);
}

function book_sales_update_extra_review_status(PDO $pdo, int $accessId, string $status): void
{
    if (!in_array($status, ['not_scheduled', 'scheduled', 'completed', 'cancelled'], true)) {
        throw new RuntimeException('Invalid review session status.');
    }
    $pdo->prepare("UPDATE student_book_access SET extra_review_session_status = ?, updated_at = NOW() WHERE id = ?")
        ->execute([$status, $accessId]);
}
