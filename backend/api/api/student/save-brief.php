<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/student-briefs.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
csrf_validate();

$studentId = (int)$_SESSION['student_id'];

$studentStmt = $pdo->prepare("SELECT full_name FROM students WHERE id = ? LIMIT 1");
$studentStmt->execute([$studentId]);
$student = $studentStmt->fetch();
if (!$student) {
    json_err('Student account not found.', 404);
}

[$data, $errors] = student_brief_validate($_POST);
if ($data['student_name'] === '') {
    $data['student_name'] = trim((string)($student['full_name'] ?? ''));
}

if ($data['student_name'] === '') {
    $errors['student_name'] = 'Student name is required.';
}

if ($errors) {
    json_err(array_values($errors)[0] ?? 'Please complete the required fields.');
}

try {
    $briefId = student_brief_insert($pdo, $data, $studentId, 'student');
} catch (Throwable $e) {
    json_err('Could not save the student brief right now.');
}

json_ok([
    'message' => 'Student brief submitted successfully.',
    'brief_id' => $briefId,
]);
