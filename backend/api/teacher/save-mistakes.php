<?php
// api/teacher/save-mistakes.php — Add a common mistake to a student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/ai-system.php';
require_once __DIR__ . '/../../lib/lib/push.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);
csrf_validate();

$student_id  = (int)($_POST['student_id']  ?? 0);
$mistake_tag = trim((string)($_POST['mistake_tag'] ?? ''));
$note        = trim((string)($_POST['note'] ?? ''));

if ($student_id <= 0)    json_err('Invalid student ID');
if ($mistake_tag === '') json_err('Mistake tag is required');

$check = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$check->execute([$student_id]);
if (!$check->fetch()) json_err('Student not found', 404);

$find = $pdo->prepare("
    SELECT id FROM student_common_mistakes
    WHERE student_id = ? AND LOWER(TRIM(tag)) = LOWER(TRIM(?))
    LIMIT 1
");
$find->execute([$student_id, $mistake_tag]);
$existingId = (int)($find->fetchColumn() ?: 0);

if ($existingId > 0) {
    $pdo->prepare("UPDATE student_common_mistakes SET note = ?, is_active = 1 WHERE id = ? AND student_id = ?")
        ->execute([$note ?: null, $existingId, $student_id]);
    $mistakeId = $existingId;
} else {
    $pdo->prepare("INSERT INTO student_common_mistakes (student_id, tag, note, created_at, is_active) VALUES (?, ?, ?, NOW(), 1)")
        ->execute([$student_id, $mistake_tag, $note ?: null]);
    $mistakeId = (int)$pdo->lastInsertId();
}

try {
    ai_ensure_tables($pdo);
    $tax = $pdo->prepare("
        SELECT id FROM mistake_taxonomy
        WHERE is_active = 1
          AND (LOWER(label_en) = LOWER(?) OR LOWER(code) = LOWER(?) OR LOWER(label_ar) = LOWER(?))
        LIMIT 1
    ");
    $tax->execute([$mistake_tag, $mistake_tag, $mistake_tag]);
    $taxonomyId = (int)($tax->fetchColumn() ?: 0);
    if ($taxonomyId > 0) {
        $pdo->prepare("
            INSERT INTO student_mistake_events
                (student_id, taxonomy_id, source_type, evidence_text, teacher_note, severity, status)
            VALUES (?, ?, 'manual', ?, ?, 'medium', 'approved')
        ")->execute([$student_id, $taxonomyId, $mistake_tag, $note ?: null]);
    }
} catch (Throwable) {}

try {
    $body = '📌 Your teacher noted a pattern to work on: "' . $mistake_tag . '"'
          . ($note ? ' — ' . $note : '') . '. Keep practising! 💪';
    push_notify_student($pdo, $student_id, 'New grammar note from your teacher', $body, '/student/home.php');
} catch (Throwable) {}

json_ok(['id' => $mistakeId, 'mistake_tag' => $mistake_tag, 'note' => $note]);
