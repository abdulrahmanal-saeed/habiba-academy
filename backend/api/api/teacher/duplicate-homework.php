<?php
// api/teacher/duplicate-homework.php — Duplicate a homework as a draft
// Copies all questions (MCQ, writing, speaking) for a given student + date.
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$source_id     = (int)($_POST['homework_id']     ?? 0);
$new_student   = (int)($_POST['new_student_id']  ?? 0);
$new_date      = trim((string)($_POST['new_hw_date'] ?? ''));

if ($source_id <= 0)  json_err('Invalid homework ID');
if ($new_date === '' || !strtotime($new_date)) json_err('Date is required');

// Load source homework
$src = $pdo->prepare("SELECT * FROM homeworks WHERE id = ?");
$src->execute([$source_id]);
$hw = $src->fetch();
if (!$hw) json_err('Homework not found', 404);

// Use same student if no override
if ($new_student <= 0) $new_student = (int)$hw['student_id'];

// Verify student exists
$chk = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$chk->execute([$new_student]);
if (!$chk->fetch()) json_err('Student not found', 404);

// Load questions
$mcqQ = $pdo->prepare("SELECT * FROM homework_mcq_questions WHERE homework_id = ? ORDER BY q_order");
$mcqQ->execute([$source_id]); $mcqQuestions = $mcqQ->fetchAll();

$wrQ = $pdo->prepare("SELECT * FROM homework_writing_questions WHERE homework_id = ? ORDER BY q_order");
$wrQ->execute([$source_id]); $writingQ = $wrQ->fetchAll();

$spQ = $pdo->prepare("SELECT * FROM homework_speaking_questions WHERE homework_id = ? ORDER BY q_order");
$spQ->execute([$source_id]); $speakingQ = $spQ->fetchAll();

// Build new title
$newTitle = rtrim($hw['title']) . ' (Copy)';

$pdo->beginTransaction();
try {
    // Insert new homework as draft
    $ins = $pdo->prepare("
        INSERT INTO homeworks
               (student_id, title, hw_date, publish_at, status, media_url, media_instructions, reading_text, created_at)
        VALUES (?, ?, ?, NULL, 'draft', ?, ?, ?, NOW())
    ");
    $ins->execute([
        $new_student,
        $newTitle,
        $new_date,
        $hw['media_url']          ?: null,
        $hw['media_instructions'] ?: null,
        $hw['reading_text']       ?: null,
    ]);
    $newId = (int)$pdo->lastInsertId();

    // Copy MCQ questions
    if ($mcqQuestions) {
        $m = $pdo->prepare("
            INSERT INTO homework_mcq_questions
                   (homework_id, q_order, question_text, opt_a, opt_b, opt_c, opt_d, correct_option)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($mcqQuestions as $q) {
            $m->execute([
                $newId, $q['q_order'], $q['question_text'],
                $q['opt_a'], $q['opt_b'], $q['opt_c'] ?: null, $q['opt_d'] ?: null,
                $q['correct_option'],
            ]);
        }
    }

    // Copy writing questions
    if ($writingQ) {
        $w = $pdo->prepare("
            INSERT INTO homework_writing_questions (homework_id, q_order, prompt, min_sentences, focus)
            VALUES (?, ?, ?, ?, ?)
        ");
        foreach ($writingQ as $q) {
            $w->execute([$newId, $q['q_order'], $q['prompt'], $q['min_sentences'], $q['focus'] ?: null]);
        }
    }

    // Copy speaking questions
    if ($speakingQ) {
        $s = $pdo->prepare("
            INSERT INTO homework_speaking_questions (homework_id, q_order, prompt, time_limit_seconds, tips)
            VALUES (?, ?, ?, ?, ?)
        ");
        foreach ($speakingQ as $q) {
            $s->execute([$newId, $q['q_order'], $q['prompt'], $q['time_limit_seconds'], $q['tips'] ?: null]);
        }
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Duplicate failed: ' . $e->getMessage());
}

json_ok([
    'homework_id' => $newId,
    'title'       => $newTitle,
    'edit_url'    => '/teacher/homework-edit.php?id=' . $newId,
]);
