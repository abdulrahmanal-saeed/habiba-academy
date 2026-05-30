<?php
// lib/ai-system.php - Teacher-side AI operations, logging, caching, and rule-based intelligence
declare(strict_types=1);

function ai_ensure_tables(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_prompt_versions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            feature_key VARCHAR(100) NOT NULL,
            version VARCHAR(50) NOT NULL,
            system_prompt MEDIUMTEXT NOT NULL,
            user_prompt_template MEDIUMTEXT NULL,
            model VARCHAR(100) NOT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_ai_prompt_version (feature_key, version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NULL,
            student_id INT NULL,
            feature_key VARCHAR(100) NOT NULL,
            prompt_version_id INT NULL,
            model VARCHAR(100) NOT NULL,
            input_hash VARCHAR(64) NULL,
            input_summary TEXT NULL,
            output_json MEDIUMTEXT NULL,
            status ENUM('success','failed','cached') DEFAULT 'success',
            error_message TEXT NULL,
            cost_tokens_input INT DEFAULT 0,
            cost_tokens_output INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_ai_req_student (student_id, feature_key, created_at),
            KEY idx_ai_req_hash (feature_key, input_hash)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_suggestion_actions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ai_request_id INT NULL,
            teacher_id INT NULL,
            student_id INT NULL,
            feature_key VARCHAR(100) NOT NULL,
            action ENUM('accepted','edited','rejected','ignored') NOT NULL,
            original_suggestion MEDIUMTEXT NULL,
            final_value MEDIUMTEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_ai_action_student (student_id, feature_key, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS mistake_taxonomy (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(80) NOT NULL UNIQUE,
            category VARCHAR(100) NOT NULL,
            label_en VARCHAR(150) NOT NULL,
            label_ar VARCHAR(150) NULL,
            description TEXT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_mistake_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            taxonomy_id INT NULL,
            source_type ENUM('homework','review','scenario','leveltest','manual') NOT NULL,
            source_id INT NULL,
            source_question_id VARCHAR(100) NULL,
            evidence_text TEXT NULL,
            teacher_note TEXT NULL,
            severity ENUM('low','medium','high') DEFAULT 'medium',
            status ENUM('suggested','approved','rejected') DEFAULT 'suggested',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_mistake_events_student (student_id, status, created_at),
            KEY idx_mistake_events_taxonomy (taxonomy_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS teacher_internal_notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NULL,
            student_id INT NOT NULL,
            note_type ENUM('general','review','lesson','risk','follow_up') DEFAULT 'general',
            note TEXT NOT NULL,
            ai_generated TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_teacher_notes_student (student_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_cache (
            id INT AUTO_INCREMENT PRIMARY KEY,
            feature_key VARCHAR(100) NOT NULL,
            input_hash VARCHAR(64) NOT NULL,
            output_json MEDIUMTEXT NOT NULL,
            expires_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_feature_hash (feature_key, input_hash),
            KEY idx_ai_cache_expiry (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_ai_analysis_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            ai_request_id INT NULL,
            language VARCHAR(10) NOT NULL DEFAULT 'en',
            status VARCHAR(50) NULL,
            summary TEXT NULL,
            analysis_json MEDIUMTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_student_analysis_history (student_id, language, created_at),
            KEY idx_student_analysis_request (ai_request_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    ai_seed_mistake_taxonomy($pdo);
    $done = true;
}

function ai_seed_mistake_taxonomy(PDO $pdo): void
{
    $rows = [
        ['grammar_gender', 'grammar', 'Gender agreement', 'توافق التذكير والتأنيث', 'Wrong masculine/feminine agreement.'],
        ['grammar_word_order', 'grammar', 'Word order', 'ترتيب الكلمات', 'Words are understandable but ordered unnaturally.'],
        ['grammar_pronoun', 'grammar', 'Pronoun usage', 'استخدام الضمائر', 'Wrong subject, possessive, or object pronoun.'],
        ['vocabulary_wrong_word', 'vocabulary', 'Wrong vocabulary choice', 'اختيار كلمة غير مناسب', 'Uses a word that does not fit the intended meaning.'],
        ['vocabulary_missing_word', 'vocabulary', 'Missing required word', 'كلمة ناقصة', 'Missing an important target word or phrase.'],
        ['spelling_arabic', 'writing', 'Arabic spelling', 'إملاء عربي', 'Arabic spelling or letter-form issue.'],
        ['sentence_incomplete', 'writing', 'Incomplete sentence', 'جملة غير مكتملة', 'Answer is too short or not a complete sentence.'],
        ['meaning_unclear', 'communication', 'Meaning unclear', 'المعنى غير واضح', 'Teacher cannot clearly understand the intended message.'],
        ['pronunciation_clarity', 'speaking', 'Pronunciation clarity', 'وضوح النطق', 'Pronunciation needs attention.'],
        ['fluency_hesitation', 'speaking', 'Fluency / hesitation', 'الطلاقة والتردد', 'Speech is too hesitant or broken.'],
        ['task_incomplete', 'task', 'Task incomplete', 'المطلوب غير مكتمل', 'Student did not complete all required parts.'],
    ];

    $stmt = $pdo->prepare("
        INSERT INTO mistake_taxonomy (code, category, label_en, label_ar, description, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
            category = VALUES(category),
            label_en = VALUES(label_en),
            label_ar = VALUES(label_ar),
            description = VALUES(description),
            is_active = 1
    ");
    foreach ($rows as $row) {
        $stmt->execute($row);
    }
}

function ai_teacher_id(): ?int
{
    return isset($_SESSION['teacher_id']) ? (int)$_SESSION['teacher_id'] : null;
}

function ai_input_hash(array $payload): string
{
    ksort($payload);
    return hash('sha256', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function ai_get_or_create_prompt_version(PDO $pdo, string $featureKey, string $version, string $system, string $template, string $model): int
{
    ai_ensure_tables($pdo);
    $stmt = $pdo->prepare("SELECT id FROM ai_prompt_versions WHERE feature_key = ? AND version = ? LIMIT 1");
    $stmt->execute([$featureKey, $version]);
    $id = (int)($stmt->fetchColumn() ?: 0);
    if ($id > 0) {
        return $id;
    }

    $ins = $pdo->prepare("
        INSERT INTO ai_prompt_versions (feature_key, version, system_prompt, user_prompt_template, model, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
    ");
    $ins->execute([$featureKey, $version, $system, $template, $model]);
    return (int)$pdo->lastInsertId();
}

function ai_log_request(PDO $pdo, array $data): int
{
    ai_ensure_tables($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO ai_requests
            (teacher_id, student_id, feature_key, prompt_version_id, model, input_hash, input_summary, output_json, status, error_message, cost_tokens_input, cost_tokens_output)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['teacher_id'] ?? ai_teacher_id(),
        $data['student_id'] ?? null,
        $data['feature_key'] ?? 'unknown',
        $data['prompt_version_id'] ?? null,
        $data['model'] ?? 'none',
        $data['input_hash'] ?? null,
        $data['input_summary'] ?? null,
        isset($data['output']) ? json_encode($data['output'], JSON_UNESCAPED_UNICODE) : ($data['output_json'] ?? null),
        $data['status'] ?? 'success',
        $data['error_message'] ?? null,
        (int)($data['cost_tokens_input'] ?? 0),
        (int)($data['cost_tokens_output'] ?? 0),
    ]);
    return (int)$pdo->lastInsertId();
}

function ai_cache_get(PDO $pdo, string $featureKey, string $hash): ?array
{
    ai_ensure_tables($pdo);
    $stmt = $pdo->prepare("
        SELECT output_json
        FROM ai_cache
        WHERE feature_key = ? AND input_hash = ? AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
    ");
    $stmt->execute([$featureKey, $hash]);
    $json = $stmt->fetchColumn();
    if (!$json) {
        return null;
    }
    $data = json_decode((string)$json, true);
    return is_array($data) ? $data : null;
}

function ai_cache_set(PDO $pdo, string $featureKey, string $hash, array $output, int $ttlSeconds = 86400): void
{
    ai_ensure_tables($pdo);
    $expires = (new DateTimeImmutable('now'))->modify('+' . $ttlSeconds . ' seconds')->format('Y-m-d H:i:s');
    $stmt = $pdo->prepare("
        INSERT INTO ai_cache (feature_key, input_hash, output_json, expires_at)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE output_json = VALUES(output_json), expires_at = VALUES(expires_at), created_at = NOW()
    ");
    $stmt->execute([$featureKey, $hash, json_encode($output, JSON_UNESCAPED_UNICODE), $expires]);
}

function ai_record_suggestion_action(PDO $pdo, int $aiRequestId, int $studentId, string $featureKey, string $action, mixed $original, mixed $final): int
{
    ai_ensure_tables($pdo);
    $allowed = ['accepted', 'edited', 'rejected', 'ignored'];
    if (!in_array($action, $allowed, true)) {
        $action = 'ignored';
    }
    $stmt = $pdo->prepare("
        INSERT INTO ai_suggestion_actions
            (ai_request_id, teacher_id, student_id, feature_key, action, original_suggestion, final_value)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $aiRequestId > 0 ? $aiRequestId : null,
        ai_teacher_id(),
        $studentId,
        $featureKey,
        $action,
        is_string($original) ? $original : json_encode($original, JSON_UNESCAPED_UNICODE),
        is_string($final) ? $final : json_encode($final, JSON_UNESCAPED_UNICODE),
    ]);
    return (int)$pdo->lastInsertId();
}

function ai_active_taxonomy(PDO $pdo): array
{
    ai_ensure_tables($pdo);
    return $pdo->query("
        SELECT id, code, category, label_en, label_ar, description
        FROM mistake_taxonomy
        WHERE is_active = 1
        ORDER BY category, label_en
    ")->fetchAll();
}

function ai_student_snapshot(PDO $pdo, int $studentId): array
{
    ai_ensure_tables($pdo);

    $stmt = $pdo->prepare("SELECT id, full_name, login_code, level, email, whatsapp FROM students WHERE id = ? LIMIT 1");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch() ?: [];

    $stats = [
        'submitted_homeworks' => 0,
        'avg_mcq_percent' => null,
        'scenario_recordings' => 0,
        'pending_reviews' => 0,
        'weak_words_count' => 0,
        'mistakes_count' => 0,
    ];

    $q = $pdo->prepare("SELECT COUNT(*) FROM homework_submissions WHERE student_id = ? AND is_submitted = 1");
    $q->execute([$studentId]);
    $stats['submitted_homeworks'] = (int)$q->fetchColumn();
    // Reviews count as big homeworks — add submitted reviews to the total
    try {
        $q = $pdo->prepare("SELECT COUNT(*) FROM student_review_submissions WHERE student_id = ?");
        $q->execute([$studentId]);
        $stats['submitted_homeworks'] += (int)$q->fetchColumn();
    } catch (Throwable $e) {}

    $q = $pdo->prepare("SELECT AVG(mcq_score / NULLIF(mcq_total, 0)) * 100 FROM homework_submissions WHERE student_id = ? AND is_submitted = 1 AND mcq_total > 0");
    $q->execute([$studentId]);
    $avg = $q->fetchColumn();
    $stats['avg_mcq_percent'] = $avg !== null ? (int)round((float)$avg) : null;

    $q = $pdo->prepare("SELECT COUNT(*) FROM scenario_recordings WHERE student_id = ?");
    $q->execute([$studentId]);
    $stats['scenario_recordings'] = (int)$q->fetchColumn();

    try {
        $q = $pdo->prepare("SELECT COUNT(*) FROM student_review_submissions WHERE student_id = ? AND review_status = 'pending'");
        $q->execute([$studentId]);
        $stats['pending_reviews'] = (int)$q->fetchColumn();
    } catch (Throwable $e) {}

    $q = $pdo->prepare("SELECT COUNT(*) FROM student_weak_words WHERE student_id = ? AND is_active = 1");
    $q->execute([$studentId]);
    $stats['weak_words_count'] = (int)$q->fetchColumn();

    $q = $pdo->prepare("SELECT COUNT(*) FROM student_common_mistakes WHERE student_id = ? AND is_active = 1");
    $q->execute([$studentId]);
    $stats['mistakes_count'] = (int)$q->fetchColumn();

    $q = $pdo->prepare("SELECT word, note FROM student_weak_words WHERE student_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 8");
    $q->execute([$studentId]);
    $weakWords = $q->fetchAll();

    $q = $pdo->prepare("SELECT tag, note FROM student_common_mistakes WHERE student_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 8");
    $q->execute([$studentId]);
    $mistakes = $q->fetchAll();

    $recent = [];
    try {
        $q = $pdo->prepare("
            SELECT h.title, hs.mcq_score, hs.mcq_total, hs.teacher_note, hs.submitted_at
            FROM homework_submissions hs
            JOIN homeworks h ON h.id = hs.homework_id
            WHERE hs.student_id = ? AND hs.is_submitted = 1
            ORDER BY hs.submitted_at DESC
            LIMIT 5
        ");
        $q->execute([$studentId]);
        $recent = $q->fetchAll();
    } catch (Throwable $e) {}

    return [
        'student' => $student,
        'stats' => $stats,
        'weak_words' => $weakWords,
        'mistakes' => $mistakes,
        'recent_homeworks' => $recent,
        'patterns' => ai_repeated_patterns($pdo, $studentId, 5),
    ];
}

function ai_repeated_patterns(PDO $pdo, int $studentId, int $limit = 8): array
{
    ai_ensure_tables($pdo);
    $patterns = [];

    try {
        $stmt = $pdo->prepare("
            SELECT mt.code, mt.label_en, mt.label_ar, mt.category, COUNT(*) AS count
            FROM student_mistake_events sme
            JOIN mistake_taxonomy mt ON mt.id = sme.taxonomy_id
            WHERE sme.student_id = ? AND sme.status = 'approved'
              AND NOT EXISTS (
                SELECT 1
                FROM student_common_mistakes m
                JOIN student_common_mistakes_progress p
                  ON p.mistake_id = m.id AND p.student_id = m.student_id AND p.is_mastered = 1
                WHERE m.student_id = sme.student_id
                  AND m.is_active = 1
                  AND (
                    CONVERT(m.tag USING utf8mb4) COLLATE utf8mb4_unicode_ci = mt.label_en
                    OR CONVERT(m.tag USING utf8mb4) COLLATE utf8mb4_unicode_ci = mt.label_ar
                    OR CONVERT(m.tag USING utf8mb4) COLLATE utf8mb4_unicode_ci = mt.code
                  )
              )
            GROUP BY mt.id, mt.code, mt.label_en, mt.label_ar, mt.category
            ORDER BY count DESC, MAX(sme.created_at) DESC
            LIMIT {$limit}
        ");
        $stmt->execute([$studentId]);
        $patterns = $stmt->fetchAll();
    } catch (Throwable $e) {
        $patterns = [];
    }

    if ($patterns) {
        return $patterns;
    }

    $stmt = $pdo->prepare("
        SELECT tag AS label_en, NULL AS label_ar, 'tracked' AS category, 1 AS count
        FROM student_common_mistakes m
        LEFT JOIN student_common_mistakes_progress p
          ON p.mistake_id = m.id AND p.student_id = m.student_id
        WHERE m.student_id = ? AND m.is_active = 1 AND COALESCE(p.is_mastered, 0) = 0
        ORDER BY created_at DESC
        LIMIT {$limit}
    ");
    $stmt->execute([$studentId]);
    return $stmt->fetchAll();
}

function ai_review_priority(PDO $pdo, int $limit = 20): array
{
    ai_ensure_tables($pdo);
    $items = [];

    try {
        $stmt = $pdo->query("
            SELECT 'review' AS type, r.id AS item_id, r.student_id, s.full_name, r.title,
                   sub.submitted_at AS event_date, 95 AS score,
                   'Review waiting for manual grading' AS reason,
                   CONCAT('/teacher/review/results.php?id=', r.id) AS url
            FROM student_review_submissions sub
            JOIN student_reviews r ON r.id = sub.review_id
            JOIN students s ON s.id = sub.student_id
            WHERE sub.review_status = 'pending'
            ORDER BY sub.submitted_at ASC
            LIMIT 20
        ");
        $items = array_merge($items, $stmt->fetchAll());
    } catch (Throwable $e) {}

    try {
        $stmt = $pdo->query("
            SELECT 'homework' AS type, h.id AS item_id, h.student_id, s.full_name, h.title,
                   hs.submitted_at AS event_date, 85 AS score,
                   'Homework has manual sections and no teacher note yet' AS reason,
                   CONCAT('/teacher/homework-results.php?id=', h.id) AS url
            FROM homework_submissions hs
            JOIN homeworks h ON h.id = hs.homework_id
            JOIN students s ON s.id = hs.student_id
            WHERE hs.is_submitted = 1
              AND (hs.teacher_note IS NULL OR hs.teacher_note = '')
              AND (
                EXISTS (SELECT 1 FROM homework_writing_questions w WHERE w.homework_id = h.id)
                OR EXISTS (SELECT 1 FROM homework_speaking_questions sp WHERE sp.homework_id = h.id)
              )
            ORDER BY hs.submitted_at ASC
            LIMIT 20
        ");
        $items = array_merge($items, $stmt->fetchAll());
    } catch (Throwable $e) {}

    try {
        $stmt = $pdo->query("
            SELECT 'scenario' AS type, sc.id AS item_id, sc.student_id, s.full_name, sc.title,
                   MIN(sr.submitted_at) AS event_date, 75 AS score,
                   'Scenario recording needs teacher feedback' AS reason,
                   CONCAT('/teacher/scenario-results.php?id=', sc.id) AS url
            FROM scenario_recordings sr
            JOIN scenarios sc ON sc.id = sr.scenario_id
            JOIN students s ON s.id = sr.student_id
            WHERE sr.submitted_at IS NOT NULL AND (sr.teacher_note IS NULL OR sr.teacher_note = '')
            GROUP BY sc.id, sc.student_id, s.full_name, sc.title
            ORDER BY event_date ASC
            LIMIT 20
        ");
        $items = array_merge($items, $stmt->fetchAll());
    } catch (Throwable $e) {}

    try {
        $stmt = $pdo->query("
            SELECT 'pattern' AS type,
                   MAX(sme.id) AS item_id,
                   sme.student_id,
                   s.full_name,
                   CONCAT(mt.label_en, ' x', COUNT(*)) AS title,
                   MAX(sme.created_at) AS event_date,
                   LEAST(92, 58 + (COUNT(*) * 8)) AS score,
                   'Repeated approved mistake pattern needs teaching focus' AS reason,
                   CONCAT('/teacher/student-details.php?id=', sme.student_id) AS url
            FROM student_mistake_events sme
            JOIN mistake_taxonomy mt ON mt.id = sme.taxonomy_id
            JOIN students s ON s.id = sme.student_id
            WHERE sme.status = 'approved'
              AND NOT EXISTS (
                SELECT 1
                FROM student_common_mistakes m
                JOIN student_common_mistakes_progress p
                  ON p.mistake_id = m.id AND p.student_id = m.student_id AND p.is_mastered = 1
                WHERE m.student_id = sme.student_id
                  AND m.is_active = 1
                  AND (
                    CONVERT(m.tag USING utf8mb4) COLLATE utf8mb4_unicode_ci = mt.label_en
                    OR CONVERT(m.tag USING utf8mb4) COLLATE utf8mb4_unicode_ci = mt.label_ar
                    OR CONVERT(m.tag USING utf8mb4) COLLATE utf8mb4_unicode_ci = mt.code
                  )
              )
            GROUP BY sme.student_id, mt.id, s.full_name, mt.label_en
            HAVING COUNT(*) >= 2
            ORDER BY score DESC, event_date DESC
            LIMIT 20
        ");
        $items = array_merge($items, $stmt->fetchAll());
    } catch (Throwable $e) {}

    usort($items, static function (array $a, array $b): int {
        $score = ((int)$b['score']) <=> ((int)$a['score']);
        if ($score !== 0) {
            return $score;
        }
        return strcmp((string)($a['event_date'] ?? ''), (string)($b['event_date'] ?? ''));
    });

    return array_slice($items, 0, $limit);
}

function ai_internal_notes(PDO $pdo, int $studentId, int $limit = 8): array
{
    ai_ensure_tables($pdo);
    $stmt = $pdo->prepare("
        SELECT id, note_type, note, ai_generated, created_at
        FROM teacher_internal_notes
        WHERE student_id = ?
        ORDER BY created_at DESC
        LIMIT {$limit}
    ");
    $stmt->execute([$studentId]);
    return $stmt->fetchAll();
}

function ai_save_analysis_history(PDO $pdo, int $studentId, ?int $aiRequestId, string $language, array $analysis): int
{
    ai_ensure_tables($pdo);
    $language = $language === 'ar' ? 'ar' : 'en';
    $stmt = $pdo->prepare("
        INSERT INTO student_ai_analysis_history
            (student_id, ai_request_id, language, status, summary, analysis_json)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $studentId,
        $aiRequestId ?: null,
        $language,
        (string)($analysis['status'] ?? ''),
        (string)($analysis['summary'] ?? ''),
        json_encode($analysis, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
    return (int)$pdo->lastInsertId();
}

function ai_analysis_history(PDO $pdo, int $studentId, int $limit = 8): array
{
    ai_ensure_tables($pdo);
    $stmt = $pdo->prepare("
        SELECT id, ai_request_id, language, status, summary, analysis_json, created_at
        FROM student_ai_analysis_history
        WHERE student_id = ?
        ORDER BY created_at DESC
        LIMIT {$limit}
    ");
    $stmt->execute([$studentId]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $decoded = json_decode((string)($row['analysis_json'] ?? ''), true);
        $row['analysis'] = is_array($decoded) ? $decoded : [];
    }
    unset($row);
    return $rows;
}

function ai_performance_summary(PDO $pdo, int $studentId): array
{
    $snapshot = ai_student_snapshot($pdo, $studentId);
    $stats = $snapshot['stats'];
    $patterns = $snapshot['patterns'];
    $weakWords = $snapshot['weak_words'];

    $summary = [];
    $summary[] = 'Submitted homework: ' . (int)$stats['submitted_homeworks'];
    if ($stats['avg_mcq_percent'] !== null) {
        $summary[] = 'Average MCQ: ' . (int)$stats['avg_mcq_percent'] . '%';
    }
    $summary[] = 'Scenario recordings: ' . (int)$stats['scenario_recordings'];

    $focus = [];
    foreach (array_slice($patterns, 0, 3) as $p) {
        $focus[] = (string)($p['label_en'] ?? $p['tag'] ?? '');
    }
    foreach (array_slice($weakWords, 0, 3) as $w) {
        $focus[] = (string)($w['word'] ?? '');
    }
    $focus = array_values(array_filter(array_unique($focus)));

    return [
        'summary' => implode(' · ', $summary),
        'recommended_focus' => $focus ? implode(', ', array_slice($focus, 0, 4)) : 'Keep reinforcing current lesson goals.',
        'snapshot' => $snapshot,
    ];
}
