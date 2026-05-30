<?php
// api/teacher/save-homework-note.php - Save teacher note for a submitted homework
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/notify.php';
require_once __DIR__ . '/../../lib/learning-audit.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$homeworkId = (int)($_POST['homework_id'] ?? 0);
$note = trim((string)($_POST['teacher_note'] ?? ''));

if ($homeworkId <= 0) json_err('Invalid homework ID');
if ($note === '') json_err('Teacher note is required');

$stmt = $pdo->prepare("
    SELECT h.id, h.student_id, h.title AS homework_title, hs.id AS submission_id, hs.teacher_note,
           hs.mcq_score, hs.mcq_total,
           s.full_name AS student_name, s.email AS student_email, s.login_code
    FROM homeworks h
    JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_id = h.student_id
    JOIN students s ON s.id = h.student_id
    WHERE h.id = ? AND hs.is_submitted = 1
    LIMIT 1
");
$stmt->execute([$homeworkId]);
$row = $stmt->fetch();
if (!$row) json_err('No submitted homework found');

$wasAlreadyReviewed = trim((string)($row['teacher_note'] ?? '')) !== '';

$upd = $pdo->prepare("UPDATE homework_submissions SET teacher_note = ? WHERE id = ?");
$upd->execute([$note, (int)$row['submission_id']]);

$emailSent = false;
if (!$wasAlreadyReviewed) {
    try {
        $email = trim((string)($row['student_email'] ?? ''));
        if ($email !== '') {
            $studentName = trim((string)($row['student_name'] ?? 'Student'));
            $homeworkTitle = trim((string)($row['homework_title'] ?? 'Homework'));
            $scoreText = ((int)($row['mcq_total'] ?? 0) > 0)
                ? ((int)$row['mcq_score'] . '/' . (int)$row['mcq_total'])
                : 'Teacher reviewed';
            $body = "Your homework has been reviewed by your teacher.\n\nHomework: {$homeworkTitle}\nMCQ score: {$scoreText}\n\nTeacher note:\n{$note}";
            $loginCode = trim((string)($row['login_code'] ?? ''));
            if ($loginCode !== '') {
                $body .= "\n\nYour code: {$loginCode}";
            }
            $html = notify_student_email_html(
                $studentName,
                'Your homework feedback is ready',
                $body,
                'View Homework Result',
                notify_public_url('/student/homework-result.php?homework_id=' . $homeworkId)
            );
            notify_send_mail($email, 'Homework feedback is ready - ' . $homeworkTitle, $html);
            $emailSent = true;
        }
    } catch (Throwable $ignored) {}
}

learning_audit($pdo, 'homework_feedback_saved', 'homework', $homeworkId, [
    'student_id' => (int)$row['student_id'],
    'submission_id' => (int)$row['submission_id'],
    'teacher_note' => $note,
], [
    'teacher_note' => (string)($row['teacher_note'] ?? ''),
], 'teacher', null);

json_ok([
    'homework_id' => $homeworkId,
    'teacher_note' => $note,
    'email_sent' => $emailSent,
]);
