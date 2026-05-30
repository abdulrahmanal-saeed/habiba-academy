<?php
// api/teacher/student-scenarios.php — List scenarios for a student (teacher view)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$student_id = (int)($_GET['student_id'] ?? 0);
if ($student_id <= 0) json_err('Invalid student ID');

$stmt = $pdo->prepare("
    SELECT s.id, s.title, s.sc_date, s.publish_at, s.status, s.situation, s.prompt,
           s.time_limit_seconds, s.model_answer, s.created_at,
           (SELECT COUNT(*) FROM scenario_recordings r WHERE r.scenario_id = s.id) AS recording_count,
           (SELECT GROUP_CONCAT(k.keyword ORDER BY k.id SEPARATOR ',')
            FROM scenario_keywords k WHERE k.scenario_id = s.id) AS keywords_csv
    FROM scenarios s
    WHERE s.student_id = ?
    ORDER BY s.sc_date DESC, s.id DESC
");
$stmt->execute([$student_id]);

$items = array_map(static function (array $row): array {
    $keywords = $row['keywords_csv']
        ? array_values(array_filter(explode(',', $row['keywords_csv'])))
        : [];
    return [
        'id'                 => (int)$row['id'],
        'title'              => $row['title'],
        'sc_date'            => $row['sc_date'],
        'publish_at'         => $row['publish_at'],
        'status'             => $row['status'],
        'effective_status'   => effective_publish_status(
            $row['status'],
            $row['publish_at'],
            $row['sc_date']
        ),
        'situation'          => $row['situation'],
        'prompt'             => $row['prompt'],
        'time_limit_seconds' => (int)$row['time_limit_seconds'],
        'model_answer'       => $row['model_answer'],
        'keywords'           => $keywords,
        'recording_count'    => (int)$row['recording_count'],
        'created_at'         => $row['created_at'],
    ];
}, $stmt->fetchAll());

json_ok(['scenarios' => $items]);
