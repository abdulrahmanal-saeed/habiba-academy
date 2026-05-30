<?php
// api/teacher/student-conversations.php — Return all scenario recordings for a student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$student_id = (int)($_GET['student_id'] ?? 0);
if ($student_id <= 0) json_err('Invalid student ID');

$rows = $pdo->prepare("
    SELECT sr.id, sc.id AS scenario_id, sc.title, sc.sc_date,
           sr.take_no AS take_number, sr.audio_path AS recording_path, sr.submitted_at, sr.teacher_note,
           (SELECT GROUP_CONCAT(feedback_text ORDER BY id SEPARATOR ',')
            FROM scenario_feedback_chips WHERE recording_id = sr.id) AS chips
    FROM   scenario_recordings sr
    JOIN   scenarios sc ON sc.id = sr.scenario_id
    WHERE  sr.student_id = ?
    ORDER  BY sr.submitted_at DESC
");
$rows->execute([$student_id]);
$data = $rows->fetchAll();

// Build chips array and audio src
foreach ($data as &$row) {
    $row['chips']      = $row['chips'] ? explode(',', $row['chips']) : [];
    $row['audio_src']  = $row['recording_path'] ? '/' . ltrim($row['recording_path'], '/') : null;
}

json_ok(['conversations' => $data]);
