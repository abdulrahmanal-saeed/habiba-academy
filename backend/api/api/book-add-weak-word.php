<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
csrf_validate();

$studentId = (int)$_SESSION['student_id'];
$word = trim((string)($_POST['word'] ?? ''));
$note = trim((string)($_POST['note'] ?? 'Interactive book vocabulary'));
if ($word === '') {
    json_err('Word is required.');
}

try {
    $check = $pdo->prepare("SELECT id FROM student_weak_words WHERE student_id = ? AND word = ? AND is_active = 1 LIMIT 1");
    $check->execute([$studentId, $word]);
    $existing = (int)($check->fetchColumn() ?: 0);
    if ($existing) {
        json_ok(['id' => $existing, 'message' => 'Already added.']);
    }

    $stmt = $pdo->prepare("INSERT INTO student_weak_words (student_id, word, note, created_at, is_active) VALUES (?, ?, ?, NOW(), 1)");
    $stmt->execute([$studentId, $word, $note]);
    json_ok(['id' => (int)$pdo->lastInsertId(), 'message' => 'Added to weak words.']);
} catch (Throwable $e) {
    json_err('Could not add weak word.');
}
