<?php
// api/teacher/student-weak-words.php — Return all weak words for a student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/learning-guidance.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$student_id = (int)($_GET['student_id'] ?? 0);
if ($student_id <= 0) json_err('Invalid student ID');

$rows = $pdo->prepare("
    SELECT w.id, w.word, w.note, w.created_at,
           COALESCE(p.is_mastered, 0) AS is_mastered,
           p.mastered_at
    FROM   student_weak_words w
    LEFT JOIN student_weak_words_progress p
           ON p.weak_word_id = w.id AND p.student_id = w.student_id
    WHERE  w.student_id = ? AND w.is_active = 1
    ORDER  BY p.is_mastered ASC, w.created_at DESC
");
$rows->execute([$student_id]);
$words = $rows->fetchAll();
foreach ($words as &$row) {
    $row['guidance'] = weak_word_guidance((string)$row['word'], $row['note'] ?? null);
}
unset($row);
json_ok(['words' => $words]);
