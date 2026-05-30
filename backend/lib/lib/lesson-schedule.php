<?php
declare(strict_types=1);

function lesson_column_exists(PDO $pdo, string $table, string $column): bool
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

function ensure_lesson_schedule_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_contracts (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id INT UNSIGNED NOT NULL,
            total_hours DECIMAL(6,1) NOT NULL DEFAULT 0,
            session_duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 90,
            start_date DATE NOT NULL,
            notes TEXT NOT NULL DEFAULT '',
            package_name VARCHAR(120) NOT NULL DEFAULT '',
            default_price_aed DECIMAL(10,2) NOT NULL DEFAULT 120,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uq_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $contractColumns = [
        'package_name' => "ALTER TABLE student_contracts ADD COLUMN package_name VARCHAR(120) NOT NULL DEFAULT ''",
        'default_price_aed' => "ALTER TABLE student_contracts ADD COLUMN default_price_aed DECIMAL(10,2) NOT NULL DEFAULT 120",
        'updated_at' => "ALTER TABLE student_contracts ADD COLUMN updated_at DATETIME NULL DEFAULT NULL",
    ];
    foreach ($contractColumns as $column => $sql) {
        if (!lesson_column_exists($pdo, 'student_contracts', $column)) {
            $pdo->exec($sql);
        }
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lesson_plan_sessions (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            contract_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            session_number SMALLINT UNSIGNED NOT NULL,
            title VARCHAR(300) NOT NULL DEFAULT '',
            planned_date DATE NULL,
            session_time TIME NULL,
            planned_time TIME NULL,
            duration_minutes INT NOT NULL DEFAULT 90,
            actual_date DATE NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'planned',
            skills VARCHAR(500) NOT NULL DEFAULT '',
            goals TEXT NOT NULL DEFAULT '',
            teacher_notes TEXT NOT NULL DEFAULT '',
            attendance_note TEXT NOT NULL DEFAULT '',
            price DECIMAL(10,2) NOT NULL DEFAULT 120,
            subject VARCHAR(120) NOT NULL DEFAULT 'Arabic',
            is_paid TINYINT(1) NOT NULL DEFAULT 0,
            is_milestone TINYINT(1) NOT NULL DEFAULT 0,
            milestone_label VARCHAR(100) NOT NULL DEFAULT '',
            generated_from_schedule TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            KEY idx_contract (contract_id),
            KEY idx_student (student_id),
            KEY idx_student_date_time (student_id, planned_date, session_time),
            KEY idx_date_time (planned_date, session_time)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $sessionColumns = [
        'planned_time' => "ALTER TABLE lesson_plan_sessions ADD COLUMN planned_time TIME NULL DEFAULT NULL",
        'duration_minutes' => "ALTER TABLE lesson_plan_sessions ADD COLUMN duration_minutes INT NOT NULL DEFAULT 90",
        'attendance_note' => "ALTER TABLE lesson_plan_sessions ADD COLUMN attendance_note TEXT NOT NULL DEFAULT ''",
        'price' => "ALTER TABLE lesson_plan_sessions ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 120",
        'subject' => "ALTER TABLE lesson_plan_sessions ADD COLUMN subject VARCHAR(120) NOT NULL DEFAULT 'Arabic'",
        'is_paid' => "ALTER TABLE lesson_plan_sessions ADD COLUMN is_paid TINYINT(1) NOT NULL DEFAULT 0",
        'is_milestone' => "ALTER TABLE lesson_plan_sessions ADD COLUMN is_milestone TINYINT(1) NOT NULL DEFAULT 0",
        'milestone_label' => "ALTER TABLE lesson_plan_sessions ADD COLUMN milestone_label VARCHAR(100) NOT NULL DEFAULT ''",
        'generated_from_schedule' => "ALTER TABLE lesson_plan_sessions ADD COLUMN generated_from_schedule TINYINT(1) NOT NULL DEFAULT 0",
        'updated_at' => "ALTER TABLE lesson_plan_sessions ADD COLUMN updated_at DATETIME NULL DEFAULT NULL",
    ];
    foreach ($sessionColumns as $column => $sql) {
        if (!lesson_column_exists($pdo, 'lesson_plan_sessions', $column)) {
            $pdo->exec($sql);
        }
    }

    $pdo->exec("ALTER TABLE lesson_plan_sessions MODIFY status VARCHAR(30) NOT NULL DEFAULT 'planned'");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_mobile_schedule (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id INT UNSIGNED NOT NULL,
            day_of_week TINYINT UNSIGNED NOT NULL,
            session_time TIME NOT NULL,
            duration_minutes INT NOT NULL DEFAULT 60,
            price_override DECIMAL(10,2) NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uniq_student_day (student_id, day_of_week),
            KEY idx_student_mobile_schedule_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $done = true;
}

function lesson_allowed_statuses(): array
{
    return ['planned', 'completed', 'skipped', 'rescheduled', 'absent', 'cancelled'];
}

function lesson_skill_key(string $skill): string
{
    $raw = trim($skill);
    $raw = preg_replace('/[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]/u', '', $raw) ?? $raw;
    $raw = trim($raw);
    $lower = mb_strtolower($raw, 'UTF-8');

    $map = [
        'vocabulary' => 'vocabulary',
        'reading' => 'reading',
        'speaking' => 'speaking',
        'pronunciation' => 'pronunciation',
        'revision' => 'revision',
        'listening' => 'listening',
        'grammar' => 'grammar',
        'writing' => 'writing',
        'مفردات' => 'vocabulary',
        'قراءة' => 'reading',
        'تحدث' => 'speaking',
        'محادثة' => 'speaking',
        'نطق' => 'pronunciation',
        'مراجعة' => 'revision',
        'استماع' => 'listening',
        'قواعد' => 'grammar',
        'كتابة' => 'writing',
    ];

    return $map[$lower] ?? preg_replace('/[^a-z0-9_]+/', '_', $lower) ?: '';
}

function lesson_normalize_skills_csv(string $skills): string
{
    $out = [];
    foreach (explode(',', $skills) as $skill) {
        $key = lesson_skill_key($skill);
        if ($key !== '' && !in_array($key, $out, true)) {
            $out[] = $key;
        }
    }
    return implode(',', $out);
}

function lesson_package_balances(PDO $pdo, array $studentIds): array
{
    ensure_lesson_schedule_schema($pdo);

    $studentIds = array_values(array_unique(array_map('intval', $studentIds)));
    $studentIds = array_values(array_filter($studentIds, static fn(int $id): bool => $id > 0));
    if (!$studentIds) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
    $stmt = $pdo->prepare("
        SELECT
            st.id AS student_id,
            c.package_name,
            c.total_hours,
            c.session_duration_minutes,
            c.default_price_aed,
            COUNT(s.id) AS total_slots,
            SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completed_sessions,
            SUM(CASE WHEN s.status = 'planned' THEN 1 ELSE 0 END) AS planned_sessions,
            SUM(CASE WHEN s.status = 'rescheduled' THEN 1 ELSE 0 END) AS rescheduled_sessions,
            SUM(CASE WHEN s.status = 'skipped' THEN 1 ELSE 0 END) AS skipped_sessions,
            SUM(CASE WHEN s.status = 'absent' THEN 1 ELSE 0 END) AS absent_sessions,
            SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_sessions,
            SUM(CASE
                WHEN s.status IN ('completed','absent') THEN COALESCE(NULLIF(s.price, 0), c.default_price_aed, 120)
                ELSE 0
            END) AS income_total
        FROM students st
        LEFT JOIN student_contracts c ON c.student_id = st.id
        LEFT JOIN lesson_plan_sessions s ON s.student_id = st.id
        WHERE st.id IN ($placeholders)
        GROUP BY
            st.id,
            c.id,
            c.package_name,
            c.total_hours,
            c.session_duration_minutes,
            c.default_price_aed
    ");
    $stmt->execute($studentIds);

    $out = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $duration = (int)($row['session_duration_minutes'] ?: 90);
        $contractHours = (float)($row['total_hours'] ?: 0);
        $contractSessions = $contractHours > 0 && $duration > 0
            ? (int)round($contractHours / ($duration / 60))
            : (int)($row['total_slots'] ?: 0);

        $completed = (int)($row['completed_sessions'] ?: 0);
        $skipped = (int)($row['skipped_sessions'] ?: 0);
        $absent = (int)($row['absent_sessions'] ?: 0);
        $cancelled = (int)($row['cancelled_sessions'] ?: 0);
        $used = $completed + $skipped + $absent;
        $remaining = max(0, $contractSessions - $used);

        $out[(int)$row['student_id']] = [
            'package_name' => (string)($row['package_name'] ?: 'Manual'),
            'contract_sessions' => $contractSessions,
            'completed_sessions' => $completed,
            'planned_sessions' => (int)($row['planned_sessions'] ?: 0),
            'rescheduled_sessions' => (int)($row['rescheduled_sessions'] ?: 0),
            'skipped_sessions' => $skipped,
            'absent_sessions' => $absent,
            'cancelled_sessions' => $cancelled,
            'used_sessions' => $used,
            'remaining_sessions' => $remaining,
            'income_total' => round((float)($row['income_total'] ?: 0), 2),
            'default_price_aed' => round((float)($row['default_price_aed'] ?: 120), 2),
        ];
    }

    return $out;
}

function lesson_schedule_day_index(DateTimeImmutable $date): int
{
    return ((int)$date->format('w') + 1) % 7;
}

function lesson_ensure_contract(PDO $pdo, int $studentId, int $durationMinutes, float $price): int
{
    $stmt = $pdo->prepare("SELECT id FROM student_contracts WHERE student_id = ? LIMIT 1");
    $stmt->execute([$studentId]);
    $id = (int)($stmt->fetchColumn() ?: 0);
    if ($id > 0) {
        return $id;
    }

    $pdo->prepare("
        INSERT INTO student_contracts
            (student_id, total_hours, session_duration_minutes, start_date, notes, package_name, default_price_aed, updated_at)
        VALUES (?, 0, ?, ?, '', 'Manual schedule', ?, NOW())
    ")->execute([$studentId, $durationMinutes, date('Y-m-d'), $price]);

    return (int)$pdo->lastInsertId();
}

function generate_monthly_sessions_from_schedule(PDO $pdo, int $studentId, string $month): array
{
    ensure_lesson_schedule_schema($pdo);

    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        throw new InvalidArgumentException('Invalid month');
    }

    $scheduleStmt = $pdo->prepare("
        SELECT day_of_week, session_time, duration_minutes, price_override
        FROM student_mobile_schedule
        WHERE student_id = ? AND is_active = 1
        ORDER BY day_of_week ASC, session_time ASC
    ");
    $scheduleStmt->execute([$studentId]);
    $scheduleRows = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$scheduleRows) {
        return [
            'created' => 0,
            'updated' => 0,
            'skipped_duplicates' => 0,
            'skipped_conflicts' => 0,
            'message' => 'No active weekly schedule found.',
        ];
    }

    $scheduleByDay = [];
    foreach ($scheduleRows as $row) {
        $scheduleByDay[(int)$row['day_of_week']][] = $row;
    }

    $start = new DateTimeImmutable($month . '-01');
    $end = $start->modify('first day of next month');

    $contractId = lesson_ensure_contract(
        $pdo,
        $studentId,
        (int)$scheduleRows[0]['duration_minutes'],
        (float)($scheduleRows[0]['price_override'] ?: 120)
    );

    $maxStmt = $pdo->prepare("SELECT COALESCE(MAX(session_number), 0) FROM lesson_plan_sessions WHERE student_id = ?");
    $maxStmt->execute([$studentId]);
    $nextNumber = (int)$maxStmt->fetchColumn() + 1;

    $emptyStmt = $pdo->prepare("
        SELECT id, session_number
        FROM lesson_plan_sessions
        WHERE student_id = ?
          AND status = 'planned'
          AND (planned_date IS NULL OR planned_date = '0000-00-00')
        ORDER BY session_number ASC
    ");
    $emptyStmt->execute([$studentId]);
    $emptySlots = $emptyStmt->fetchAll(PDO::FETCH_ASSOC);
    $emptyIndex = 0;

    $dupStmt = $pdo->prepare("
        SELECT id
        FROM lesson_plan_sessions
        WHERE student_id = ?
          AND planned_date = ?
          AND COALESCE(session_time, planned_time) = ?
        LIMIT 1
    ");
    $conflictStmt = $pdo->prepare("
        SELECT id, student_id
        FROM lesson_plan_sessions
        WHERE student_id <> ?
          AND planned_date = ?
          AND COALESCE(session_time, planned_time) = ?
          AND status IN ('planned','completed','rescheduled')
        LIMIT 1
    ");
    $updateStmt = $pdo->prepare("
        UPDATE lesson_plan_sessions
        SET planned_date = ?, session_time = ?, planned_time = ?, duration_minutes = ?,
            price = ?, subject = 'Arabic', generated_from_schedule = 1, updated_at = NOW()
        WHERE id = ?
    ");
    $insertStmt = $pdo->prepare("
        INSERT INTO lesson_plan_sessions
            (contract_id, student_id, session_number, title, planned_date, session_time, planned_time,
             duration_minutes, status, price, subject, is_paid, generated_from_schedule, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'planned', ?, 'Arabic', 0, 1, NOW())
    ");

    $created = 0;
    $updated = 0;
    $skippedDuplicates = 0;
    $skippedConflicts = 0;

    for ($date = $start; $date < $end; $date = $date->modify('+1 day')) {
        $dayIndex = lesson_schedule_day_index($date);
        foreach ($scheduleByDay[$dayIndex] ?? [] as $schedule) {
            $plannedDate = $date->format('Y-m-d');
            $time = substr((string)$schedule['session_time'], 0, 5) . ':00';
            $duration = (int)$schedule['duration_minutes'];
            $price = (float)($schedule['price_override'] ?: 120);

            $dupStmt->execute([$studentId, $plannedDate, $time]);
            if ($dupStmt->fetchColumn()) {
                $skippedDuplicates++;
                continue;
            }

            $conflictStmt->execute([$studentId, $plannedDate, $time]);
            if ($conflictStmt->fetchColumn()) {
                $skippedConflicts++;
                continue;
            }

            if (isset($emptySlots[$emptyIndex])) {
                $slot = $emptySlots[$emptyIndex++];
                $updateStmt->execute([$plannedDate, $time, $time, $duration, $price, (int)$slot['id']]);
                $updated++;
                continue;
            }

            $insertStmt->execute([
                $contractId,
                $studentId,
                $nextNumber++,
                'Arabic Session',
                $plannedDate,
                $time,
                $time,
                $duration,
                $price,
            ]);
            $created++;
        }
    }

    return [
        'created' => $created,
        'updated' => $updated,
        'skipped_duplicates' => $skippedDuplicates,
        'skipped_conflicts' => $skippedConflicts,
        'message' => 'Monthly sessions generated.',
    ];
}
