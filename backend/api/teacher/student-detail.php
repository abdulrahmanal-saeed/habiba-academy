<?php
// api/teacher/student-detail.php — Quick profile + stats for a single student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/lesson-schedule.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))   json_err('Not authenticated', 401);

$student_id = (int)($_GET['student_id'] ?? 0);
if ($student_id <= 0) json_err('Invalid student ID');

$student = $pdo->prepare("SELECT id, full_name, login_code, level, is_active, last_seen FROM students WHERE id = ?");
$student->execute([$student_id]);
$row = $student->fetch(PDO::FETCH_ASSOC);
if (!$row) json_err('Student not found', 404);

// submitted_count = hw_submissions + review_submissions
$hwCount = 0;
try {
    $st = $pdo->prepare("SELECT COUNT(*) FROM homework_submissions WHERE student_id = ? AND is_submitted = 1");
    $st->execute([$student_id]);
    $hwCount = (int)$st->fetchColumn();
} catch (Throwable) {}

$revCount = 0;
try {
    $st = $pdo->prepare("SELECT COUNT(*) FROM student_review_submissions WHERE student_id = ?");
    $st->execute([$student_id]);
    $revCount = (int)$st->fetchColumn();
} catch (Throwable) {}

// avg_score = AVG of scored hw + review, rounded integer
$avgScore = 0;
try {
    $st = $pdo->prepare("
        SELECT ROUND(AVG(pct) * 100) AS avg_pct
        FROM (
            SELECT (hs.mcq_score / NULLIF(hs.mcq_total, 0)) AS pct
            FROM homework_submissions hs
            WHERE hs.student_id = ? AND hs.is_submitted = 1 AND hs.mcq_total > 0
            UNION ALL
            SELECT (srs.total_score / NULLIF(r.total_points, 0)) AS pct
            FROM student_review_submissions srs
            JOIN student_reviews r ON r.id = srs.review_id
            WHERE srs.student_id = ? AND r.total_points > 0
        ) AS scores
    ");
    $st->execute([$student_id, $student_id]);
    $avgScore = (int)round((float)($st->fetchColumn() ?: 0));
} catch (Throwable) {}

// recordings_count
$recCount = 0;
try {
    $st = $pdo->prepare("SELECT COUNT(*) FROM scenario_recordings WHERE student_id = ?");
    $st->execute([$student_id]);
    $recCount = (int)$st->fetchColumn();
} catch (Throwable) {}

// lesson balance
$balances = lesson_package_balances($pdo, [$student_id]);
$bal = $balances[$student_id] ?? null;

json_ok([
    'id'              => (int)$row['id'],
    'full_name'       => (string)$row['full_name'],
    'login_code'      => (string)$row['login_code'],
    'level'           => (string)($row['level'] ?? 'A2'),
    'is_active'       => (bool)$row['is_active'],
    'last_seen'       => $row['last_seen'],
    'submitted_count' => $hwCount + $revCount,
    'avg_score'       => $avgScore,
    'recordings_count'=> $recCount,
    'balance'         => $bal ? [
        'package_name'       => (string)$bal['package_name'],
        'used_sessions'      => (int)$bal['used_sessions'],
        'contract_sessions'  => (int)$bal['contract_sessions'],
        'remaining_sessions' => (int)$bal['remaining_sessions'],
    ] : null,
]);
