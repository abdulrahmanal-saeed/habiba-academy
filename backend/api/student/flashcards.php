<?php
// api/student/flashcards.php — Return due flashcards (words + mistakes) for the student
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/flashcards.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);

try {
    $items = flashcards_due($pdo, (int)$_SESSION['student_id']);
    json_ok(['items' => $items]);
} catch (Throwable $e) {
    json_err('Could not load flashcards');
}
