<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/review/helpers.php';
require_once __DIR__ . '/../../lib/learning-audit.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

ensure_review_tables($pdo);

$submissionId = (int)($_POST['submission_id'] ?? 0);
$teacherNote = trim((string)($_POST['teacher_note'] ?? ''));
$scoresJson = trim((string)($_POST['scores_json'] ?? '[]'));
$overridesJson = trim((string)($_POST['overrides_json'] ?? '[]'));

if ($submissionId <= 0) json_err('Invalid submission ID');

$subStmt = $pdo->prepare("
    SELECT s.*, r.schema_json, r.total_points
    FROM student_review_submissions s
    JOIN student_reviews r ON r.id = s.review_id
    WHERE s.id = ?
    LIMIT 1
");
$subStmt->execute([$submissionId]);
$submission = $subStmt->fetch();
if (!$submission) json_err('Submission not found', 404);

try {
    $schema = review_decode_schema((string)$submission['schema_json']);
} catch (RuntimeException $e) {
    json_err($e->getMessage(), 500);
}

$sectionMap = [];
foreach (review_sections($schema) as $section) {
    $sectionMap[(string)($section['section_id'] ?? '')] = $section;
}

$overrides = json_decode($overridesJson, true);
if (!is_array($overrides)) $overrides = [];
$sectionOverrides = [];
foreach ($overrides as $row) {
    $sectionId = (string)($row['section_id'] ?? '');
    $mode = (string)($row['grading_mode'] ?? '');
    if ($sectionId === '' || !isset($sectionMap[$sectionId]) || empty($sectionMap[$sectionId]['auto_gradable'])) {
        continue;
    }
    $sectionOverrides[$sectionId] = $mode === 'manual' ? 'manual' : 'auto';
}

$items = review_manual_items($schema, $sectionOverrides);
$allowed = [];
foreach ($items as $item) {
    $allowed[$item['section_id'] . '::' . $item['item_id']] = $item;
}

$scores = json_decode($scoresJson, true);
if (!is_array($scores)) $scores = [];

$manualScore = 0.0;
$pdo->beginTransaction();
try {
    $pdo->prepare("DELETE FROM student_review_manual_scores WHERE submission_id = ?")->execute([$submissionId]);
    $pdo->prepare("DELETE FROM student_review_section_overrides WHERE submission_id = ?")->execute([$submissionId]);

    $ins = $pdo->prepare("
        INSERT INTO student_review_manual_scores (submission_id, section_id, item_id, max_points, score, teacher_verdict, feedback)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $overrideIns = $pdo->prepare("
        INSERT INTO student_review_section_overrides (submission_id, section_id, grading_mode)
        VALUES (?, ?, ?)
    ");

    foreach ($scores as $row) {
        $sectionId = (string)($row['section_id'] ?? '');
        $itemId = (string)($row['item_id'] ?? '');
        $key = $sectionId . '::' . $itemId;
        if (!isset($allowed[$key])) {
            continue;
        }
        $maxPoints = (float)$allowed[$key]['max_points'];
        $verdict = (string)($row['teacher_verdict'] ?? '');
        $score = max(0.0, min($maxPoints, (float)($row['score'] ?? 0)));
        if ($verdict === 'correct') {
            $score = $maxPoints;
        } elseif ($verdict === 'wrong') {
            $score = 0.0;
        } else {
            $verdict = null;
        }
        $feedback = trim((string)($row['feedback'] ?? ''));
        $manualScore += $score;
        $ins->execute([$submissionId, $sectionId, $itemId, $maxPoints, $score, $verdict, $feedback ?: null]);
    }

    foreach ($sectionOverrides as $sectionId => $mode) {
        $overrideIns->execute([$submissionId, $sectionId, $mode]);
    }

    $autoBreakdown = json_decode((string)($submission['auto_breakdown_json'] ?? '{}'), true);
    if (!is_array($autoBreakdown)) $autoBreakdown = [];
    $effectiveAutoScore = review_effective_auto_score($schema, $autoBreakdown, $sectionOverrides);
    $totalScore = (int)round($effectiveAutoScore + $manualScore);
    $upd = $pdo->prepare("
        UPDATE student_review_submissions
        SET manual_score = ?,
            total_score = ?,
            teacher_note = ?,
            review_status = 'reviewed',
            reviewed_at = NOW()
        WHERE id = ?
    ");
    $upd->execute([(int)round($manualScore), $totalScore, $teacherNote ?: null, $submissionId]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Failed to save review');
}

learning_audit($pdo, 'review_feedback_saved', 'review_submission', $submissionId, [
    'review_id' => (int)$submission['review_id'],
    'student_id' => (int)$submission['student_id'],
    'manual_score' => (int)round($manualScore),
    'total_score' => $totalScore,
    'teacher_note' => $teacherNote,
], [
    'manual_score' => $submission['manual_score'] ?? null,
    'total_score' => $submission['total_score'] ?? null,
    'review_status' => $submission['review_status'] ?? null,
], 'teacher', null);

json_ok([
    'submission_id' => $submissionId,
    'auto_score' => $effectiveAutoScore,
    'manual_score' => (int)round($manualScore),
    'total_score' => $totalScore,
    'total_points' => (int)$submission['total_points'],
]);
