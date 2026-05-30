<?php
// api/student/scenario-detail.php — Scenario detail + recordings for the student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
$student_id  = (int)$_SESSION['student_id'];
$scenario_id = (int)($_GET['scenario_id'] ?? 0);
if (!$scenario_id) json_err('Missing scenario_id');

ensure_publish_schedule_support($pdo);

// Load scenario — verify ownership and published status
$scStmt = $pdo->prepare("
    SELECT id, title, sc_date, publish_at, time_limit_seconds,
           situation, prompt, model_answer
    FROM   scenarios
    WHERE  id = ? AND student_id = ? AND status = 'published'
      AND  COALESCE(publish_at, CONCAT(sc_date, ' 00:00:00')) <= NOW()
    LIMIT  1
");
$scStmt->execute([$scenario_id, $student_id]);
$sc = $scStmt->fetch();
if (!$sc) json_err('Scenario not found', 404);

// Keywords
$kwStmt = $pdo->prepare(
    "SELECT keyword FROM scenario_keywords WHERE scenario_id = ? ORDER BY id ASC"
);
$kwStmt->execute([$scenario_id]);
$keywords = array_column($kwStmt->fetchAll(), 'keyword');

// Recordings with feedback chips, newest take first
$recStmt = $pdo->prepare("
    SELECT sr.id, sr.take_no, sr.audio_path, sr.teacher_note, sr.submitted_at,
           GROUP_CONCAT(sfc.feedback_text ORDER BY sfc.id ASC SEPARATOR '|||') AS chips
    FROM   scenario_recordings sr
    LEFT JOIN scenario_feedback_chips sfc ON sfc.recording_id = sr.id
    WHERE  sr.scenario_id = ? AND sr.student_id = ?
    GROUP  BY sr.id
    ORDER  BY sr.take_no DESC
");
$recStmt->execute([$scenario_id, $student_id]);
$recRows = $recStmt->fetchAll();

$recordings = [];
foreach ($recRows as $r) {
    $path = (string)$r['audio_path'];
    if ($path !== '' && $path[0] !== '/') $path = '/' . $path;
    $recordings[] = [
        'id'           => (int)$r['id'],
        'take_no'      => (int)$r['take_no'],
        'audio_path'   => $path,
        'teacher_note' => $r['teacher_note'] ?? null,
        'submitted_at' => $r['submitted_at']
            ? format_app_datetime((string)$r['submitted_at'])
            : null,
        'chips'        => $r['chips']
            ? array_map('trim', explode('|||', (string)$r['chips']))
            : [],
    ];
}

$next_take = count($recordings) > 0 ? (int)$recordings[0]['take_no'] + 1 : 1;

json_ok([
    'data' => [
        'scenario'   => [
            'id'                 => (int)$sc['id'],
            'title'              => $sc['title'],
            'sc_date'            => $sc['sc_date'],
            'publish_at'         => $sc['publish_at'],
            'time_limit_seconds' => (int)$sc['time_limit_seconds'],
            'situation'          => $sc['situation'],
            'prompt'             => $sc['prompt'],
            'keywords'           => $keywords,
            'model_answer'       => $sc['model_answer'],
            'recording_count'    => count($recordings),
        ],
        'recordings' => $recordings,
        'next_take'  => $next_take,
    ],
]);
