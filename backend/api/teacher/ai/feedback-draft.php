<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/ai-system.php';
require_once __DIR__ . '/../../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$studentId   = (int)($_POST['student_id']  ?? 0);
$strengths   = json_decode((string)($_POST['strengths_json'] ?? '[]'), true);
$issues      = json_decode((string)($_POST['issues_json']    ?? '[]'), true);
$teacherNote = trim((string)($_POST['teacher_note']          ?? ''));

if ($studentId <= 0) json_err('Invalid student ID');
if (!is_array($strengths)) $strengths = [];
if (!is_array($issues))    $issues    = [];

$parts = [];
if ($strengths) {
    $parts[] = 'Good work on ' . implode(', ', array_slice(array_map('strval', $strengths), 0, 3)) . '.';
} else {
    $parts[] = 'Good effort. Keep practising and try to answer in complete Arabic sentences.';
}
if ($issues) {
    $parts[] = 'Focus next on: ' . implode(', ', array_slice(array_map('strval', $issues), 0, 4)) . '.';
}
if ($teacherNote !== '') {
    $parts[] = $teacherNote;
}
$parts[] = 'For the next task, review these points first and then try again with slower, clearer sentences.';

$draft     = implode(' ', $parts);
$requestId = ai_log_request($pdo, [
    'student_id'    => $studentId,
    'feature_key'   => 'feedback_draft_template',
    'model'         => 'rule-template',
    'input_hash'    => ai_input_hash(['student_id' => $studentId, 'strengths' => $strengths, 'issues' => $issues, 'teacher_note' => $teacherNote]),
    'input_summary' => 'Template feedback draft',
    'output'        => ['feedback' => $draft],
    'status'        => 'success',
]);

json_ok(['feedback' => $draft, 'ai_request_id' => $requestId]);
