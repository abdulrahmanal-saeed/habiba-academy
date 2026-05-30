<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$wordId = (int)($_POST['id'] ?? 0);
$word   = trim((string)($_POST['word'] ?? ''));
$note   = trim((string)($_POST['note'] ?? ''));

if ($wordId <= 0) json_err('Invalid weak word ID');
if ($word === '') json_err('Word is required');

$check = $pdo->prepare("SELECT student_id FROM student_weak_words WHERE id = ? LIMIT 1");
$check->execute([$wordId]);
$studentId = (int)($check->fetchColumn() ?: 0);
if ($studentId <= 0) json_err('Weak word not found', 404);

$dupe = $pdo->prepare("
    SELECT id
    FROM student_weak_words
    WHERE student_id = ? AND LOWER(TRIM(word)) = LOWER(TRIM(?)) AND id <> ?
    LIMIT 1
");
$dupe->execute([$studentId, $word, $wordId]);
if ($dupe->fetchColumn()) json_err('This weak word already exists for the student');

$stmt = $pdo->prepare("
    UPDATE student_weak_words
    SET word = ?, note = ?, is_active = 1
    WHERE id = ?
");
$stmt->execute([$word, $note ?: null, $wordId]);

json_ok(['id' => $wordId, 'word' => $word, 'note' => $note]);
