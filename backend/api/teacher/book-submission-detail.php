<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
require_once __DIR__ . '/../../config/config/db.php';

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

interactive_books_ensure_schema($pdo);

$submissionId = (int)($_GET['submission_id'] ?? 0);
if ($submissionId <= 0) json_err('Invalid submission_id');

$stmt = $pdo->prepare("
    SELECT bls.*, s.full_name, s.login_code,
           b.title_en AS book_title,
           l.title_en AS lesson_title, l.lesson_number, l.unit_type
    FROM book_lesson_submissions bls
    JOIN students s ON s.id = bls.student_id
    JOIN books b ON b.id = bls.book_id
    JOIN book_lessons l ON l.id = bls.lesson_id
    WHERE bls.id = ?
    LIMIT 1
");
$stmt->execute([$submissionId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) json_err('Submission not found', 404);

$answers = interactive_books_submission_answers($row)['answers'] ?? [];

$speakingStmt = $pdo->prepare(
    "SELECT teacher_feedback, pronunciation_note, fluency_note, correction_note, score
     FROM book_speaking_submissions WHERE submission_id = ? ORDER BY id DESC LIMIT 1"
);
$speakingStmt->execute([$submissionId]);
$speakingRow = $speakingStmt->fetch(PDO::FETCH_ASSOC) ?: null;

$feedbackStmt = $pdo->prepare(
    "SELECT feedback_type, feedback_text FROM book_feedback WHERE submission_id = ? ORDER BY id ASC"
);
$feedbackStmt->execute([$submissionId]);
$feedbackRows = $feedbackStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
$feedback = ['writing' => '', 'speaking' => '', 'correction' => '', 'general' => ''];
foreach ($feedbackRows as $fb) {
    $feedback[(string)$fb['feedback_type']] = (string)$fb['feedback_text'];
}

$speaking = null;
if ($speakingRow !== null) {
    $speaking = [
        'teacher_feedback'   => $speakingRow['teacher_feedback'],
        'pronunciation_note' => $speakingRow['pronunciation_note'],
        'fluency_note'       => $speakingRow['fluency_note'],
        'correction_note'    => $speakingRow['correction_note'],
        'score'              => $speakingRow['score'] !== null ? (float)$speakingRow['score'] : null,
    ];
}

json_ok([
    'submission' => [
        'id'             => (int)$row['id'],
        'student_id'     => (int)$row['student_id'],
        'full_name'      => (string)$row['full_name'],
        'login_code'     => (string)$row['login_code'],
        'book_title'     => (string)$row['book_title'],
        'lesson_title'   => (string)$row['lesson_title'],
        'lesson_number'  => (int)$row['lesson_number'],
        'unit_type'      => (string)$row['unit_type'],
        'status'         => (string)$row['status'],
        'auto_score'     => (float)$row['auto_score'],
        'teacher_score'  => $row['teacher_score'] !== null ? (float)$row['teacher_score'] : null,
        'submitted_at'   => $row['submitted_at'],
        'reviewed_at'    => $row['reviewed_at'],
        'final_feedback' => $row['final_feedback'],
    ],
    'answers'  => $answers,
    'speaking' => $speaking,
    'feedback' => $feedback,
]);
