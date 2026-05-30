<?php
// api/teacher/auto-mistakes.php - Rule-based mistake generation from student work
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/review/helpers.php';
require_once __DIR__ . '/../../lib/ai-system.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

ensure_review_tables($pdo);
ai_ensure_tables($pdo);

$studentId = (int)($_POST['student_id'] ?? 0);
$language = strtolower(trim((string)($_POST['language'] ?? 'en'))) === 'ar' ? 'ar' : 'en';
if ($studentId <= 0) json_err('Invalid student ID');

$check = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$check->execute([$studentId]);
if (!$check->fetch()) json_err('Student not found', 404);

$taxonomy = [];
foreach (ai_active_taxonomy($pdo) as $row) {
    $taxonomy[(string)$row['code']] = $row;
}

$candidates = [];
$addCandidate = static function (
    string $code,
    string $sourceType,
    ?int $sourceId,
    ?string $questionId,
    string $evidence,
    string $note,
    string $severity = 'medium'
) use (&$candidates, $taxonomy): void {
    if (!isset($taxonomy[$code])) {
        return;
    }
    $key = $code . '|' . $sourceType . '|' . (string)$sourceId . '|' . (string)$questionId . '|' . md5($evidence);
    if (isset($candidates[$key])) {
        return;
    }
    $candidates[$key] = [
        'taxonomy' => $taxonomy[$code],
        'source_type' => $sourceType,
        'source_id' => $sourceId,
        'source_question_id' => $questionId,
        'evidence_text' => mb_substr($evidence, 0, 500, 'UTF-8'),
        'teacher_note' => $note,
        'severity' => in_array($severity, ['low','medium','high'], true) ? $severity : 'medium',
    ];
};

$hasArabic = static fn(string $value): bool => preg_match('/[\x{0600}-\x{06FF}]/u', $value) === 1;
$analyzeText = static function (string $text, string $sourceType, ?int $sourceId, ?string $questionId, string $note) use ($addCandidate, $hasArabic): void {
    $text = trim($text);
    if ($text === '') {
        $addCandidate('task_incomplete', $sourceType, $sourceId, $questionId, 'No answer submitted', $note, 'high');
        return;
    }
    if (mb_strlen($text, 'UTF-8') < 12) {
        $addCandidate('sentence_incomplete', $sourceType, $sourceId, $questionId, $text, $note, 'medium');
    }
    if (preg_match('/[a-z]{4,}/i', $text) && !$hasArabic($text)) {
        $addCandidate('vocabulary_missing_word', $sourceType, $sourceId, $questionId, $text, $note, 'medium');
    }
    if (preg_match('/\s{2,}/u', $text)) {
        $addCandidate('grammar_word_order', $sourceType, $sourceId, $questionId, $text, $note, 'low');
    }
    if (str_contains($text, 'هذا') || str_contains($text, 'هذه') || str_contains(mb_strtolower($text, 'UTF-8'), 'masculine') || str_contains(mb_strtolower($text, 'UTF-8'), 'feminine')) {
        $addCandidate('grammar_gender', $sourceType, $sourceId, $questionId, $text, $note, 'medium');
    }
};

