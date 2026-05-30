<?php
// api/teacher/student-mistakes.php — Return all common mistakes for a student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/learning-guidance.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$student_id = (int)($_GET['student_id'] ?? 0);
if ($student_id <= 0) json_err('Invalid student ID');

$rows = $pdo->prepare("
    SELECT m.id, m.tag AS mistake_tag, m.note, m.created_at,
           COALESCE(p.is_mastered, 0) AS is_mastered
    FROM   student_common_mistakes m
    LEFT JOIN student_common_mistakes_progress p
           ON p.mistake_id = m.id AND p.student_id = m.student_id
    WHERE  m.student_id = ? AND m.is_active = 1
    ORDER  BY p.is_mastered ASC, m.created_at DESC
");
$rows->execute([$student_id]);
$mistakes = $rows->fetchAll();
foreach ($mistakes as &$row) {
    $row['guidance'] = common_mistake_guidance((string)$row['mistake_tag']);
}
unset($row);
json_ok(['mistakes' => $mistakes]);
