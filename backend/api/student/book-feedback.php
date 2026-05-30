<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);

interactive_books_ensure_schema($pdo);
$studentId = (int)$_SESSION['student_id'];
$submissionId = (int)($_GET['submission_id'] ?? 0);

$stmt = $pdo->prepare("
    SELECT bls.*, b.title_en AS book_title, l.title_en AS lesson_title, l.title_ar AS lesson_title_ar,
           l.id AS lesson_id, l.unit_type
    FROM book_lesson_submissions bls
    JOIN books b ON b.id = bls.book_id
    JOIN book_lessons l ON l.id = bls.lesson_id
    WHERE bls.id = ? AND bls.student_id = ?
    LIMIT 1
");
$stmt->execute([$submissionId, $studentId]);
$submission = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$submission) json_err('Submission not found', 404);

// Auto-transition: feedback_sent → completed on student view
if ((string)$submission['status'] === 'feedback_sent') {
    $pdo->prepare("UPDATE book_lesson_submissions SET status = 'completed', updated_at = NOW() WHERE id = ? AND student_id = ?")
        ->execute([$submissionId, $studentId]);
    $submission['status'] = 'completed';
}

$answers = interactive_books_submission_answers($submission)['answers'] ?? [];

$feedbackStmt = $pdo->prepare("SELECT feedback_type, feedback_text FROM book_feedback WHERE submission_id = ? ORDER BY id ASC");
$feedbackStmt->execute([$submissionId]);
$feedback = [];
foreach ($feedbackStmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
    $feedback[(string)$row['feedback_type']] = (string)$row['feedback_text'];
}

$speakingStmt = $pdo->prepare("SELECT * FROM book_speaking_submissions WHERE submission_id = ? ORDER BY id DESC LIMIT 1");
$speakingStmt->execute([$submissionId]);
$speaking = $speakingStmt->fetch(PDO::FETCH_ASSOC) ?: null;

json_ok([
    'submission' => [
        'id' => (int)$submission['id'],
        'status' => (string)$submission['status'],
        'auto_score' => (float)$submission['auto_score'],
        'teacher_score' => $submission['teacher_score'] !== null ? (float)$submission['teacher_score'] : null,
        'final_feedback' => $submission['final_feedback'] ? (string)$submission['final_feedback'] : null,
        'submitted_at' => $submission['submitted_at'] ? (string)$submission['submitted_at'] : null,
        'reviewed_at' => $submission['reviewed_at'] ? (string)$submission['reviewed_at'] : null,
        'lesson_title' => (string)$submission['lesson_title'],
        'book_title' => (string)$submission['book_title'],
        'lesson_id' => (int)$submission['lesson_id'],
        'unit_type' => (string)$submission['unit_type'],
    ],
    'answers' => $answers,
    'feedback' => [
        'writing' => $feedback['writing'] ?? null,
        'correction' => $feedback['correction'] ?? null,
        'speaking' => $feedback['speaking'] ?? null,
        'general' => $feedback['general'] ?? null,
    ],
    'speaking' => $speaking ? [
        'audio_url' => $speaking['audio_url'] ?? null,
        'teacher_feedback' => $speaking['teacher_feedback'] ?? null,
        'pronunciation_note' => $speaking['pronunciation_note'] ?? null,
        'fluency_note' => $speaking['fluency_note'] ?? null,
        'correction_note' => $speaking['correction_note'] ?? null,
        'score' => $speaking['score'] !== null ? (float)$speaking['score'] : null,
    ] : null,
]);
