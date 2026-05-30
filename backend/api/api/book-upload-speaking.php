<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/interactive-books.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
csrf_validate();
interactive_books_ensure_schema($pdo);

$studentId = (int)$_SESSION['student_id'];
$lessonId = (int)($_POST['lesson_id'] ?? 0);
$lesson = interactive_books_lesson($pdo, $lessonId);
if (!$lesson || !interactive_books_student_can_access($pdo, $studentId, (int)$lesson['book_id'])) {
    json_err('Lesson not found', 404);
}
if (empty($_FILES['audio']) || !is_array($_FILES['audio'])) {
    json_err('Audio file is required.');
}

$uploadDir = __DIR__ . '/../uploads/book_speaking/' . $studentId . '/';
try {
    $relPath = save_audio($_FILES['audio'], $uploadDir, 'book_l' . $lessonId . '_student' . $studentId);
} catch (RuntimeException $e) {
    json_err($e->getMessage());
}

$mime = '';
try {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = (string)finfo_file($finfo, __DIR__ . '/../' . $relPath);
    finfo_close($finfo);
} catch (Throwable) {
}

$audioUrl = '/' . ltrim($relPath, '/');
$stmt = $pdo->prepare("
    INSERT INTO book_speaking_submissions
        (submission_id, student_id, book_id, lesson_id, audio_url, original_filename, mime_type, duration_seconds)
    VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([
    $studentId,
    (int)$lesson['book_id'],
    $lessonId,
    $audioUrl,
    (string)($_FILES['audio']['name'] ?? 'recording.webm'),
    $mime,
    (int)($_POST['duration_seconds'] ?? 0),
]);

json_ok(['audio_url' => $audioUrl, 'duration_seconds' => (int)($_POST['duration_seconds'] ?? 0)]);
