<?php
// api/student/common-mistakes.php — List common mistakes for the logged-in student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/learning-guidance.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
$student_id = (int)$_SESSION['student_id'];

$stmt = $pdo->prepare("
    SELECT m.id, m.tag, m.note,
           COALESCE(p.is_mastered, 0) AS is_mastered
    FROM   student_common_mistakes m
    LEFT JOIN student_common_mistakes_progress p
           ON p.mistake_id = m.id AND p.student_id = ?
    WHERE  m.student_id = ? AND m.is_active = 1
    ORDER  BY m.created_at DESC
");
$stmt->execute([$student_id, $student_id]);
$rows = $stmt->fetchAll();
foreach ($rows as &$row) {
    $row['guidance'] = common_mistake_guidance((string)$row['tag']);
}
unset($row);

json_ok(['items' => $rows]);
