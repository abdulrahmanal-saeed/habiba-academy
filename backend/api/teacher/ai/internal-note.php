<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/ai-system.php';
require_once __DIR__ . '/../../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$studentId   = (int)($_POST['student_id']   ?? 0);
$noteType    = (string)($_POST['note_type']  ?? 'general');
$note        = trim((string)($_POST['note']          ?? ''));
$aiGenerated = (int)($_POST['ai_generated'] ?? 0);

if ($studentId <= 0) json_err('Invalid student ID');
if ($note === '')    json_err('Note is required');
if (!in_array($noteType, ['general','review','lesson','risk','follow_up'], true)) $noteType = 'general';

try {
    ai_ensure_tables($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO teacher_internal_notes (teacher_id, student_id, note_type, note, ai_generated)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([ai_teacher_id(), $studentId, $noteType, $note, $aiGenerated ? 1 : 0]);
    json_ok(['id' => (int)$pdo->lastInsertId()]);
} catch (Throwable $e) {
    json_err('Failed to save internal note: ' . $e->getMessage(), 500);
}
