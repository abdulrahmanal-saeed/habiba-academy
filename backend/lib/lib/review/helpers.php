<?php
declare(strict_types=1);

function ensure_review_tables(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_reviews (
            id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id         INT UNSIGNED NOT NULL,
            review_type        ENUM('weekly_review','monthly_review') NOT NULL DEFAULT 'weekly_review',
            title              VARCHAR(255) NOT NULL,
            review_date        DATE NOT NULL,
            status             ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
            schema_json        LONGTEXT NOT NULL,
            meta_json          LONGTEXT NULL,
            auto_points_total  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            manual_points_total SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            total_points       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_student (student_id),
            KEY idx_type_date (review_type, review_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_review_submissions (
            id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            review_id           INT UNSIGNED NOT NULL,
            student_id          INT UNSIGNED NOT NULL,
            answers_json        LONGTEXT NOT NULL,
            auto_breakdown_json LONGTEXT NULL,
            auto_score          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            manual_score        SMALLINT UNSIGNED DEFAULT NULL,
            total_score         SMALLINT UNSIGNED DEFAULT NULL,
            teacher_note        TEXT NULL,
            review_status       ENUM('pending','reviewed') NOT NULL DEFAULT 'pending',
            submitted_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            reviewed_at         DATETIME NULL,
            UNIQUE KEY uq_review_student (review_id, student_id),
            KEY idx_student_status (student_id, review_status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_review_manual_scores (
            id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            submission_id INT UNSIGNED NOT NULL,
            section_id   VARCHAR(50) NOT NULL,
            item_id      VARCHAR(100) NOT NULL,
            max_points   DECIMAL(8,2) NOT NULL DEFAULT 0,
            score        DECIMAL(8,2) NOT NULL DEFAULT 0,
            teacher_verdict ENUM('correct','wrong') NULL,
            feedback     TEXT NULL,
            UNIQUE KEY uq_submission_item (submission_id, section_id, item_id),
            KEY idx_submission (submission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    try {
        $pdo->exec("ALTER TABLE student_review_manual_scores ADD COLUMN teacher_verdict ENUM('correct','wrong') NULL AFTER score");
    } catch (Throwable $e) {
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_review_section_overrides (
            id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            submission_id INT UNSIGNED NOT NULL,
            section_id    VARCHAR(50) NOT NULL,
            grading_mode  ENUM('auto','manual') NOT NULL DEFAULT 'auto',
            updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_submission_section (submission_id, section_id),
            KEY idx_submission (submission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

function review_decode_schema(string $json): array
{
    $data = json_decode($json, true);
    if (!is_array($data)) {
        throw new RuntimeException('Invalid review JSON.');
    }

    if (isset($data['exam']) && is_array($data['exam'])) {
        $data = $data['exam'];
    }

    if (!isset($data['meta']) || !is_array($data['meta'])) {
        $data['meta'] = [];
    }
    if (!isset($data['sections']) || !is_array($data['sections'])) {
        throw new RuntimeException('Review JSON must include sections.');
    }

    return $data;
}

function review_meta(array $schema): array
{
    return is_array($schema['meta'] ?? null) ? $schema['meta'] : [];
}

function review_sections(array $schema): array
{
    return is_array($schema['sections'] ?? null) ? $schema['sections'] : [];
}

function review_title_from_schema(array $schema): string
{
    $meta = review_meta($schema);
    return trim((string)($meta['title_en'] ?? $meta['title'] ?? 'Student Review'));
}

function review_points_summary(array $schema): array
{
    $auto = 0;
    $manual = 0;

    foreach (review_sections($schema) as $section) {
        $points = (int)($section['total_points'] ?? 0);
        if (!empty($section['auto_gradable'])) {
            $auto += $points;
        } else {
            $manual += $points;
        }
    }

    return [
        'auto' => $auto,
        'manual' => $manual,
        'total' => $auto + $manual,
    ];
}

function review_type_label(string $type): string
{
    return $type === 'monthly_review' ? 'Monthly Review' : 'Weekly Review';
}

function review_section_grading_mode(array $section, array $overrides = []): string
{
    $sectionId = (string)($section['section_id'] ?? '');
    if (!empty($section['auto_gradable'])) {
        $override = (string)($overrides[$sectionId] ?? '');
        return $override === 'manual' ? 'manual' : 'auto';
    }

    return 'manual';
}

function review_normalize_text(string $value): string
{
    $value = trim($value);
    $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
    return function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);
}

function review_auto_grade(array $schema, array $answers): array
{
    $score = 0;
    $breakdown = [];

    foreach (review_sections($schema) as $section) {
        $sectionId = (string)($section['section_id'] ?? '');
        if (empty($section['auto_gradable'])) {
            continue;
        }

        if ($sectionId === 'mcq') {
            foreach ((array)($section['questions'] ?? []) as $question) {
                $qid = (string)($question['id'] ?? '');
                $correct = strtoupper((string)($question['correct'] ?? ''));
                $given = strtoupper((string)($answers['mcq'][$qid] ?? ''));
                $points = (int)($question['points'] ?? $section['points_per_question'] ?? 0);
                $ok = $given !== '' && $given === $correct;
                if ($ok) {
                    $score += $points;
                }
                $breakdown['mcq'][$qid] = [
                    'given' => $given,
                    'correct' => $correct,
                    'points' => $points,
                    'earned' => $ok ? $points : 0,
                    'is_correct' => $ok,
                ];
            }
            continue;
        }

        if ($sectionId === 'matching') {
            foreach ((array)($section['exercises'] ?? []) as $exercise) {
                $exerciseId = (string)($exercise['id'] ?? '');
                $pointsPerMatch = (int)($section['points_per_match'] ?? 1);
                $givenPairs = (array)($answers['matching'][$exerciseId] ?? []);
                $correctPairs = (array)($exercise['correct_pairs'] ?? []);
                $earned = 0;
                $items = [];

                foreach ($correctPairs as $leftId => $rightId) {
                    $given = (string)($givenPairs[$leftId] ?? '');
                    $ok = $given !== '' && $given === (string)$rightId;
                    if ($ok) {
                        $earned += $pointsPerMatch;
                    }
                    $items[$leftId] = [
                        'given' => $given,
                        'correct' => (string)$rightId,
                        'earned' => $ok ? $pointsPerMatch : 0,
                        'is_correct' => $ok,
                    ];
                }

                $score += $earned;
                $breakdown['matching'][$exerciseId] = [
                    'earned' => $earned,
                    'items' => $items,
                ];
            }
            continue;
        }

        if ($sectionId === 'fill_the_blank') {
            foreach ((array)($section['questions'] ?? []) as $question) {
                $qid = (string)($question['id'] ?? '');
                $given = review_normalize_text((string)($answers['fill_the_blank'][$qid] ?? ''));
                $correctAnswers = array_map(
                    static fn($value) => review_normalize_text((string)$value),
                    (array)($question['correct_answers'] ?? [])
                );
                $points = (int)($question['points'] ?? 1);
                $ok = $given !== '' && in_array($given, $correctAnswers, true);
                if ($ok) {
                    $score += $points;
                }
                $breakdown['fill_the_blank'][$qid] = [
                    'given' => $given,
                    'correct_answers' => $correctAnswers,
                    'points' => $points,
                    'earned' => $ok ? $points : 0,
                    'is_correct' => $ok,
                ];
            }
        }
    }

    return ['score' => $score, 'breakdown' => $breakdown];
}

function review_section_auto_earned(array $section, array $autoBreakdown): float
{
    $sectionId = (string)($section['section_id'] ?? '');
    $earned = 0.0;

    if ($sectionId === 'mcq') {
        foreach ((array)($section['questions'] ?? []) as $question) {
            $qid = (string)($question['id'] ?? '');
            $earned += (float)($autoBreakdown['mcq'][$qid]['earned'] ?? 0);
        }
        return $earned;
    }

    if ($sectionId === 'matching') {
        foreach ((array)($section['exercises'] ?? []) as $exercise) {
            $exerciseId = (string)($exercise['id'] ?? '');
            $earned += (float)($autoBreakdown['matching'][$exerciseId]['earned'] ?? 0);
        }
        return $earned;
    }

    if ($sectionId === 'fill_the_blank') {
        foreach ((array)($section['questions'] ?? []) as $question) {
            $qid = (string)($question['id'] ?? '');
            $earned += (float)($autoBreakdown['fill_the_blank'][$qid]['earned'] ?? 0);
        }
        return $earned;
    }

    return 0.0;
}

function review_effective_auto_score(array $schema, array $autoBreakdown, array $overrides = []): int
{
    $score = 0.0;
    foreach (review_sections($schema) as $section) {
        if (review_section_grading_mode($section, $overrides) !== 'auto') {
            continue;
        }
        $score += review_section_auto_earned($section, $autoBreakdown);
    }

    return (int)round($score);
}

function review_effective_item_result(
    array $manualScores,
    string $sectionId,
    string $itemId,
    float $fallbackEarned,
    float $maxPoints,
    bool $fallbackCorrect
): array {
    $saved = $manualScores[$sectionId . '::' . $itemId] ?? null;
    if (!$saved) {
        return [
            'earned' => $fallbackEarned,
            'is_correct' => $fallbackCorrect,
            'saved' => null,
        ];
    }

    $score = (float)($saved['score'] ?? 0);
    $verdict = (string)($saved['teacher_verdict'] ?? '');

    if ($verdict === 'correct') {
        $score = $maxPoints;
    } elseif ($verdict === 'wrong') {
        $score = 0.0;
    }

    if ($verdict === 'correct') {
        $isCorrect = true;
    } elseif ($verdict === 'wrong') {
        $isCorrect = false;
    } elseif ($maxPoints > 0 && abs($score - $maxPoints) < 0.0001) {
        $isCorrect = true;
    } elseif ($score <= 0.0001) {
        $isCorrect = false;
    } else {
        $isCorrect = $fallbackCorrect;
    }

    return [
        'earned' => $score,
        'is_correct' => $isCorrect,
        'saved' => $saved,
    ];
}

function review_manual_items(array $schema, array $overrides = []): array
{
    $items = [];

    foreach (review_sections($schema) as $section) {
        $sectionId = (string)($section['section_id'] ?? '');
        if (review_section_grading_mode($section, $overrides) !== 'manual') {
            continue;
        }

        if (in_array($sectionId, ['writing', 'speaking'], true)) {
            foreach ((array)($section['questions'] ?? []) as $question) {
                $items[] = [
                    'section_id' => $sectionId,
                    'item_id' => (string)($question['id'] ?? ''),
                    'max_points' => (float)($question['points'] ?? 0),
                    'prompt' => (string)($question['prompt'] ?? ''),
                    'sample_answer' => (string)($question['sample_answer'] ?? ''),
                    'grading_criteria' => (array)($question['grading_criteria'] ?? []),
                ];
            }
            continue;
        }

        if ($sectionId === 'mcq') {
            foreach ((array)($section['questions'] ?? []) as $question) {
                $items[] = [
                    'section_id' => $sectionId,
                    'item_id' => (string)($question['id'] ?? ''),
                    'max_points' => (float)($question['points'] ?? $section['points_per_question'] ?? 0),
                    'prompt' => (string)($question['question'] ?? ''),
                    'sample_answer' => (string)($question['correct'] ?? ''),
                    'grading_criteria' => [],
                ];
            }
            continue;
        }

        if ($sectionId === 'matching') {
            foreach ((array)($section['exercises'] ?? []) as $exercise) {
                $items[] = [
                    'section_id' => $sectionId,
                    'item_id' => (string)($exercise['id'] ?? ''),
                    'max_points' => (float)($exercise['points'] ?? $section['points_per_match'] ?? 0),
                    'prompt' => (string)($exercise['title'] ?? 'Matching Exercise'),
                    'sample_answer' => '',
                    'grading_criteria' => [],
                ];
            }
            continue;
        }

        if ($sectionId === 'fill_the_blank') {
            foreach ((array)($section['questions'] ?? []) as $question) {
                $items[] = [
                    'section_id' => $sectionId,
                    'item_id' => (string)($question['id'] ?? ''),
                    'max_points' => (float)($question['points'] ?? 1),
                    'prompt' => (string)($question['sentence_with_blank'] ?? $question['sentence'] ?? $question['prompt'] ?? $question['question'] ?? ''),
                    'sample_answer' => implode(' / ', array_map('strval', (array)($question['correct_answers'] ?? []))),
                    'grading_criteria' => [],
                ];
            }
            continue;
        }

        if ($sectionId === 'scenario') {
            foreach ((array)($section['scenarios'] ?? []) as $scenario) {
                $items[] = [
                    'section_id' => $sectionId,
                    'item_id' => (string)($scenario['id'] ?? ''),
                    'max_points' => (float)($scenario['points'] ?? 0),
                    'prompt' => (string)($scenario['title'] ?? ''),
                    'sample_answer' => '',
                    'grading_criteria' => array_map(
                        static function (array $step): string {
                            return trim((string)($step['student_task'] ?? '')) . ' (' . (int)($step['points'] ?? 0) . ' pt)';
                        },
                        (array)($scenario['expected_steps'] ?? [])
                    ),
                ];
            }
        }
    }

    return $items;
}

function review_find_section(array $schema, string $sectionId): ?array
{
    foreach (review_sections($schema) as $section) {
        if ((string)($section['section_id'] ?? '') === $sectionId) {
            return $section;
        }
    }
    return null;
}
