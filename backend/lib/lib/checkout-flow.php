<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/settings.php';

if (!function_exists('checkout_ensure_tables')) {
    function checkout_ensure_tables(PDO $pdo): void
    {
        static $done = false;
        if ($done) {
            return;
        }

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS plans (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                plan_key VARCHAR(50) NOT NULL UNIQUE,
                title VARCHAR(160) NOT NULL,
                description TEXT NULL,
                amount_aed DECIMAL(10,2) NOT NULL DEFAULT 0,
                payment_url TEXT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                sort_order INT NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS checkout_orders (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                checkout_reference VARCHAR(100) NOT NULL UNIQUE,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                whatsapp VARCHAR(100) NOT NULL,
                selected_plan VARCHAR(50) NOT NULL,
                amount_aed DECIMAL(10,2) NOT NULL DEFAULT 0,
                student_age VARCHAR(50) NULL,
                learner_type VARCHAR(50) NOT NULL,
                main_goal VARCHAR(100) NOT NULL,
                preferred_contact_method VARCHAR(50) NOT NULL,
                policy_agreed TINYINT(1) NOT NULL DEFAULT 0,
                policy_agreed_at DATETIME NULL,
                payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
                payment_provider VARCHAR(50) NOT NULL DEFAULT 'ziina',
                payment_reference VARCHAR(255) NULL,
                student_form_status VARCHAR(50) NOT NULL DEFAULT 'not_started',
                level_check_status VARCHAR(50) NOT NULL DEFAULT 'not_started',
                schedule_status VARCHAR(50) NOT NULL DEFAULT 'not_selected',
                teacher_review_status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL DEFAULT NULL,
                KEY idx_checkout_status (payment_status),
                KEY idx_checkout_plan (selected_plan),
                KEY idx_checkout_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        checkout_add_column_if_missing($pdo, 'checkout_orders', 'student_form_status', "ALTER TABLE checkout_orders ADD COLUMN student_form_status VARCHAR(50) NOT NULL DEFAULT 'not_started' AFTER payment_reference");
        checkout_add_column_if_missing($pdo, 'checkout_orders', 'level_check_status', "ALTER TABLE checkout_orders ADD COLUMN level_check_status VARCHAR(50) NOT NULL DEFAULT 'not_started' AFTER student_form_status");
        checkout_add_column_if_missing($pdo, 'checkout_orders', 'schedule_status', "ALTER TABLE checkout_orders ADD COLUMN schedule_status VARCHAR(50) NOT NULL DEFAULT 'not_selected' AFTER level_check_status");
        checkout_add_column_if_missing($pdo, 'checkout_orders', 'teacher_review_status', "ALTER TABLE checkout_orders ADD COLUMN teacher_review_status VARCHAR(50) NOT NULL DEFAULT 'pending_review' AFTER schedule_status");
        checkout_add_column_if_missing($pdo, 'checkout_orders', 'approved_student_id', "ALTER TABLE checkout_orders ADD COLUMN approved_student_id INT UNSIGNED NULL AFTER teacher_review_status");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS payment_records (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                checkout_order_id INT UNSIGNED NOT NULL,
                checkout_reference VARCHAR(100) NOT NULL,
                provider VARCHAR(50) NOT NULL DEFAULT 'ziina',
                provider_reference VARCHAR(255) NULL,
                amount_aed DECIMAL(10,2) NOT NULL DEFAULT 0,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                raw_payload JSON NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL DEFAULT NULL,
                KEY idx_payment_order (checkout_order_id),
                KEY idx_payment_status (status),
                KEY idx_payment_ref (checkout_reference)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                actor_type VARCHAR(50) NOT NULL DEFAULT 'system',
                actor_id INT UNSIGNED NULL,
                action VARCHAR(120) NOT NULL,
                entity_type VARCHAR(80) NOT NULL,
                entity_id INT UNSIGNED NULL,
                old_value TEXT NULL,
                new_value TEXT NULL,
                ip_address VARCHAR(80) NULL,
                user_agent TEXT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_audit_entity (entity_type, entity_id),
                KEY idx_audit_action (action),
                KEY idx_audit_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS student_intake_forms (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                checkout_order_id INT UNSIGNED NOT NULL,
                checkout_reference VARCHAR(100) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                whatsapp VARCHAR(100) NOT NULL,
                selected_plan VARCHAR(50) NOT NULL,
                learner_type VARCHAR(50) NOT NULL,
                final_learner_type VARCHAR(50) NOT NULL,
                student_age VARCHAR(50) NULL,
                main_goal VARCHAR(100) NULL,
                preferred_contact_method VARCHAR(50) NULL,
                adult_age VARCHAR(50) NULL,
                adult_native_language VARCHAR(100) NULL,
                adult_current_level VARCHAR(100) NULL,
                adult_can_read VARCHAR(50) NULL,
                adult_can_write VARCHAR(50) NULL,
                adult_main_goal TEXT NULL,
                adult_learning_reason TEXT NULL,
                adult_use_context TEXT NULL,
                adult_preferred_arabic VARCHAR(100) NULL,
                adult_biggest_difficulty TEXT NULL,
                adult_difficulty_details TEXT NULL,
                adult_scheduling_preferences TEXT NULL,
                adult_tutor_notes TEXT NULL,
                parent_name VARCHAR(255) NULL,
                child_name VARCHAR(255) NULL,
                child_age VARCHAR(50) NULL,
                child_native_language VARCHAR(100) NULL,
                child_speaks_arabic VARCHAR(100) NULL,
                child_can_read VARCHAR(50) NULL,
                child_can_write VARCHAR(50) NULL,
                child_goal TEXT NULL,
                child_studied_before VARCHAR(50) NULL,
                child_struggles TEXT NULL,
                child_learning_style_notes TEXT NULL,
                child_scheduling_preferences TEXT NULL,
                child_tutor_notes TEXT NULL,
                form_status VARCHAR(50) NOT NULL DEFAULT 'submitted',
                teacher_review_status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL DEFAULT NULL,
                UNIQUE KEY uniq_intake_order (checkout_order_id),
                KEY idx_intake_ref (checkout_reference),
                KEY idx_intake_review (teacher_review_status),
                KEY idx_intake_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS email_logs (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                to_email VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                body TEXT NOT NULL,
                template_key VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'logged',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_email_template (template_key),
                KEY idx_email_status (status),
                KEY idx_email_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS level_check_attempts (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                student_intake_id INT UNSIGNED NOT NULL,
                checkout_order_id INT UNSIGNED NOT NULL,
                learner_type VARCHAR(50) NOT NULL,
                check_type VARCHAR(50) NOT NULL,
                auto_score DECIMAL(5,2) NOT NULL DEFAULT 0,
                manual_score DECIMAL(5,2) NOT NULL DEFAULT 0,
                final_score DECIMAL(5,2) NOT NULL DEFAULT 0,
                suggested_level VARCHAR(100) NULL,
                final_level VARCHAR(100) NULL,
                recommended_first_lesson VARCHAR(255) NULL,
                teacher_notes TEXT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'submitted',
                teacher_review_status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                reviewed_at DATETIME NULL,
                KEY idx_lc_intake (student_intake_id),
                KEY idx_lc_order (checkout_order_id),
                KEY idx_lc_review (teacher_review_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS level_check_answers (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                attempt_id INT UNSIGNED NOT NULL,
                section VARCHAR(100) NOT NULL,
                question_id VARCHAR(100) NOT NULL,
                question_text TEXT NOT NULL,
                answer_text TEXT NULL,
                correct_answer TEXT NULL,
                is_correct TINYINT(1) NULL,
                points DECIMAL(5,2) NOT NULL DEFAULT 0,
                max_points DECIMAL(5,2) NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_lc_answer_attempt (attempt_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS level_check_uploads (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                attempt_id INT UNSIGNED NOT NULL,
                upload_type VARCHAR(100) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                original_filename VARCHAR(255) NULL,
                mime_type VARCHAR(100) NULL,
                file_size INT UNSIGNED NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_lc_upload_attempt (attempt_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS scheduling_requests (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                checkout_order_id INT UNSIGNED NOT NULL,
                student_intake_id INT UNSIGNED NOT NULL,
                level_check_attempt_id INT UNSIGNED NULL,
                preferred_day_1 VARCHAR(50) NULL,
                preferred_day_2 VARCHAR(50) NULL,
                preferred_day_3 VARCHAR(50) NULL,
                preferred_time_range VARCHAR(100) NULL,
                timezone_country VARCHAR(100) NULL,
                notes TEXT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'requested',
                confirmed_date DATE NULL,
                confirmed_time TIME NULL,
                meeting_link VARCHAR(500) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NULL DEFAULT NULL,
                KEY idx_sched_order (checkout_order_id),
                KEY idx_sched_intake (student_intake_id),
                KEY idx_sched_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        checkout_seed_plans($pdo);
        $done = true;
    }
}

if (!function_exists('checkout_column_exists')) {
    function checkout_column_exists(PDO $pdo, string $table, string $column): bool
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
}

if (!function_exists('checkout_add_column_if_missing')) {
    function checkout_add_column_if_missing(PDO $pdo, string $table, string $column, string $sql): void
    {
        if (!checkout_column_exists($pdo, $table, $column)) {
            $pdo->exec($sql);
        }
    }
}

if (!function_exists('checkout_seed_plans')) {
    function checkout_seed_plans(PDO $pdo): void
    {
        $plans = [
            'single' => [
                'title' => 'Single Session',
                'description' => 'One 90-minute 1-on-1 Arabic lesson.',
                'amount' => 80,
                'sort' => 1,
            ],
            'monthly' => [
                'title' => 'Monthly Plan',
                'description' => '8 sessions, 12 hours total.',
                'amount' => 640,
                'sort' => 2,
            ],
            'bundle' => [
                'title' => '30-Hour Bundle',
                'description' => '20 sessions, 30 hours total.',
                'amount' => 1600,
                'sort' => 3,
            ],
        ];

        $stmt = $pdo->prepare("
            INSERT INTO plans (plan_key, title, description, amount_aed, payment_url, is_active, sort_order, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, NOW())
            ON DUPLICATE KEY UPDATE
                title = IF(title IS NULL OR title = '', VALUES(title), title),
                description = IF(description IS NULL OR description = '', VALUES(description), description),
                amount_aed = IF(amount_aed > 0, amount_aed, VALUES(amount_aed)),
                payment_url = IF(payment_url IS NULL OR payment_url = '', VALUES(payment_url), payment_url),
                sort_order = IF(sort_order > 0, sort_order, VALUES(sort_order)),
                updated_at = NOW()
        ");

        foreach ($plans as $key => $plan) {
            $paymentUrl = (string)get_setting('ziina_payment_url_' . $key, '');
            $stmt->execute([
                $key,
                $plan['title'],
                $plan['description'],
                $plan['amount'],
                $paymentUrl !== '' ? $paymentUrl : null,
                $plan['sort'],
            ]);
        }
    }
}

if (!function_exists('checkout_plan')) {
    function checkout_plan(PDO $pdo, string $planKey): ?array
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("SELECT * FROM plans WHERE plan_key = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$planKey]);
        $plan = $stmt->fetch();
        return $plan ?: null;
    }
}

if (!function_exists('checkout_valid_plans')) {
    function checkout_valid_plans(PDO $pdo): array
    {
        checkout_ensure_tables($pdo);
        return $pdo->query("SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order ASC, id ASC")->fetchAll() ?: [];
    }
}

if (!function_exists('checkout_all_plans')) {
    function checkout_all_plans(PDO $pdo): array
    {
        checkout_ensure_tables($pdo);
        return $pdo->query("SELECT * FROM plans ORDER BY sort_order ASC, id ASC")->fetchAll() ?: [];
    }
}

if (!function_exists('checkout_reference')) {
    function checkout_reference(): string
    {
        return 'HN-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(5)));
    }
}

if (!function_exists('checkout_audit')) {
    function checkout_audit(PDO $pdo, string $action, string $entityType, ?int $entityId, mixed $oldValue, mixed $newValue, string $actorType = 'system', ?int $actorId = null): void
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("
            INSERT INTO audit_logs
                (actor_type, actor_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $actorType,
            $actorId,
            $action,
            $entityType,
            $entityId,
            is_scalar($oldValue) || $oldValue === null ? (string)$oldValue : json_encode($oldValue, JSON_UNESCAPED_UNICODE),
            is_scalar($newValue) || $newValue === null ? (string)$newValue : json_encode($newValue, JSON_UNESCAPED_UNICODE),
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
        ]);
    }
}

if (!function_exists('checkout_find_order')) {
    function checkout_find_order(PDO $pdo, string $reference): ?array
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("SELECT * FROM checkout_orders WHERE checkout_reference = ? LIMIT 1");
        $stmt->execute([$reference]);
        $order = $stmt->fetch();
        return $order ?: null;
    }
}

if (!function_exists('checkout_find_order_by_id')) {
    function checkout_find_order_by_id(PDO $pdo, int $id): ?array
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("SELECT * FROM checkout_orders WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $order = $stmt->fetch();
        return $order ?: null;
    }
}

if (!function_exists('checkout_find_intake')) {
    function checkout_find_intake(PDO $pdo, int $id): ?array
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("SELECT * FROM student_intake_forms WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $intake = $stmt->fetch();
        return $intake ?: null;
    }
}

if (!function_exists('checkout_find_intake_by_order')) {
    function checkout_find_intake_by_order(PDO $pdo, int $orderId): ?array
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("SELECT * FROM student_intake_forms WHERE checkout_order_id = ? LIMIT 1");
        $stmt->execute([$orderId]);
        $intake = $stmt->fetch();
        return $intake ?: null;
    }
}

if (!function_exists('checkout_find_attempt')) {
    function checkout_find_attempt(PDO $pdo, int $id): ?array
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("SELECT * FROM level_check_attempts WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $attempt = $stmt->fetch();
        return $attempt ?: null;
    }
}

if (!function_exists('checkout_latest_attempt_for_intake')) {
    function checkout_latest_attempt_for_intake(PDO $pdo, int $intakeId): ?array
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("SELECT * FROM level_check_attempts WHERE student_intake_id = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([$intakeId]);
        $attempt = $stmt->fetch();
        return $attempt ?: null;
    }
}

if (!function_exists('checkout_log_email')) {
    function checkout_log_email(PDO $pdo, string $to, string $subject, string $body, string $templateKey): void
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("
            INSERT INTO email_logs (to_email, subject, body, template_key, status)
            VALUES (?, ?, ?, ?, 'logged')
        ");
        $stmt->execute([$to, $subject, $body, $templateKey]);
    }
}

if (!function_exists('checkout_create_order')) {
    function checkout_create_order(PDO $pdo, array $data, array $plan): array
    {
        checkout_ensure_tables($pdo);
        $reference = checkout_reference();

        $stmt = $pdo->prepare("
            INSERT INTO checkout_orders
                (checkout_reference, full_name, email, whatsapp, selected_plan, amount_aed,
                 student_age, learner_type, main_goal, preferred_contact_method,
                 policy_agreed, policy_agreed_at, payment_status, payment_provider, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), 'pending', 'ziina', NOW())
        ");
        $stmt->execute([
            $reference,
            $data['full_name'],
            $data['email'],
            $data['whatsapp'],
            $plan['plan_key'],
            $plan['amount_aed'],
            $data['student_age'],
            $data['learner_type'],
            $data['main_goal'],
            $data['preferred_contact_method'],
        ]);
        $orderId = (int)$pdo->lastInsertId();

        $payment = $pdo->prepare("
            INSERT INTO payment_records
                (checkout_order_id, checkout_reference, provider, amount_aed, status, updated_at)
            VALUES (?, ?, 'ziina', ?, 'pending', NOW())
        ");
        $payment->execute([$orderId, $reference, $plan['amount_aed']]);

        checkout_audit($pdo, 'checkout_created', 'checkout_order', $orderId, null, [
            'reference' => $reference,
            'payment_status' => 'pending',
        ]);

        $order = checkout_find_order($pdo, $reference);
        return $order ?: ['id' => $orderId, 'checkout_reference' => $reference];
    }
}

if (!function_exists('checkout_set_payment_status')) {
    function checkout_set_payment_status(PDO $pdo, int $orderId, string $status, string $actorType = 'system'): bool
    {
        checkout_ensure_tables($pdo);
        $allowed = ['pending', 'pending_verification', 'paid', 'failed', 'refunded'];
        if (!in_array($status, $allowed, true)) {
            return false;
        }

        $stmt = $pdo->prepare("SELECT * FROM checkout_orders WHERE id = ? LIMIT 1");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        if (!$order) {
            return false;
        }

        $old = (string)$order['payment_status'];
        if ($old === $status) {
            return true;
        }

        $pdo->prepare("UPDATE checkout_orders SET payment_status = ?, updated_at = NOW() WHERE id = ?")
            ->execute([$status, $orderId]);
        $pdo->prepare("UPDATE payment_records SET status = ?, updated_at = NOW() WHERE checkout_order_id = ?")
            ->execute([$status, $orderId]);

        checkout_audit($pdo, 'payment_status_changed', 'checkout_order', $orderId, $old, $status, $actorType);
        if ($status === 'paid') {
            $mediaLib = __DIR__ . '/media-buyer.php';
            if (is_file($mediaLib)) {
                require_once $mediaLib;
                if (function_exists('media_buyer_reconcile_order_commission')) {
                    media_buyer_reconcile_order_commission($pdo, $orderId);
                }
            }
        }
        return true;
    }
}

if (!function_exists('checkout_save_student_form')) {
    function checkout_save_student_form(PDO $pdo, array $order, array $data): int
    {
        checkout_ensure_tables($pdo);
        $orderId = (int)$order['id'];
        $existing = checkout_find_intake_by_order($pdo, $orderId);

        $fields = [
            'checkout_order_id', 'checkout_reference', 'full_name', 'email', 'whatsapp',
            'selected_plan', 'learner_type', 'final_learner_type', 'student_age',
            'main_goal', 'preferred_contact_method',
            'adult_age', 'adult_native_language', 'adult_current_level', 'adult_can_read',
            'adult_can_write', 'adult_main_goal', 'adult_learning_reason', 'adult_use_context',
            'adult_preferred_arabic', 'adult_biggest_difficulty', 'adult_difficulty_details',
            'adult_scheduling_preferences', 'adult_tutor_notes',
            'parent_name', 'child_name', 'child_age', 'child_native_language',
            'child_speaks_arabic', 'child_can_read', 'child_can_write', 'child_goal',
            'child_studied_before', 'child_struggles', 'child_learning_style_notes',
            'child_scheduling_preferences', 'child_tutor_notes',
        ];

        $row = [
            'checkout_order_id' => $orderId,
            'checkout_reference' => (string)$order['checkout_reference'],
            'full_name' => (string)$data['full_name'],
            'email' => (string)$data['email'],
            'whatsapp' => (string)$data['whatsapp'],
            'selected_plan' => (string)$order['selected_plan'],
            'learner_type' => (string)$order['learner_type'],
            'final_learner_type' => (string)$data['final_learner_type'],
            'student_age' => (string)($data['student_age'] ?? ''),
            'main_goal' => (string)($data['main_goal'] ?? ''),
            'preferred_contact_method' => (string)($data['preferred_contact_method'] ?? ''),
        ];

        foreach ($fields as $field) {
            if (!array_key_exists($field, $row)) {
                $row[$field] = trim((string)($data[$field] ?? ''));
            }
        }

        if ($existing) {
            $sets = [];
            $values = [];
            foreach ($fields as $field) {
                if ($field === 'checkout_order_id') {
                    continue;
                }
                $sets[] = $field . ' = ?';
                $values[] = $row[$field];
            }
            $sets[] = "form_status = 'submitted'";
            $sets[] = "teacher_review_status = 'pending_review'";
            $sets[] = "updated_at = NOW()";
            $values[] = (int)$existing['id'];
            $stmt = $pdo->prepare("UPDATE student_intake_forms SET " . implode(', ', $sets) . " WHERE id = ?");
            $stmt->execute($values);
            $intakeId = (int)$existing['id'];
        } else {
            $columns = implode(', ', $fields);
            $placeholders = implode(', ', array_fill(0, count($fields), '?'));
            $values = array_map(static fn(string $field) => $row[$field], $fields);
            $stmt = $pdo->prepare("INSERT INTO student_intake_forms ($columns, form_status, teacher_review_status, updated_at) VALUES ($placeholders, 'submitted', 'pending_review', NOW())");
            $stmt->execute($values);
            $intakeId = (int)$pdo->lastInsertId();
        }

        $pdo->prepare("
            UPDATE checkout_orders
            SET student_form_status = 'submitted',
                teacher_review_status = 'pending_review',
                updated_at = NOW()
            WHERE id = ?
        ")->execute([$orderId]);

        checkout_log_email(
            $pdo,
            (string)$data['email'],
            'Student Form Received - Habiba Nabil Arabic Academy',
            'The student form has been received and is waiting for onboarding review.',
            'student_form_received'
        );

        checkout_audit($pdo, 'student_form_submitted', 'checkout_order', $orderId, null, [
            'intake_id' => $intakeId,
            'final_learner_type' => $row['final_learner_type'],
        ]);

        return $intakeId;
    }
}

if (!function_exists('checkout_set_onboarding_review')) {
    function checkout_set_onboarding_review(PDO $pdo, int $orderId, string $status): bool
    {
        checkout_ensure_tables($pdo);
        $allowed = ['pending_review', 'approved', 'rejected'];
        if (!in_array($status, $allowed, true)) {
            return false;
        }

        $order = checkout_find_order_by_id($pdo, $orderId);
        if (!$order) {
            return false;
        }

        $old = (string)($order['teacher_review_status'] ?? 'pending_review');
        $pdo->prepare("UPDATE checkout_orders SET teacher_review_status = ?, updated_at = NOW() WHERE id = ?")
            ->execute([$status, $orderId]);
        $pdo->prepare("UPDATE student_intake_forms SET teacher_review_status = ?, updated_at = NOW() WHERE checkout_order_id = ?")
            ->execute([$status, $orderId]);

        if ($old !== $status) {
            checkout_audit($pdo, 'teacher_review_status_changed', 'checkout_order', $orderId, $old, $status, 'teacher');
        }
        return true;
    }
}

if (!function_exists('checkout_save_level_check')) {
    function checkout_save_level_check(PDO $pdo, array $intake, array $order, string $checkType, array $answers, array $result): int
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("
            INSERT INTO level_check_attempts
                (student_intake_id, checkout_order_id, learner_type, check_type, auto_score, final_score,
                 suggested_level, final_level, recommended_first_lesson, status, teacher_review_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'pending_review')
        ");
        $stmt->execute([
            (int)$intake['id'],
            (int)$order['id'],
            (string)$intake['final_learner_type'],
            $checkType,
            (float)$result['score'],
            (float)$result['score'],
            (string)$result['suggested_level'],
            (string)$result['suggested_level'],
            (string)$result['recommended_first_lesson'],
        ]);
        $attemptId = (int)$pdo->lastInsertId();

        $answerStmt = $pdo->prepare("
            INSERT INTO level_check_answers
                (attempt_id, section, question_id, question_text, answer_text, correct_answer, is_correct, points, max_points)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($answers as $answer) {
            $answerStmt->execute([
                $attemptId,
                (string)$answer['section'],
                (string)$answer['question_id'],
                (string)$answer['question_text'],
                (string)($answer['answer_text'] ?? ''),
                (string)($answer['correct_answer'] ?? ''),
                array_key_exists('is_correct', $answer) ? ((bool)$answer['is_correct'] ? 1 : 0) : null,
                (float)($answer['points'] ?? 0),
                (float)($answer['max_points'] ?? 0),
            ]);
        }

        $pdo->prepare("
            UPDATE checkout_orders
            SET level_check_status = 'submitted',
                teacher_review_status = 'pending_review',
                updated_at = NOW()
            WHERE id = ?
        ")->execute([(int)$order['id']]);

        checkout_audit($pdo, 'level_check_submitted', 'checkout_order', (int)$order['id'], null, [
            'attempt_id' => $attemptId,
            'score' => $result['score'],
            'suggested_level' => $result['suggested_level'],
        ]);

        checkout_log_email(
            $pdo,
            (string)$intake['email'],
            'Your Level Check Has Been Received',
            'Your Arabic level check was submitted successfully and is waiting for teacher review.',
            'level_check_received'
        );

        return $attemptId;
    }
}

if (!function_exists('checkout_save_level_upload')) {
    function checkout_save_level_upload(PDO $pdo, int $attemptId, string $uploadType, array $file, array $allowedMimes, int $maxBytes): void
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            return;
        }
        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Upload failed.');
        }
        if ((int)$file['size'] > $maxBytes) {
            throw new RuntimeException('Uploaded file is too large.');
        }
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = (string)finfo_file($finfo, (string)$file['tmp_name']);
        finfo_close($finfo);
        if (!in_array($mime, $allowedMimes, true)) {
            throw new RuntimeException('Invalid upload type.');
        }
        $ext = match ($mime) {
            'audio/mpeg' => 'mp3',
            'audio/wav', 'audio/x-wav' => 'wav',
            'audio/mp4', 'audio/x-m4a' => 'm4a',
            'audio/webm', 'video/webm' => 'webm',
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'application/pdf' => 'pdf',
            default => 'bin',
        };
        $baseDir = dirname(__DIR__) . '/uploads/level-check/' . $uploadType;
        if (!is_dir($baseDir)) {
            mkdir($baseDir, 0755, true);
        }
        $name = 'lc_' . $attemptId . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $dest = $baseDir . '/' . $name;
        if (!move_uploaded_file((string)$file['tmp_name'], $dest)) {
            throw new RuntimeException('Could not save upload.');
        }
        $path = 'uploads/level-check/' . $uploadType . '/' . $name;
        $stmt = $pdo->prepare("
            INSERT INTO level_check_uploads
                (attempt_id, upload_type, file_path, original_filename, mime_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $attemptId,
            $uploadType,
            $path,
            (string)($file['name'] ?? ''),
            $mime,
            (int)$file['size'],
        ]);
    }
}

if (!function_exists('checkout_save_schedule_request')) {
    function checkout_save_schedule_request(PDO $pdo, array $attempt, array $data): int
    {
        checkout_ensure_tables($pdo);
        $stmt = $pdo->prepare("
            INSERT INTO scheduling_requests
                (checkout_order_id, student_intake_id, level_check_attempt_id, preferred_day_1,
                 preferred_day_2, preferred_day_3, preferred_time_range, timezone_country, notes, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested', NOW())
        ");
        $stmt->execute([
            (int)$attempt['checkout_order_id'],
            (int)$attempt['student_intake_id'],
            (int)$attempt['id'],
            trim((string)($data['preferred_day_1'] ?? '')),
            trim((string)($data['preferred_day_2'] ?? '')),
            trim((string)($data['preferred_day_3'] ?? '')),
            trim((string)($data['preferred_time_range'] ?? '')),
            trim((string)($data['timezone_country'] ?? '')),
            trim((string)($data['notes'] ?? '')),
        ]);
        $requestId = (int)$pdo->lastInsertId();
        $pdo->prepare("UPDATE checkout_orders SET schedule_status = 'requested', updated_at = NOW() WHERE id = ?")
            ->execute([(int)$attempt['checkout_order_id']]);
        checkout_audit($pdo, 'schedule_requested', 'checkout_order', (int)$attempt['checkout_order_id'], null, [
            'request_id' => $requestId,
        ]);
        return $requestId;
    }
}

if (!function_exists('checkout_update_level_review')) {
    function checkout_update_level_review(PDO $pdo, int $attemptId, string $finalLevel, string $lesson, string $notes, float $manualScore): bool
    {
        checkout_ensure_tables($pdo);
        $attempt = checkout_find_attempt($pdo, $attemptId);
        if (!$attempt) {
            return false;
        }
        $pdo->prepare("
            UPDATE level_check_attempts
            SET final_level = ?,
                recommended_first_lesson = ?,
                teacher_notes = ?,
                manual_score = ?,
                teacher_review_status = 'reviewed',
                reviewed_at = NOW()
            WHERE id = ?
        ")->execute([$finalLevel, $lesson, $notes, $manualScore, $attemptId]);
        $pdo->prepare("UPDATE checkout_orders SET level_check_status = 'reviewed', updated_at = NOW() WHERE id = ?")
            ->execute([(int)$attempt['checkout_order_id']]);
        checkout_audit($pdo, 'level_check_reviewed', 'checkout_order', (int)$attempt['checkout_order_id'], null, [
            'attempt_id' => $attemptId,
            'final_level' => $finalLevel,
        ], 'teacher');
        return true;
    }
}

if (!function_exists('checkout_student_table_columns')) {
    function checkout_student_table_columns(PDO $pdo): array
    {
        $stmt = $pdo->query("SHOW COLUMNS FROM students");
        return $stmt ? $stmt->fetchAll(PDO::FETCH_COLUMN) : [];
    }
}

if (!function_exists('checkout_generate_student_code')) {
    function checkout_generate_student_code(PDO $pdo): string
    {
        for ($i = 0; $i < 50; $i++) {
            $letters = strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ'), 0, 2));
            $digits = str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            $code = $letters . '-' . $digits;
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE login_code = ?");
            $stmt->execute([$code]);
            if ((int)$stmt->fetchColumn() === 0) {
                return $code;
            }
        }
        return 'HN-' . strtoupper(bin2hex(random_bytes(3)));
    }
}

if (!function_exists('checkout_create_student_from_intake')) {
    function checkout_create_student_from_intake(PDO $pdo, array $intake, array $order, ?array $attempt = null): array
    {
        checkout_ensure_tables($pdo);
        if (!empty($order['approved_student_id'])) {
            $stmt = $pdo->prepare("SELECT id, login_code FROM students WHERE id = ? LIMIT 1");
            $stmt->execute([(int)$order['approved_student_id']]);
            $existing = $stmt->fetch();
            if ($existing) {
                return ['student_id' => (int)$existing['id'], 'login_code' => (string)$existing['login_code'], 'created' => false];
            }
        }

        $columns = checkout_student_table_columns($pdo);
        $loginCode = checkout_generate_student_code($pdo);
        $name = (string)($intake['final_learner_type'] === 'child' && $intake['child_name'] ? $intake['child_name'] : $intake['full_name']);
        $level = $attempt && !empty($attempt['final_level']) ? (string)$attempt['final_level'] : 'A1';
        if (str_starts_with($level, 'Literacy Level')) {
            $level = 'A1';
        }
        $notes = "Created from checkout reference: {$order['checkout_reference']}\n";
        if ($attempt) {
            $notes .= "Suggested level: " . (string)$attempt['suggested_level'] . "\n";
            $notes .= "First lesson: " . (string)$attempt['recommended_first_lesson'] . "\n";
            if (!empty($attempt['teacher_notes'])) {
                $notes .= "Teacher notes: " . (string)$attempt['teacher_notes'] . "\n";
            }
        }

        $data = [
            'full_name' => $name,
            'login_code' => $loginCode,
            'level' => $level,
            'notes' => trim($notes),
            'email' => (string)$intake['email'],
            'whatsapp' => (string)$intake['whatsapp'],
            'is_active' => 1,
            'created_at' => date('Y-m-d H:i:s'),
        ];
        $insert = array_intersect_key($data, array_flip($columns));
        $keys = array_keys($insert);
        $stmt = $pdo->prepare("INSERT INTO students (" . implode(', ', $keys) . ") VALUES (" . implode(', ', array_fill(0, count($keys), '?')) . ")");
        $stmt->execute(array_values($insert));
        $studentId = (int)$pdo->lastInsertId();

        $pdo->prepare("
            UPDATE checkout_orders
            SET approved_student_id = ?,
                teacher_review_status = 'approved',
                updated_at = NOW()
            WHERE id = ?
        ")->execute([$studentId, (int)$order['id']]);
        $pdo->prepare("UPDATE student_intake_forms SET teacher_review_status = 'approved', updated_at = NOW() WHERE id = ?")
            ->execute([(int)$intake['id']]);

        checkout_log_email(
            $pdo,
            (string)$intake['email'],
            'Your Student Login Details',
            "Your student account is ready.\nLogin code: {$loginCode}",
            'student_login_created'
        );
        checkout_audit($pdo, 'student_account_created', 'checkout_order', (int)$order['id'], null, [
            'student_id' => $studentId,
            'login_code' => $loginCode,
        ], 'teacher');

        return ['student_id' => $studentId, 'login_code' => $loginCode, 'created' => true];
    }
}

if (!function_exists('checkout_payment_url')) {
    function checkout_payment_url(array $plan, array $order): string
    {
        $url = trim((string)($plan['payment_url'] ?? ''));
        if ($url === '') {
            $url = trim((string)get_setting('ziina_payment_url_' . $plan['plan_key'], ''));
        }
        if ($url === '') {
            return '';
        }

        $separator = str_contains($url, '?') ? '&' : '?';
        return $url . $separator . 'ref=' . rawurlencode((string)$order['checkout_reference']);
    }
}
