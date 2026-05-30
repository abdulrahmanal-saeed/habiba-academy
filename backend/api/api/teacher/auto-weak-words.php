<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/review/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

ensure_review_tables($pdo);

$studentId = (int)($_POST['student_id'] ?? 0);
if ($studentId <= 0) json_err('Invalid student ID');

$stmt = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$stmt->execute([$studentId]);
if (!$stmt->fetch()) json_err('Student not found', 404);

function ww_normalize_phrase(string $value): string
{
    $value = trim($value);
    $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
    return $value;
}

function ww_has_arabic(string $value): bool
{
    return preg_match('/[\x{0600}-\x{06FF}]/u', $value) === 1;
}

function ww_extract_phrase(array &$bucket, string $phrase, string $note): void
{
    $phrase = ww_normalize_phrase($phrase);
    if ($phrase === '') {
        return;
    }

    if (!ww_has_arabic($phrase)) {
        return;
    }

    $norm = mb_strtolower($phrase, 'UTF-8');
    if (isset($bucket[$norm])) {
        return;
    }

    $bucket[$norm] = [
        'word' => $phrase,
        'note' => $note,
    ];
}

$candidates = [];

// Homework mistakes: use the correct option text of wrong answers.
$hwStmt = $pdo->prepare("
    SELECT h.title, q.question_text, q.correct_option, q.opt_a, q.opt_b, q.opt_c, q.opt_d, a.chosen_option
    FROM homework_submissions hs
    JOIN homeworks h ON h.id = hs.homework_id
    JOIN homework_mcq_answers a ON a.submission_id = hs.id
    JOIN homework_mcq_questions q ON q.id = a.question_id
    WHERE hs.student_id = ? AND hs.is_submitted = 1 AND a.is_correct = 0
    ORDER BY hs.submitted_at DESC, a.id DESC
    LIMIT 40
");
$hwStmt->execute([$studentId]);
foreach ($hwStmt->fetchAll() as $row) {
    $correctKey = 'opt_' . strtolower((string)$row['correct_option']);
    $correctText = trim((string)($row[$correctKey] ?? ''));
    $note = 'Homework: ' . trim((string)$row['title']);
    ww_extract_phrase($candidates, $correctText, $note);

    // Fallback: if the correct option is not Arabic, try the question text.
    if (!ww_has_arabic($correctText)) {
        ww_extract_phrase($candidates, (string)$row['question_text'], $note);
    }
}

// Review mistakes: use stored auto-breakdown + schema.
$reviewStmt = $pdo->prepare("
    SELECT r.title, r.schema_json, sub.auto_breakdown_json
    FROM student_review_submissions sub
    JOIN student_reviews r ON r.id = sub.review_id
    WHERE sub.student_id = ?
    ORDER BY sub.submitted_at DESC, sub.id DESC
    LIMIT 20
");
$reviewStmt->execute([$studentId]);
foreach ($reviewStmt->fetchAll() as $row) {
    $note = 'Review: ' . trim((string)$row['title']);
    $schema = json_decode((string)$row['schema_json'], true);
    $breakdown = json_decode((string)$row['auto_breakdown_json'], true);
    if (!is_array($schema) || !is_array($breakdown)) {
        continue;
    }
    if (isset($schema['exam']) && is_array($schema['exam'])) {
        $schema = $schema['exam'];
    }

    foreach ((array)($schema['sections'] ?? []) as $section) {
        $sectionId = (string)($section['section_id'] ?? '');

        if ($sectionId === 'mcq') {
            foreach ((array)($section['questions'] ?? []) as $question) {
                $qid = (string)($question['id'] ?? '');
                $item = (array)($breakdown['mcq'][$qid] ?? []);
                if (($item['is_correct'] ?? false) === true) {
                    continue;
                }
                $correctKey = (string)($item['correct'] ?? '');
                $options = (array)($question['options'] ?? []);
                $correctText = trim((string)($options[$correctKey] ?? ''));
                ww_extract_phrase($candidates, $correctText, $note);
                if (!ww_has_arabic($correctText)) {
                    ww_extract_phrase($candidates, (string)($question['question'] ?? ''), $note);
                }
            }
            continue;
        }

        if ($sectionId === 'fill_the_blank') {
            foreach ((array)($section['questions'] ?? []) as $question) {
                $qid = (string)($question['id'] ?? '');
                $item = (array)($breakdown['fill_the_blank'][$qid] ?? []);
                if (($item['is_correct'] ?? false) === true) {
                    continue;
                }
                $correctAnswers = (array)($question['correct_answers'] ?? []);
                if ($correctAnswers) {
                    ww_extract_phrase($candidates, (string)$correctAnswers[0], $note);
                }
            }
            continue;
        }

        if ($sectionId === 'matching') {
            foreach ((array)($section['exercises'] ?? []) as $exercise) {
                $exerciseId = (string)($exercise['id'] ?? '');
                $items = (array)($breakdown['matching'][$exerciseId]['items'] ?? []);
                $rightMap = [];
                foreach ((array)($exercise['right_column'] ?? []) as $right) {
                    $rightMap[(string)($right['id'] ?? '')] = (string)($right['label'] ?? '');
                }
                foreach ($items as $leftId => $item) {
                    if (($item['is_correct'] ?? false) === true) {
                        continue;
                    }
                    $correctRightId = (string)($item['correct'] ?? '');
                    $correctLabel = trim((string)($rightMap[$correctRightId] ?? ''));
                    ww_extract_phrase($candidates, $correctLabel, $note);
                }
            }
        }
    }
}

if (!$candidates) {
    json_ok(['added' => [], 'reactivated' => [], 'count' => 0]);
}

$added = [];
$reactivated = [];

foreach (array_values($candidates) as $item) {
    $word = $item['word'];
    $note = $item['note'];

    $find = $pdo->prepare("
        SELECT id, is_active
        FROM student_weak_words
        WHERE student_id = ? AND LOWER(TRIM(word)) = LOWER(TRIM(?))
        LIMIT 1
    ");
    $find->execute([$studentId, $word]);
    $existing = $find->fetch();

    if ($existing) {
        $upd = $pdo->prepare("
            UPDATE student_weak_words
            SET note = COALESCE(NULLIF(?, ''), note), is_active = 1
            WHERE id = ?
        ");
        $upd->execute([$note, $existing['id']]);
        $reactivated[] = $word;
        continue;
    }

    $ins = $pdo->prepare("
        INSERT INTO student_weak_words (student_id, word, note, created_at, is_active)
        VALUES (?, ?, ?, NOW(), 1)
    ");
    $ins->execute([$studentId, $word, $note]);
    $added[] = $word;
}

json_ok([
    'added' => $added,
    'reactivated' => $reactivated,
    'count' => count($added) + count($reactivated),
]);
