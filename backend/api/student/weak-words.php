<?php
// api/student/weak-words.php — List weak words for the logged-in student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/learning-guidance.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
$student_id = (int)$_SESSION['student_id'];

$stmt = $pdo->prepare("
    SELECT w.id, w.word, w.note,
           COALESCE(p.is_mastered, 0) AS is_mastered
    FROM   student_weak_words w
    LEFT JOIN student_weak_words_progress p
           ON p.weak_word_id = w.id AND p.student_id = ?
    WHERE  w.student_id = ? AND w.is_active = 1
    ORDER  BY w.created_at DESC
");
$stmt->execute([$student_id, $student_id]);
$rows = $stmt->fetchAll();
foreach ($rows as &$row) {
    $row['guidance'] = weak_word_guidance((string)$row['word'], $row['note'] ?? null);
}
unset($row);

json_ok(['items' => $rows]);
