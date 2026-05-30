<?php
// api/teacher/save-weak-words.php — Add a weak word to a student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$student_id = (int)($_POST['student_id'] ?? 0);
$word       = trim((string)($_POST['word'] ?? ''));
$note       = trim((string)($_POST['note'] ?? ''));

if ($student_id <= 0) json_err('Invalid student ID');
if ($word === '') json_err('Word is required');

// Verify student exists
$check = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$check->execute([$student_id]);
if (!$check->fetch()) json_err('Student not found', 404);

$find = $pdo->prepare("
    SELECT id
    FROM student_weak_words
    WHERE student_id = ? AND LOWER(TRIM(word)) = LOWER(TRIM(?))
    LIMIT 1
");
$find->execute([$student_id, $word]);
$existingId = (int)($find->fetchColumn() ?: 0);

if ($existingId > 0) {
    $stmt = $pdo->prepare("
        UPDATE student_weak_words
        SET note = ?, is_active = 1
        WHERE id = ? AND student_id = ?
    ");
    $stmt->execute([$note ?: null, $existingId, $student_id]);
    $wordId = $existingId;
} else {
    $stmt = $pdo->prepare("
        INSERT INTO student_weak_words (student_id, word, note, created_at, is_active)
        VALUES (?, ?, ?, NOW(), 1)
    ");
    $stmt->execute([$student_id, $word, $note ?: null]);
    $wordId = (int)$pdo->lastInsertId();
}

json_ok(['id' => $wordId, 'word' => $word, 'note' => $note]);
