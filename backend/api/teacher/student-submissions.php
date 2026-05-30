<?php
// api/teacher/student-submissions.php — Return publishable work items for a teacher
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/review/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
ensure_review_tables($pdo);
ensure_publish_schedule_support($pdo);

$student_id = (int)($_GET['student_id'] ?? 0);
if ($student_id <= 0) json_err('Invalid student ID');

$items = [];

$rows = $pdo->prepare("
    SELECT h.id, h.title, h.hw_date, h.publish_at, h.status,
           COALESCE(hs.is_submitted, 0) AS is_submitted,
           hs.mcq_score, hs.mcq_total, hs.submitted_at, hs.teacher_note
    FROM homeworks h
    LEFT JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_id = h.student_id
    WHERE h.student_id = ?
    ORDER BY COALESCE(h.publish_at, CONCAT(h.hw_date, ' 00:00:00')) DESC, h.id DESC
");
$rows->execute([$student_id]);
foreach ($rows->fetchAll() as $row) {
    $publishAt = effective_publish_at($row['publish_at'] ?? null, $row['hw_date'] ?? null);
    $items[] = [
        'id'              => (int)$row['id'],
        'item_type'       => 'homework',
        'title'           => $row['title'],
        'hw_date'         => $publishAt ? format_app_datetime($publishAt, 'd/m/Y') : $row['hw_date'],
        'sort_at'         => $publishAt ?: ($row['hw_date'] . ' 00:00:00'),
        'status'          => $row['status'],
        'effective_status'=> effective_publish_status($row['status'], $row['publish_at'] ?? null, $row['hw_date'] ?? null),
        'is_submitted'    => (bool)$row['is_submitted'],
        'mcq_score'       => $row['mcq_score'] !== null ? (int)$row['mcq_score'] : 0,
        'mcq_total'       => $row['mcq_total'] !== null ? (int)$row['mcq_total'] : 0,
        'submitted_at'    => $row['submitted_at'] ? format_app_datetime((string)$row['submitted_at']) : null,
        'teacher_note'    => $row['teacher_note'] ?? null,
    ];
}

$reviewStmt = $pdo->prepare("
    SELECT r.id, r.title, r.review_date, r.publish_at, r.status, r.total_points,
           s.id AS submission_id, s.total_score, s.review_status, s.submitted_at, s.teacher_note,
           r.review_type
    FROM student_reviews r
    LEFT JOIN student_review_submissions s ON s.review_id = r.id AND s.student_id = r.student_id
    WHERE r.student_id = ?
    ORDER BY COALESCE(r.publish_at, CONCAT(r.review_date, ' 00:00:00')) DESC, r.id DESC
");
$reviewStmt->execute([$student_id]);
foreach ($reviewStmt->fetchAll() as $row) {
    $publishAt = effective_publish_at($row['publish_at'] ?? null, $row['review_date'] ?? null);
    $items[] = [
        'id'              => (int)$row['id'],
        'item_type'       => 'review',
        'title'           => ($row['review_type'] === 'monthly_review' ? 'Monthly Review' : 'Weekly Review') . ' · ' . $row['title'],
        'hw_date'         => $publishAt ? format_app_datetime($publishAt, 'd/m/Y') : $row['review_date'],
        'sort_at'         => $publishAt ?: ($row['review_date'] . ' 00:00:00'),
        'status'          => $row['status'],
        'effective_status'=> effective_publish_status($row['status'], $row['publish_at'] ?? null, $row['review_date'] ?? null),
        'is_submitted'    => !empty($row['submission_id']),
        'mcq_score'       => $row['total_score'] !== null ? (int)$row['total_score'] : 0,
        'mcq_total'       => (int)$row['total_points'],
        'submitted_at'    => $row['submitted_at'] ? format_app_datetime((string)$row['submitted_at']) : null,
        'teacher_note'    => $row['teacher_note'] ?? null,
        'review_status'   => $row['review_status'] ?: null,
    ];
}

$scenarioStmt = $pdo->prepare("
    SELECT sc.id, sc.title, sc.sc_date, sc.publish_at, sc.status,
           COUNT(sr.id) AS recordings_count,
           MAX(sr.submitted_at) AS submitted_at
    FROM scenarios sc
    LEFT JOIN scenario_recordings sr ON sr.scenario_id = sc.id AND sr.student_id = sc.student_id
    WHERE sc.student_id = ?
    GROUP BY sc.id, sc.title, sc.sc_date, sc.publish_at, sc.status
    ORDER BY COALESCE(sc.publish_at, CONCAT(sc.sc_date, ' 00:00:00')) DESC, sc.id DESC
");
$scenarioStmt->execute([$student_id]);
foreach ($scenarioStmt->fetchAll() as $row) {
    $publishAt = effective_publish_at($row['publish_at'] ?? null, $row['sc_date'] ?? null);
    $items[] = [
        'id'               => (int)$row['id'],
        'item_type'        => 'scenario',
        'title'            => $row['title'],
        'hw_date'          => $publishAt ? format_app_datetime($publishAt, 'd/m/Y') : $row['sc_date'],
        'sort_at'          => $publishAt ?: ($row['sc_date'] . ' 00:00:00'),
        'status'           => $row['status'],
        'effective_status' => effective_publish_status($row['status'], $row['publish_at'] ?? null, $row['sc_date'] ?? null),
        'is_submitted'     => ((int)$row['recordings_count']) > 0,
        'mcq_score'        => 0,
        'mcq_total'        => 0,
        'submitted_at'     => $row['submitted_at'] ? format_app_datetime((string)$row['submitted_at']) : null,
        'recordings_count' => (int)$row['recordings_count'],
    ];
}

usort($items, static function (array $a, array $b): int {
    return strcmp((string)$b['sort_at'], (string)$a['sort_at']);
});

json_ok(['submissions' => $items]);
