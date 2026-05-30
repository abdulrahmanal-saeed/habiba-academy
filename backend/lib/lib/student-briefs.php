<?php
declare(strict_types=1);

function ensure_student_brief_tables(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_briefs (
            id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id              INT UNSIGNED NULL,
            conversion_status       ENUM('pending','converted') NOT NULL DEFAULT 'pending',
            converted_at            DATETIME NULL,
            student_name            VARCHAR(190) NOT NULL,
            source_name             VARCHAR(190) NULL,
            source_email            VARCHAR(190) NULL,
            nationality             VARCHAR(120) NOT NULL,
            contracted_hours        VARCHAR(80) NOT NULL,
            native_language         VARCHAR(120) NOT NULL,
            studied_arabic_before   ENUM('yes','no') NOT NULL DEFAULT 'no',
            learning_reason         TEXT NOT NULL,
            main_goal               TEXT NOT NULL,
            target_duration         VARCHAR(190) NOT NULL,
            additional_notes        TEXT NULL,
            submitted_by_role       ENUM('academy','teacher','student') NOT NULL DEFAULT 'academy',
            created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_student_created (student_id, created_at),
            KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    try {
        $pdo->exec("ALTER TABLE student_briefs ADD COLUMN conversion_status ENUM('pending','converted') NOT NULL DEFAULT 'pending' AFTER student_id");
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec("ALTER TABLE student_briefs ADD COLUMN converted_at DATETIME NULL AFTER conversion_status");
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec("ALTER TABLE student_briefs ADD COLUMN source_name VARCHAR(190) NULL AFTER student_name");
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec("ALTER TABLE student_briefs ADD COLUMN source_email VARCHAR(190) NULL AFTER source_name");
    } catch (Throwable $e) {
    }
    try {
        $pdo->exec("ALTER TABLE student_briefs MODIFY submitted_by_role ENUM('academy','teacher','student') NOT NULL DEFAULT 'academy'");
    } catch (Throwable $e) {
    }
    foreach ([
        'academy_id' => "ALTER TABLE student_briefs ADD COLUMN academy_id INT UNSIGNED NULL AFTER id",
        'brief_status' => "ALTER TABLE student_briefs ADD COLUMN brief_status VARCHAR(40) NOT NULL DEFAULT 'submitted' AFTER conversion_status",
        'owner_notes' => "ALTER TABLE student_briefs ADD COLUMN owner_notes TEXT NULL AFTER additional_notes",
        'age' => "ALTER TABLE student_briefs ADD COLUMN age VARCHAR(40) NULL AFTER student_name",
        'speaking_ability' => "ALTER TABLE student_briefs ADD COLUMN speaking_ability TEXT NULL AFTER main_goal",
        'reading_writing_ability' => "ALTER TABLE student_briefs ADD COLUMN reading_writing_ability TEXT NULL AFTER speaking_ability",
        'parent_contact_info' => "ALTER TABLE student_briefs ADD COLUMN parent_contact_info TEXT NULL AFTER reading_writing_ability",
        'preferred_schedule' => "ALTER TABLE student_briefs ADD COLUMN preferred_schedule TEXT NULL AFTER parent_contact_info",
    ] as $sql) {
        try { $pdo->exec($sql); } catch (Throwable $e) {}
    }

    $done = true;
}

function student_brief_validate(array $input, string $role = 'academy'): array
{
    $data = [
        'student_name' => trim((string)($input['student_name'] ?? '')),
        'source_name' => trim((string)($input['source_name'] ?? '')),
        'source_email' => trim((string)($input['source_email'] ?? '')),
        'nationality' => trim((string)($input['nationality'] ?? '')),
        'contracted_hours' => trim((string)($input['contracted_hours'] ?? '')),
        'native_language' => trim((string)($input['native_language'] ?? '')),
        'studied_arabic_before' => strtolower(trim((string)($input['studied_arabic_before'] ?? ''))),
        'learning_reason' => trim((string)($input['learning_reason'] ?? '')),
        'main_goal' => trim((string)($input['main_goal'] ?? '')),
        'target_duration' => trim((string)($input['target_duration'] ?? '')),
        'additional_notes' => trim((string)($input['additional_notes'] ?? '')),
    ];

    $errors = [];
    foreach ([
        'student_name' => 'Student name is required.',
        'nationality' => 'Nationality is required.',
        'contracted_hours' => 'Contracted hours is required.',
        'native_language' => 'Native language is required.',
        'learning_reason' => 'Reason for learning Arabic is required.',
        'main_goal' => 'Main goal is required.',
        'target_duration' => 'Target duration is required.',
    ] as $field => $message) {
        if ($data[$field] === '') {
            $errors[$field] = $message;
        }
    }

    if ($role === 'academy' && $data['source_name'] === '') {
        $errors['source_name'] = 'Academy name is required.';
    }

    if (!in_array($data['studied_arabic_before'], ['yes', 'no'], true)) {
        $errors['studied_arabic_before'] = 'Please choose yes or no.';
    }

    if ($data['source_email'] !== '' && !filter_var($data['source_email'], FILTER_VALIDATE_EMAIL)) {
        $errors['source_email'] = 'Please enter a valid email address.';
    }

    foreach (['student_name' => 190, 'source_name' => 190, 'source_email' => 190, 'nationality' => 120, 'contracted_hours' => 80, 'native_language' => 120, 'target_duration' => 190] as $field => $max) {
        if (mb_strlen($data[$field]) > $max) {
            $data[$field] = mb_substr($data[$field], 0, $max);
        }
    }

    foreach (['learning_reason', 'main_goal', 'additional_notes'] as $field) {
        if (mb_strlen($data[$field]) > 4000) {
            $data[$field] = mb_substr($data[$field], 0, 4000);
        }
    }

    return [$data, $errors];
}

function student_brief_insert(PDO $pdo, array $data, ?int $studentId, string $role): int
{
    ensure_student_brief_tables($pdo);

    $stmt = $pdo->prepare("
        INSERT INTO student_briefs (
            student_id,
            student_name,
            source_name,
            source_email,
            nationality,
            contracted_hours,
            native_language,
            studied_arabic_before,
            learning_reason,
            main_goal,
            target_duration,
            additional_notes,
            submitted_by_role
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $studentId ?: null,
        $data['student_name'],
        $data['source_name'] !== '' ? $data['source_name'] : null,
        $data['source_email'] !== '' ? $data['source_email'] : null,
        $data['nationality'],
        $data['contracted_hours'],
        $data['native_language'],
        $data['studied_arabic_before'],
        $data['learning_reason'],
        $data['main_goal'],
        $data['target_duration'],
        $data['additional_notes'] !== '' ? $data['additional_notes'] : null,
        in_array($role, ['academy', 'teacher', 'student'], true) ? $role : 'academy',
    ]);

    return (int)$pdo->lastInsertId();
}

function student_brief_fetch_all(PDO $pdo, ?int $studentId = null): array
{
    ensure_student_brief_tables($pdo);

    $sql = "
        SELECT b.*, s.login_code, s.level
        FROM student_briefs b
        LEFT JOIN students s ON s.id = b.student_id
    ";
    $params = [];
    if ($studentId !== null && $studentId > 0) {
        $sql .= " WHERE b.student_id = ? ";
        $params[] = $studentId;
    }
    $sql .= " ORDER BY b.created_at DESC, b.id DESC ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll() ?: [];
}

function student_brief_fetch_one(PDO $pdo, int $briefId): ?array
{
    ensure_student_brief_tables($pdo);

    $stmt = $pdo->prepare("
        SELECT b.*, s.login_code, s.level
        FROM student_briefs b
        LEFT JOIN students s ON s.id = b.student_id
        WHERE b.id = ?
        LIMIT 1
    ");
    $stmt->execute([$briefId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

// ── Brief form question management ──────────────────────────────────────────

/**
 * Ensure brief_form_questions table exists and is seeded with core questions.
 * Also adds extra_answers column to student_briefs if needed.
 */
function ensure_brief_questions_table(PDO $pdo): void
{
    static $done = false;
    if ($done) return;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS brief_form_questions (
            id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            sort_order  SMALLINT NOT NULL DEFAULT 0,
            field_name  VARCHAR(120) NOT NULL,
            label       VARCHAR(400) NOT NULL,
            field_type  ENUM('text','textarea','select','email','number') NOT NULL DEFAULT 'text',
            options     TEXT NULL,
            placeholder VARCHAR(300) NULL,
            is_required TINYINT(1) NOT NULL DEFAULT 1,
            is_hidden   TINYINT(1) NOT NULL DEFAULT 0,
            is_core     TINYINT(1) NOT NULL DEFAULT 0,
            col_size    VARCHAR(20) NOT NULL DEFAULT 'col-md-6',
            created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_field_name (field_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Add extra_answers column to student_briefs for custom question answers
    try {
        $pdo->exec("ALTER TABLE student_briefs ADD COLUMN extra_answers TEXT NULL AFTER additional_notes");
    } catch (Throwable $e) {}

    // Seed core questions if table is empty
    $count = (int)$pdo->query("SELECT COUNT(*) FROM brief_form_questions")->fetchColumn();
    if ($count === 0) {
        $seeds = [
            [0,  'source_name',           'Academy Name',                             'text',     null,             'Academy or organization name', 1, 0, 1, 'col-md-6'],
            [1,  'source_email',          'Contact Email',                            'email',    null,             'Optional',                     0, 0, 1, 'col-md-6'],
            [2,  'student_name',          'Student Name',                             'text',     null,             null,                           1, 0, 1, 'col-md-6'],
            [3,  'nationality',           'Nationality',                              'text',     null,             null,                           1, 0, 1, 'col-md-6'],
            [4,  'contracted_hours',      'Contracted Hours',                         'text',     null,             'Example: 24 hours',            1, 0, 1, 'col-md-6'],
            [5,  'native_language',       'Native Language',                          'text',     null,             null,                           1, 0, 1, 'col-md-6'],
            [6,  'studied_arabic_before', 'Has the student studied Arabic before?',   'select',   'yes:Yes|no:No',  null,                           1, 0, 1, 'col-md-6'],
            [7,  'target_duration',       'Target Duration to Reach Goal',            'text',     null,             'Example: 6 months',            1, 0, 1, 'col-md-6'],
            [8,  'learning_reason',       'Reason for Learning Arabic',               'textarea', null,             null,                           1, 0, 1, 'col-12'],
            [9,  'main_goal',             'Main Goal of Learning Arabic',             'textarea', null,             null,                           1, 0, 1, 'col-12'],
            [10, 'additional_notes',      'Additional Notes',                         'textarea', null,             'Optional',                     0, 0, 1, 'col-12'],
        ];
        $ins = $pdo->prepare("
            INSERT INTO brief_form_questions
                (sort_order, field_name, label, field_type, options, placeholder,
                 is_required, is_hidden, is_core, col_size)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        ");
        foreach ($seeds as $seed) {
            $ins->execute($seed);
        }
    }

    $done = true;
}

/**
 * Load all form questions, ordered by sort_order.
 * Pass $includeHidden=true to get hidden questions too (for the teacher editor).
 */
function brief_questions_load(PDO $pdo, bool $includeHidden = false): array
{
    ensure_brief_questions_table($pdo);
    $where = $includeHidden ? '' : ' WHERE is_hidden = 0';
    return $pdo->query(
        "SELECT * FROM brief_form_questions{$where} ORDER BY sort_order ASC, id ASC"
    )->fetchAll() ?: [];
}

// ────────────────────────────────────────────────────────────────────────────

function student_brief_mark_converted(PDO $pdo, int $briefId, int $studentId): void
{
    ensure_student_brief_tables($pdo);
    $stmt = $pdo->prepare("
        UPDATE student_briefs
        SET student_id = ?,
            conversion_status = 'converted',
            converted_at = NOW()
        WHERE id = ?
        LIMIT 1
    ");
    $stmt->execute([$studentId, $briefId]);
}
