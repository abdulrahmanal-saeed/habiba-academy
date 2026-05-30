<?php
declare(strict_types=1);

function portals_ensure_schema(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS portal_accounts (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            role_key VARCHAR(50) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NULL,
            whatsapp VARCHAR(100) NULL,
            password_hash VARCHAR(255) NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            notes TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            KEY idx_role_status (role_key, status),
            KEY idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS academies (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            contact_name VARCHAR(255) NULL,
            email VARCHAR(255) NULL,
            whatsapp VARCHAR(100) NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            notes TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            access_code VARCHAR(40) NULL,
            KEY idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS academy_students (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            academy_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            notes TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_academy_student (academy_id, student_id),
            KEY idx_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS parent_contacts (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NULL,
            whatsapp VARCHAR(100) NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            notes TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            access_code VARCHAR(40) NULL,
            KEY idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS parent_students (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            parent_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            relationship VARCHAR(80) NULL,
            is_primary TINYINT(1) NOT NULL DEFAULT 1,
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_parent_student (parent_id, student_id),
            KEY idx_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS media_buyers (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NULL,
            whatsapp VARCHAR(100) NULL,
            commission_rate DECIMAL(5,2) NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            notes TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            access_code VARCHAR(40) NULL,
            KEY idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    portals_add_column_if_missing($pdo, 'academies', 'access_code', "VARCHAR(40) NULL");
    portals_add_column_if_missing($pdo, 'parent_contacts', 'access_code', "VARCHAR(40) NULL");
    portals_add_column_if_missing($pdo, 'media_buyers', 'access_code', "VARCHAR(40) NULL");
}

function portals_add_column_if_missing(PDO $pdo, string $table, string $column, string $definition): void
{
    $stmt = $pdo->query("SHOW COLUMNS FROM `{$table}` LIKE " . $pdo->quote($column));
    if (!$stmt->fetchColumn()) {
        $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}");
    }
}

function portals_generate_access_code(string $prefix): string
{
    return strtoupper($prefix) . '-' . random_int(100000, 999999);
}

function portals_normalize_login(string $value): string
{
    $value = trim(mb_strtolower($value));
    return preg_replace('/\s+/', '', $value) ?: '';
}

function portals_students(PDO $pdo): array
{
    return $pdo->query("
        SELECT id, full_name, login_code, is_active
        FROM students
        ORDER BY is_active DESC, full_name ASC
    ")->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function portals_badge(string $status): string
{
    return match ($status) {
        'active' => 'badge-success',
        'paused' => 'badge-warning',
        'inactive' => 'badge-muted',
        default => 'badge-muted',
    };
}

function portals_status_options(string $selected): string
{
    $html = '';
    foreach (['active', 'paused', 'inactive'] as $status) {
        $html .= '<option value="' . h($status) . '"' . ($selected === $status ? ' selected' : '') . '>' . h(ucfirst($status)) . '</option>';
    }
    return $html;
}

function portals_selected_student_ids(array $input): array
{
    $ids = array_map('intval', (array)($input['student_ids'] ?? []));
    $ids = array_values(array_unique(array_filter($ids, static fn(int $id): bool => $id > 0)));
    return $ids;
}

function portals_sync_links(PDO $pdo, string $table, string $ownerColumn, int $ownerId, array $studentIds): void
{
    $pdo->prepare("DELETE FROM {$table} WHERE {$ownerColumn} = ?")->execute([$ownerId]);
    if (!$studentIds) {
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO {$table} ({$ownerColumn}, student_id, status, created_at)
        VALUES (?, ?, 'active', NOW())
        ON DUPLICATE KEY UPDATE status = 'active'
    ");
    foreach ($studentIds as $studentId) {
        $stmt->execute([$ownerId, $studentId]);
    }
}