// Homework auto-graded mistakes.
$stmt = $pdo->prepare("
    SELECT h.id AS homework_id, h.title, q.id AS question_id, q.question_text, q.correct_option, a.chosen_option
    FROM homework_submissions hs
    JOIN homeworks h ON h.id = hs.homework_id
    JOIN homework_mcq_answers a ON a.submission_id = hs.id
    JOIN homework_mcq_questions q ON q.id = a.question_id
    WHERE hs.student_id = ? AND hs.is_submitted = 1 AND a.is_correct = 0
    ORDER BY hs.submitted_at DESC, a.id DESC
    LIMIT 50
");
$stmt->execute([$studentId]);
foreach ($stmt->fetchAll() as $row) {
    $evidence = 'Wrong MCQ: ' . trim((string)$row['question_text']);
    $note = 'Homework: ' . trim((string)$row['title']);
    $addCandidate('vocabulary_wrong_word', 'homework', (int)$row['homework_id'], (string)$row['question_id'], $evidence, $note);
}

// Homework writing answers are teacher-reviewed, so these are only conservative signals.
$stmt = $pdo->prepare("
    SELECT h.id AS homework_id, h.title, q.id AS question_id, q.prompt, a.answer_text
    FROM homework_submissions hs
    JOIN homeworks h ON h.id = hs.homework_id
    JOIN homework_writing_answers a ON a.submission_id = hs.id
    JOIN homework_writing_questions q ON q.id = a.writing_question_id
    WHERE hs.student_id = ? AND hs.is_submitted = 1
    ORDER BY hs.submitted_at DESC, a.id DESC
    LIMIT 40
");
$stmt->execute([$studentId]);
foreach ($stmt->fetchAll() as $row) {
    $analyzeText((string)$row['answer_text'], 'homework', (int)$row['homework_id'], (string)$row['question_id'], 'Homework writing: ' . trim((string)$row['title']));
}

// Review auto-graded mistakes.
$stmt = $pdo->prepare("
    SELECT r.id AS review_id, r.title, r.schema_json, sub.answers_json, sub.auto_breakdown_json
    FROM student_review_submissions sub
    JOIN student_reviews r ON r.id = sub.review_id
    WHERE sub.student_id = ?
    ORDER BY sub.submitted_at DESC, sub.id DESC
    LIMIT 25
");
$stmt->execute([$studentId]);
foreach ($stmt->fetchAll() as $row) {
    $note = 'Review: ' . trim((string)$row['title']);
    $breakdown = json_decode((string)$row['auto_breakdown_json'], true);
    $answers = json_decode((string)$row['answers_json'], true);
    if (is_array($breakdown)) {
        foreach ((array)($breakdown['mcq'] ?? []) as $qid => $item) {
            if (($item['is_correct'] ?? false) !== true) {
                $addCandidate('vocabulary_wrong_word', 'review', (int)$row['review_id'], (string)$qid, 'Wrong review MCQ answer', $note);
            }
        }
        foreach ((array)($breakdown['fill_the_blank'] ?? []) as $qid => $item) {
            if (($item['is_correct'] ?? false) !== true) {
                $addCandidate('vocabulary_missing_word', 'review', (int)$row['review_id'], (string)$qid, 'Wrong fill-the-blank answer', $note);
            }
        }
        foreach ((array)($breakdown['matching'] ?? []) as $exerciseId => $exercise) {
            foreach ((array)($exercise['items'] ?? []) as $leftId => $item) {
                if (($item['is_correct'] ?? false) !== true) {
                    $addCandidate('vocabulary_wrong_word', 'review', (int)$row['review_id'], (string)$exerciseId . ':' . (string)$leftId, 'Wrong matching answer', $note);
                }
            }
        }
    }
    if (is_array($answers)) {
        foreach ((array)($answers['writing'] ?? []) as $qid => $answer) {
            $analyzeText((string)$answer, 'review', (int)$row['review_id'], (string)$qid, $note . ' writing');
        }
    }
}

// Manual review feedback can be converted into approved patterns.
$stmt = $pdo->prepare("
    SELECT r.id AS review_id, r.title, ms.section_id, ms.item_id, ms.max_points, ms.score, ms.feedback
    FROM student_review_manual_scores ms
    JOIN student_review_submissions sub ON sub.id = ms.submission_id
    JOIN student_reviews r ON r.id = sub.review_id
    WHERE sub.student_id = ? AND ms.score < ms.max_points
    ORDER BY sub.reviewed_at DESC, ms.id DESC
    LIMIT 40
");
$stmt->execute([$studentId]);
foreach ($stmt->fetchAll() as $row) {
    $feedback = trim((string)$row['feedback']);
    $note = 'Teacher review feedback: ' . trim((string)$row['title']);
    $lower = mb_strtolower($feedback, 'UTF-8');
    if ($feedback === '') {
        $addCandidate('task_incomplete', 'review', (int)$row['review_id'], (string)$row['item_id'], 'Low manual score without feedback', $note);
        continue;
    }
    $analyzeText($feedback, 'review', (int)$row['review_id'], (string)$row['item_id'], $note);
    if (str_contains($lower, 'pronunciation') || str_contains($lower, 'نطق')) {
        $addCandidate('pronunciation_clarity', 'review', (int)$row['review_id'], (string)$row['item_id'], $feedback, $note);
    }
    if (str_contains($lower, 'hesitation') || str_contains($lower, 'fluency') || str_contains($lower, 'تردد') || str_contains($lower, 'طلاقة')) {
        $addCandidate('fluency_hesitation', 'review', (int)$row['review_id'], (string)$row['item_id'], $feedback, $note);
    }
}

if (!$candidates) {
    json_ok(['added' => [], 'reactivated' => [], 'events' => 0, 'count' => 0]);
}

$added = [];
$reactivated = [];
$events = 0;

foreach (array_values($candidates) as $candidate) {
    $tax = $candidate['taxonomy'];
    $tag = $language === 'ar' && !empty($tax['label_ar']) ? (string)$tax['label_ar'] : (string)$tax['label_en'];
    $note = (string)$candidate['teacher_note'];

    $find = $pdo->prepare("
        SELECT id, is_active
        FROM student_common_mistakes
        WHERE student_id = ? AND LOWER(TRIM(tag)) = LOWER(TRIM(?))
        LIMIT 1
    ");
    $find->execute([$studentId, $tag]);
    $existing = $find->fetch();

    if ($existing) {
        if ($note !== '') {
            $upd = $pdo->prepare("UPDATE student_common_mistakes SET note = ?, is_active = 1 WHERE id = ?");
            $upd->execute([$note, (int)$existing['id']]);
        } else {
            $upd = $pdo->prepare("UPDATE student_common_mistakes SET is_active = 1 WHERE id = ?");
            $upd->execute([(int)$existing['id']]);
        }
        $reactivated[] = $tag;
    } else {
        $ins = $pdo->prepare("
            INSERT INTO student_common_mistakes (student_id, tag, note, created_at, is_active)
            VALUES (?, ?, ?, NOW(), 1)
        ");
        $ins->execute([$studentId, $tag, $note]);
        $added[] = $tag;
    }

    $existsEvent = $pdo->prepare("
        SELECT id
        FROM student_mistake_events
        WHERE student_id = ?
          AND taxonomy_id = ?
          AND source_type = ?
          AND source_id <=> ?
          AND source_question_id <=> ?
          AND status = 'approved'
        LIMIT 1
    ");
    $existsEvent->execute([
        $studentId,
        (int)$tax['id'],
        $candidate['source_type'],
        $candidate['source_id'],
        $candidate['source_question_id'],
    ]);
    if (!$existsEvent->fetch()) {
        $event = $pdo->prepare("
            INSERT INTO student_mistake_events
                (student_id, taxonomy_id, source_type, source_id, source_question_id, evidence_text, teacher_note, severity, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')
        ");
        $event->execute([
            $studentId,
            (int)$tax['id'],
            $candidate['source_type'],
            $candidate['source_id'],
            $candidate['source_question_id'],
            $candidate['evidence_text'],
            $note,
            $candidate['severity'],
        ]);
        $events++;
    }
}

json_ok([
    'added' => array_values(array_unique($added)),
    'reactivated' => array_values(array_unique($reactivated)),
    'events' => $events,
    'count' => count(array_unique($added)) + count(array_unique($reactivated)),
]);
