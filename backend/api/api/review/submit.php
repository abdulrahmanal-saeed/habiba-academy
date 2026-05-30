<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/review/helpers.php';
require_once __DIR__ . '/../../lib/learning-audit.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
csrf_validate();

ensure_review_tables($pdo);
ensure_publish_schedule_support($pdo);

$studentId = (int)$_SESSION['student_id'];
$reviewId = (int)($_POST['review_id'] ?? 0);
if ($reviewId <= 0) json_err('Invalid review ID');

$reviewStmt = $pdo->prepare("
    SELECT *
    FROM student_reviews
    WHERE id = ? AND student_id = ? AND status = 'published'
      AND COALESCE(publish_at, CONCAT(review_date, ' 00:00:00')) <= NOW()
    LIMIT 1
");
$reviewStmt->execute([$reviewId, $studentId]);
$review = $reviewStmt->fetch();
if (!$review) json_err('Review not found', 404);

$subStmt = $pdo->prepare("SELECT id, review_status FROM student_review_submissions WHERE review_id = ? AND student_id = ? LIMIT 1");
$subStmt->execute([$reviewId, $studentId]);
$existing = $subStmt->fetch();
if ($existing) {
    json_err('Review already submitted.');
}

try {
    $schema = review_decode_schema((string)$review['schema_json']);
} catch (RuntimeException $e) {
    json_err($e->getMessage(), 500);
}

$answers = [
    'mcq' => (array)($_POST['mcq'] ?? []),
    'matching' => (array)($_POST['matching'] ?? []),
    'fill_the_blank' => (array)($_POST['fill_the_blank'] ?? []),
    'writing' => (array)($_POST['writing'] ?? []),
    'speaking' => [],
    'scenario' => [],
];

foreach ((array)($answers['mcq']) as $qid => $value) {
    $answers['mcq'][(string)$qid] = strtoupper(trim((string)$value));
}

foreach ((array)($answers['matching']) as $exerciseId => $pairs) {
    $answers['matching'][(string)$exerciseId] = [];
    foreach ((array)$pairs as $leftId => $rightId) {
        $answers['matching'][(string)$exerciseId][(string)$leftId] = trim((string)$rightId);
    }
}

foreach ((array)($answers['fill_the_blank']) as $qid => $value) {
    $answers['fill_the_blank'][(string)$qid] = trim((string)$value);
}

foreach ((array)($_POST['writing'] ?? []) as $qid => $value) {
    $answers['writing'][(string)$qid] = trim((string)$value);
}

$audioRoot = __DIR__ . '/../../uploads/reviews/' . $studentId . '/' . $reviewId . '/';
if (!is_dir($audioRoot)) {
    mkdir($audioRoot, 0755, true);
}

foreach ((array)$_FILES as $field => $info) {
    if (!preg_match('/^(speaking|scenario)__(.+)$/', (string)$field, $m)) {
        continue;
    }
    if (($info['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        continue;
    }
    $kind = $m[1];
    $itemId = $m[2];
    try {
        $saved = save_audio($info, $audioRoot, $kind . '_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $itemId));
        $answers[$kind][$itemId] = $saved;
    } catch (RuntimeException $e) {
        json_err('Invalid audio for ' . $itemId . ': ' . $e->getMessage());
    }
}

$missing = [];
foreach (review_sections($schema) as $section) {
    $sectionId = (string)($section['section_id'] ?? '');

    if ($sectionId === 'mcq') {
        foreach ((array)($section['questions'] ?? []) as $question) {
            $qid = (string)($question['id'] ?? '');
            if (trim((string)($answers['mcq'][$qid] ?? '')) === '') {
                $missing[] = 'mcq:' . $qid;
            }
        }
    }

    if ($sectionId === 'matching') {
        foreach ((array)($section['exercises'] ?? []) as $exercise) {
            $exerciseId = (string)($exercise['id'] ?? '');
            foreach ((array)($exercise['left_column'] ?? []) as $left) {
                $leftId = (string)($left['id'] ?? '');
                if (trim((string)($answers['matching'][$exerciseId][$leftId] ?? '')) === '') {
                    $missing[] = 'matching:' . $exerciseId . ':' . $leftId;
                }
            }
        }
    }

    if ($sectionId === 'fill_the_blank') {
        foreach ((array)($section['questions'] ?? []) as $question) {
            $qid = (string)($question['id'] ?? '');
            if (trim((string)($answers['fill_the_blank'][$qid] ?? '')) === '') {
                $missing[] = 'fill_the_blank:' . $qid;
            }
        }
    }

    if ($sectionId === 'writing') {
        foreach ((array)($section['questions'] ?? []) as $question) {
            $qid = (string)($question['id'] ?? '');
            if (trim((string)($answers['writing'][$qid] ?? '')) === '') {
                $missing[] = 'writing:' . $qid;
            }
        }
    }

    if ($sectionId === 'speaking') {
        foreach ((array)($section['questions'] ?? []) as $question) {
            $qid = (string)($question['id'] ?? '');
            if (trim((string)($answers['speaking'][$qid] ?? '')) === '') {
                $missing[] = 'speaking:' . $qid;
            }
        }
    }

    if ($sectionId === 'scenario') {
        foreach ((array)($section['scenarios'] ?? []) as $scenario) {
            $qid = (string)($scenario['id'] ?? '');
            if (trim((string)($answers['scenario'][$qid] ?? '')) === '') {
                $missing[] = 'scenario:' . $qid;
            }
        }
    }
}

if ($missing) {
    json_err('Please complete all review questions before submitting.');
}

$auto = review_auto_grade($schema, $answers);

$insert = $pdo->prepare("
    INSERT INTO student_review_submissions
        (review_id, student_id, answers_json, auto_breakdown_json, auto_score, review_status, submitted_at)
    VALUES (?, ?, ?, ?, ?, 'pending', NOW())
");
$insert->execute([
    $reviewId,
    $studentId,
    json_encode($answers, JSON_UNESCAPED_UNICODE),
    json_encode($auto['breakdown'], JSON_UNESCAPED_UNICODE),
    $auto['score'],
]);
$submissionId = (int)$pdo->lastInsertId();

learning_audit($pdo, 'review_submitted', 'review', $reviewId, [
    'student_id' => $studentId,
    'submission_id' => $submissionId,
    'auto_score' => $auto['score'],
], [], 'student', $studentId);

json_ok([
    'review_id' => $reviewId,
    'submission_id' => $submissionId,
    'auto_score' => $auto['score'],
]);
