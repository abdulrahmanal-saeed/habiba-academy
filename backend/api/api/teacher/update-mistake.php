<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$mistakeId = (int)($_POST['id'] ?? 0);
$tag       = trim((string)($_POST['mistake_tag'] ?? ''));
$note      = trim((string)($_POST['note'] ?? ''));

if ($mistakeId <= 0) json_err('Invalid mistake ID');
if ($tag === '') json_err('Mistake tag is required');

$check = $pdo->prepare("SELECT student_id FROM student_common_mistakes WHERE id = ? LIMIT 1");
$check->execute([$mistakeId]);
$studentId = (int)($check->fetchColumn() ?: 0);
if ($studentId <= 0) json_err('Mistake not found', 404);

$dupe = $pdo->prepare("
    SELECT id
    FROM student_common_mistakes
    WHERE student_id = ? AND LOWER(TRIM(tag)) = LOWER(TRIM(?)) AND id <> ?
    LIMIT 1
");
$dupe->execute([$studentId, $tag, $mistakeId]);
if ($dupe->fetchColumn()) json_err('This mistake already exists for the student');

$stmt = $pdo->prepare("
    UPDATE student_common_mistakes
    SET tag = ?, note = ?, is_active = 1
    WHERE id = ?
");
$stmt->execute([$tag, $note ?: null, $mistakeId]);

json_ok(['id' => $mistakeId, 'mistake_tag' => $tag, 'note' => $note]);
