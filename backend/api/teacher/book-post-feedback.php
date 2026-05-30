<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
require_once __DIR__ . '/../../lib/lib/learning-audit.php';
require_once __DIR__ . '/../../config/config/db.php';

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();
interactive_books_ensure_schema($pdo);

$submissionId = (int)($_POST['submission_id'] ?? 0);
$stmt = $pdo->prepare("SELECT * FROM book_lesson_submissions WHERE id = ? LIMIT 1");
$stmt->execute([$submissionId]);
$submission = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$submission) json_err('Submission not found', 404);

$teacherId         = interactive_books_teacher_id();
$finalFeedback     = trim((string)($_POST['final_feedback'] ?? ''));
$teacherScoreRaw   = trim((string)($_POST['teacher_score'] ?? ''));
$teacherScore      = $teacherScoreRaw === '' ? null : max(0.0, min(100.0, (float)$teacherScoreRaw));
$writingFeedback   = trim((string)($_POST['writing_feedback'] ?? ''));
$correctionFeedback = trim((string)($_POST['correction_feedback'] ?? ''));
$speakingFeedback  = trim((string)($_POST['speaking_feedback'] ?? ''));
$pronunciation     = trim((string)($_POST['pronunciation_note'] ?? ''));
$fluency           = trim((string)($_POST['fluency_note'] ?? ''));
$speakingCorrection = trim((string)($_POST['speaking_correction_note'] ?? ''));
$speakingScoreRaw  = trim((string)($_POST['speaking_score'] ?? ''));
$speakingScore     = $speakingScoreRaw === '' ? null : max(0.0, min(100.0, (float)$speakingScoreRaw));

$pdo->beginTransaction();
try {
    $pdo->prepare("DELETE FROM book_feedback WHERE submission_id = ?")->execute([$submissionId]);
    $ins = $pdo->prepare(
        "INSERT INTO book_feedback (submission_id, teacher_id, feedback_type, feedback_text) VALUES (?, ?, ?, ?)"
    );
    foreach ([
        'writing'    => $writingFeedback,
        'correction' => $correctionFeedback,
        'speaking'   => $speakingFeedback,
        'general'    => $finalFeedback,
    ] as $fbType => $text) {
        if ($text !== '') {
            $ins->execute([$submissionId, $teacherId, $fbType, $text]);
        }
    }

    $pdo->prepare("
        UPDATE book_speaking_submissions
        SET teacher_feedback = ?, pronunciation_note = ?, fluency_note = ?, correction_note = ?, score = ?
        WHERE submission_id = ?
        ORDER BY id DESC
        LIMIT 1
    ")->execute([$speakingFeedback, $pronunciation, $fluency, $speakingCorrection, $speakingScore, $submissionId]);

    $pdo->prepare("
        UPDATE book_lesson_submissions
        SET status = 'feedback_sent',
            reviewed_at = NOW(),
            reviewed_by = ?,
            final_feedback = ?,
            teacher_score = ?,
            updated_at = NOW()
        WHERE id = ?
    ")->execute([$teacherId, $finalFeedback, $teacherScore, $submissionId]);

    interactive_books_notify_student_feedback($pdo, (int)$submission['student_id'], $submissionId);
    learning_audit($pdo, 'book_lesson_feedback_sent', 'book_lesson_submission', $submissionId, [
        'student_id'    => (int)$submission['student_id'],
        'teacher_score' => $teacherScore,
    ], [], 'teacher', $teacherId);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Could not send feedback.');
}

json_ok(['submission_id' => $submissionId]);
