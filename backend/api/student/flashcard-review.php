<?php
// api/student/flashcard-review.php — Submit spaced-repetition review result
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/flashcards.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);

$type  = trim((string)($_POST['type']  ?? ''));
$id    = (int)($_POST['id']    ?? 0);
$state = trim((string)($_POST['state'] ?? ''));

if (!in_array($type, ['word', 'mistake'], true) || $id <= 0) json_err('Invalid card');

try {
    flashcards_review($pdo, (int)$_SESSION['student_id'], $type, $id, $state);
    json_ok();
} catch (Throwable $e) {
    json_err($e->getMessage());
}
