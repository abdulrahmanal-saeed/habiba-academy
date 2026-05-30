<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/learning-guidance.php';
require_once __DIR__ . '/learning-audit.php';

function flashcards_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) return;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_weak_words_progress (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id INT UNSIGNED NOT NULL,
            weak_word_id INT UNSIGNED NOT NULL,
            is_mastered TINYINT(1) NOT NULL DEFAULT 0,
            mastered_at DATETIME NULL DEFAULT NULL,
            UNIQUE KEY uniq_student_word (student_id, weak_word_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_common_mistakes_progress (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id INT UNSIGNED NOT NULL,
            mistake_id INT UNSIGNED NOT NULL,
            is_mastered TINYINT(1) NOT NULL DEFAULT 0,
            UNIQUE KEY uniq_student_mistake (student_id, mistake_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $defs = [
        'student_weak_words_progress' => [
            'review_state' => "ALTER TABLE student_weak_words_progress ADD COLUMN review_state VARCHAR(20) NOT NULL DEFAULT '' AFTER is_mastered",
            'last_reviewed_at' => "ALTER TABLE student_weak_words_progress ADD COLUMN last_reviewed_at DATETIME NULL DEFAULT NULL AFTER mastered_at",
            'next_review_at' => "ALTER TABLE student_weak_words_progress ADD COLUMN next_review_at DATETIME NULL DEFAULT NULL AFTER last_reviewed_at",
            'review_count' => "ALTER TABLE student_weak_words_progress ADD COLUMN review_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER next_review_at",
        ],
        'student_common_mistakes_progress' => [
            'review_state' => "ALTER TABLE student_common_mistakes_progress ADD COLUMN review_state VARCHAR(20) NOT NULL DEFAULT '' AFTER is_mastered",
            'mastered_at' => "ALTER TABLE student_common_mistakes_progress ADD COLUMN mastered_at DATETIME NULL DEFAULT NULL AFTER review_state",
            'last_reviewed_at' => "ALTER TABLE student_common_mistakes_progress ADD COLUMN last_reviewed_at DATETIME NULL DEFAULT NULL AFTER mastered_at",
            'next_review_at' => "ALTER TABLE student_common_mistakes_progress ADD COLUMN next_review_at DATETIME NULL DEFAULT NULL AFTER last_reviewed_at",
            'review_count' => "ALTER TABLE student_common_mistakes_progress ADD COLUMN review_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER next_review_at",
        ],
    ];

    $check = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    ");
    foreach ($defs as $table => $cols) {
        foreach ($cols as $col => $sql) {
            try {
                $check->execute([$table, $col]);
                if ((int)$check->fetchColumn() === 0) $pdo->exec($sql);
            } catch (Throwable) {}
        }
    }

    $done = true;
}

function flashcards_next_review(string $state): string
{
    $days = match ($state) {
        'got_it' => 3,
        'almost' => 1,
        default => 0,
    };
    return (new DateTimeImmutable('today +' . $days . ' days'))->format('Y-m-d 08:00:00');
}

function flashcards_due(PDO $pdo, int $studentId): array
{
    flashcards_ensure_schema($pdo);
    $cards = [];

    $stmt = $pdo->prepare("
        SELECT 'word' AS card_type, w.id, w.word AS front, w.note AS back,
               p.review_state, p.next_review_at, p.review_count, COALESCE(p.is_mastered, 0) AS is_mastered
        FROM student_weak_words w
        LEFT JOIN student_weak_words_progress p ON p.weak_word_id = w.id AND p.student_id = ?
        WHERE w.student_id = ?
          AND w.is_active = 1
          AND (p.next_review_at IS NULL OR p.next_review_at <= NOW() OR COALESCE(p.is_mastered,0) = 0)
        ORDER BY COALESCE(p.next_review_at, w.created_at) ASC
        LIMIT 30
    ");
    $stmt->execute([$studentId, $studentId]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $guidance = weak_word_guidance((string)$row['front'], $row['back'] ?? null);
        $row['hint'] = $guidance['practice_prompt_en'] ?? '';
        $cards[] = $row;
    }

    $stmt = $pdo->prepare("
        SELECT 'mistake' AS card_type, m.id, m.tag AS front, m.note AS back,
               p.review_state, p.next_review_at, p.review_count, COALESCE(p.is_mastered, 0) AS is_mastered
        FROM student_common_mistakes m
        LEFT JOIN student_common_mistakes_progress p ON p.mistake_id = m.id AND p.student_id = ?
        WHERE m.student_id = ?
          AND m.is_active = 1
          AND (p.next_review_at IS NULL OR p.next_review_at <= NOW() OR COALESCE(p.is_mastered,0) = 0)
        ORDER BY COALESCE(p.next_review_at, m.created_at) ASC
        LIMIT 30
    ");
    $stmt->execute([$studentId, $studentId]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $guidance = common_mistake_guidance((string)$row['front']);
        $row['hint'] = $guidance['student_action_en'] ?? '';
        $cards[] = $row;
    }

    return $cards;
}

function flashcards_review(PDO $pdo, int $studentId, string $type, int $id, string $state): void
{
    flashcards_ensure_schema($pdo);
    if (!in_array($state, ['got_it','almost','missed'], true)) {
        throw new InvalidArgumentException('Invalid review state');
    }
    $next = flashcards_next_review($state);
    $mastered = $state === 'got_it' ? 1 : 0;
    $masteredAt = $mastered ? date('Y-m-d H:i:s') : null;

    if ($type === 'word') {
        $check = $pdo->prepare("SELECT id FROM student_weak_words WHERE id = ? AND student_id = ? AND is_active = 1");
        $check->execute([$id, $studentId]);
        if (!$check->fetchColumn()) throw new RuntimeException('Card not found');
        $pdo->prepare("
            INSERT INTO student_weak_words_progress
                (student_id, weak_word_id, is_mastered, mastered_at, review_state, last_reviewed_at, next_review_at, review_count)
            VALUES (?, ?, ?, ?, ?, NOW(), ?, 1)
            ON DUPLICATE KEY UPDATE
                is_mastered = VALUES(is_mastered),
                mastered_at = VALUES(mastered_at),
                review_state = VALUES(review_state),
                last_reviewed_at = NOW(),
                next_review_at = VALUES(next_review_at),
                review_count = review_count + 1
        ")->execute([$studentId, $id, $mastered, $masteredAt, $state, $next]);
    } else {
        $check = $pdo->prepare("SELECT id FROM student_common_mistakes WHERE id = ? AND student_id = ? AND is_active = 1");
        $check->execute([$id, $studentId]);
        if (!$check->fetchColumn()) throw new RuntimeException('Card not found');
        $pdo->prepare("
            INSERT INTO student_common_mistakes_progress
                (student_id, mistake_id, is_mastered, mastered_at, review_state, last_reviewed_at, next_review_at, review_count)
            VALUES (?, ?, ?, ?, ?, NOW(), ?, 1)
            ON DUPLICATE KEY UPDATE
                is_mastered = VALUES(is_mastered),
                mastered_at = VALUES(mastered_at),
                review_state = VALUES(review_state),
                last_reviewed_at = NOW(),
                next_review_at = VALUES(next_review_at),
                review_count = review_count + 1
        ")->execute([$studentId, $id, $mastered, $masteredAt, $state, $next]);
    }
    learning_audit($pdo, 'flashcard_reviewed', $type === 'word' ? 'weak_word' : 'common_mistake', $id, [
        'student_id' => $studentId,
        'state' => $state,
        'next_review_at' => $next,
    ], [], 'student', $studentId);
}
