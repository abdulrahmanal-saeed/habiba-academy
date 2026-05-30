<?php
// api/student/scenarios.php — List all published scenarios for the student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
$student_id = (int)$_SESSION['student_id'];

ensure_publish_schedule_support($pdo);

$stmt = $pdo->prepare("
    SELECT sc.id, sc.title, sc.sc_date, sc.publish_at, sc.time_limit_seconds,
           sc.situation, sc.prompt, sc.model_answer,
           (SELECT GROUP_CONCAT(keyword ORDER BY id ASC SEPARATOR '|||')
            FROM scenario_keywords WHERE scenario_id = sc.id) AS kw_concat,
           (SELECT COUNT(*) FROM scenario_recordings sr
            WHERE sr.scenario_id = sc.id AND sr.student_id = :sid_sub) AS recording_count
    FROM   scenarios sc
    WHERE  sc.student_id = :sid
      AND  sc.status = 'published'
      AND  COALESCE(sc.publish_at, CONCAT(sc.sc_date, ' 00:00:00')) <= NOW()
    ORDER  BY sc.sc_date DESC, sc.id DESC
");
$stmt->execute([':sid' => $student_id, ':sid_sub' => $student_id]);
$rows = $stmt->fetchAll();

$items = [];
foreach ($rows as $r) {
    $items[] = [
        'id'                 => (int)$r['id'],
        'title'              => $r['title'],
        'sc_date'            => $r['sc_date'],
        'publish_at'         => $r['publish_at'],
        'time_limit_seconds' => (int)$r['time_limit_seconds'],
        'situation'          => $r['situation'],
        'prompt'             => $r['prompt'],
        'keywords'           => $r['kw_concat'] ? explode('|||', (string)$r['kw_concat']) : [],
        'model_answer'       => $r['model_answer'],
        'recording_count'    => (int)$r['recording_count'],
    ];
}

json_ok(['items' => $items]);
