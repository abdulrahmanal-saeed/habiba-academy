<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/ai-system.php';
require_once __DIR__ . '/../../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$studentId      = (int)($_POST['student_id']          ?? 0);
$taxonomyId     = (int)($_POST['taxonomy_id']          ?? 0);
$sourceType     = (string)($_POST['source_type']       ?? 'manual');
$sourceId       = (int)($_POST['source_id']            ?? 0);
$sourceQId      = trim((string)($_POST['source_question_id'] ?? ''));
$evidence       = trim((string)($_POST['evidence_text']      ?? ''));
$note           = trim((string)($_POST['teacher_note']        ?? ''));
$severity       = (string)($_POST['severity']          ?? 'medium');
$status         = (string)($_POST['status']            ?? 'approved');

if ($studentId <= 0) json_err('Invalid student ID');
if ($taxonomyId <= 0) json_err('Invalid taxonomy tag');
if (!in_array($sourceType, ['homework','review','scenario','leveltest','manual'], true)) $sourceType = 'manual';
if (!in_array($severity, ['low','medium','high'], true)) $severity = 'medium';
if (!in_array($status, ['suggested','approved','rejected'], true)) $status = 'approved';

try {
    ai_ensure_tables($pdo);
    $stmt = $pdo->prepare("
        INSERT INTO student_mistake_events
            (student_id, taxonomy_id, source_type, source_id, source_question_id, evidence_text, teacher_note, severity, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $studentId,
        $taxonomyId,
        $sourceType,
        $sourceId > 0 ? $sourceId : null,
        $sourceQId ?: null,
        $evidence  ?: null,
        $note      ?: null,
        $severity,
        $status,
    ]);
    json_ok(['id' => (int)$pdo->lastInsertId()]);
} catch (Throwable $e) {
    json_err('Failed to save mistake event: ' . $e->getMessage(), 500);
}
