<?php
// api/teacher/review-submission.php — Load submission details for teacher grading
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/review/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

ensure_review_tables($pdo);

$submissionId = (int)($_GET['submission_id'] ?? 0);
if ($submissionId <= 0) json_err('Invalid submission ID');

$stmt = $pdo->prepare("
    SELECT s.id, s.review_id, s.student_id, s.answers_json, s.auto_breakdown_json,
           s.auto_score, s.manual_score, s.total_score, s.teacher_note,
           s.review_status, s.submitted_at, s.reviewed_at,
           r.schema_json, r.total_points, r.title, r.review_type
    FROM student_review_submissions s
    JOIN student_reviews r ON r.id = s.review_id
    WHERE s.id = ?
    LIMIT 1
");
$stmt->execute([$submissionId]);
$submission = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$submission) json_err('Submission not found', 404);

$scoresStmt = $pdo->prepare("
    SELECT section_id, item_id, max_points, score, teacher_verdict, feedback
    FROM student_review_manual_scores
    WHERE submission_id = ?
");
$scoresStmt->execute([$submissionId]);
$manualScores = $scoresStmt->fetchAll(PDO::FETCH_ASSOC);

$overridesStmt = $pdo->prepare("
    SELECT section_id, grading_mode
    FROM student_review_section_overrides
    WHERE submission_id = ?
");
$overridesStmt->execute([$submissionId]);
$sectionOverrides = $overridesStmt->fetchAll(PDO::FETCH_ASSOC);

$scores = array_map(static function (array $row): array {
    return [
        'section_id'      => $row['section_id'],
        'item_id'         => $row['item_id'],
        'max_points'      => (int)$row['max_points'],
        'score'           => (int)$row['score'],
        'teacher_verdict' => $row['teacher_verdict'],
        'feedback'        => $row['feedback'] ?? '',
    ];
}, $manualScores);

$overrides = array_map(static function (array $row): array {
    return [
        'section_id'   => $row['section_id'],
        'grading_mode' => $row['grading_mode'],
    ];
}, $sectionOverrides);

json_ok([
    'submission' => [
        'id'             => (int)$submission['id'],
        'review_id'      => (int)$submission['review_id'],
        'student_id'     => (int)$submission['student_id'],
        'answers_json'   => $submission['answers_json'],
        'auto_score'     => $submission['auto_score']  !== null ? (int)$submission['auto_score']  : null,
        'manual_score'   => $submission['manual_score'] !== null ? (int)$submission['manual_score'] : null,
        'total_score'    => $submission['total_score']  !== null ? (int)$submission['total_score']  : null,
        'teacher_note'   => $submission['teacher_note'],
        'review_status'  => $submission['review_status'],
        'submitted_at'   => $submission['submitted_at'],
        'reviewed_at'    => $submission['reviewed_at'],
    ],
    'review' => [
        'title'        => $submission['title'],
        'review_type'  => $submission['review_type'],
        'total_points' => (int)$submission['total_points'],
        'schema_json'  => $submission['schema_json'],
    ],
    'manual_scores'     => $scores,
    'section_overrides' => $overrides,
]);
