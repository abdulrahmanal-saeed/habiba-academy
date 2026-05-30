<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
csrf_validate();
interactive_books_ensure_schema($pdo);

$studentId = (int)$_SESSION['student_id'];
$lessonId = (int)($_POST['lesson_id'] ?? 0);
$audioKey = trim((string)($_POST['audio_key'] ?? ''));
$marked = (int)($_POST['marked_practiced'] ?? 0) === 1 ? 1 : 0;

$lesson = interactive_books_lesson($pdo, $lessonId);
if (!$lesson || $audioKey === '') json_err('Invalid request.');

$pdo->prepare("
    INSERT INTO book_audio_activity
        (student_id, book_id, lesson_id, audio_key, play_count, first_played_at, last_played_at, marked_practiced)
    VALUES (?, ?, ?, ?, 1, NOW(), NOW(), ?)
    ON DUPLICATE KEY UPDATE
        play_count = play_count + 1,
        last_played_at = NOW(),
        marked_practiced = GREATEST(marked_practiced, VALUES(marked_practiced))
")->execute([$studentId, (int)$lesson['book_id'], $lessonId, $audioKey, $marked]);

json_ok();
