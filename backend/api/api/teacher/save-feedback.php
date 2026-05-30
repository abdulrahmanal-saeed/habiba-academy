<?php
// api/teacher/save-feedback.php — Save feedback chips + note on a scenario recording
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/learning-audit.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$recording_id = (int)($_POST['recording_id'] ?? 0);
$teacher_note = trim((string)($_POST['teacher_note'] ?? ''));
$chipsRaw     = trim((string)($_POST['chips'] ?? ''));

if ($recording_id <= 0) json_err('Invalid recording ID');

// Verify recording exists
$check = $pdo->prepare("SELECT id, scenario_id, student_id, teacher_note FROM scenario_recordings WHERE id = ?");
$check->execute([$recording_id]);
$recordingRow = $check->fetch();
if (!$recordingRow) json_err('Recording not found', 404);

// Parse chips (comma-separated string)
$chips = array_values(array_filter(array_map('trim', explode(',', $chipsRaw))));

$pdo->beginTransaction();
try {
    // Update teacher note
    $stmt = $pdo->prepare("UPDATE scenario_recordings SET teacher_note = ? WHERE id = ?");
    $stmt->execute([$teacher_note ?: null, $recording_id]);

    // Replace feedback chips
    $del = $pdo->prepare("DELETE FROM scenario_feedback_chips WHERE recording_id = ?");
    $del->execute([$recording_id]);

    if ($chips) {
        $ins = $pdo->prepare("INSERT INTO scenario_feedback_chips (recording_id, feedback_text) VALUES (?, ?)");
        foreach ($chips as $chip) {
            if ($chip !== '') $ins->execute([$recording_id, $chip]);
        }
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Failed to save feedback');
}

learning_audit($pdo, 'scenario_feedback_saved', 'scenario_recording', $recording_id, [
    'scenario_id' => (int)$recordingRow['scenario_id'],
    'student_id' => (int)$recordingRow['student_id'],
    'teacher_note' => $teacher_note,
    'chips' => $chips,
], [
    'teacher_note' => (string)($recordingRow['teacher_note'] ?? ''),
], 'teacher', null);

json_ok(['recording_id' => $recording_id, 'chips' => $chips]);
