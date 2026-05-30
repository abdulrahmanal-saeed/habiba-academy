<?php
// api/student/toggle-weak-word.php — Toggle mastered state of a weak word
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
csrf_validate();

$student_id   = (int)$_SESSION['student_id'];
$weak_word_id = (int)($_POST['weak_word_id'] ?? 0);
$is_mastered  = (int)($_POST['is_mastered']  ?? 0);

if ($weak_word_id <= 0) json_err('Invalid word ID');

// Verify the word belongs to this student
$check = $pdo->prepare("SELECT id FROM student_weak_words WHERE id = ? AND student_id = ?");
$check->execute([$weak_word_id, $student_id]);
if (!$check->fetch()) json_err('Word not found', 404);

// Upsert progress record
$masteredAt = $is_mastered ? (new DateTimeImmutable())->format('Y-m-d H:i:s') : null;
$pdo->prepare("
    INSERT INTO student_weak_words_progress (student_id, weak_word_id, is_mastered, mastered_at)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      is_mastered = VALUES(is_mastered),
      mastered_at = VALUES(mastered_at)
")->execute([$student_id, $weak_word_id, $is_mastered, $masteredAt]);

json_ok(['is_mastered' => $is_mastered]);
