<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/student-briefs.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$studentId = (int)($_POST['student_id'] ?? 0);
if ($studentId <= 0) {
    json_err('Invalid student.');
}

$studentStmt = $pdo->prepare("SELECT id, full_name FROM students WHERE id = ? LIMIT 1");
$studentStmt->execute([$studentId]);
$student = $studentStmt->fetch();
if (!$student) {
    json_err('Student not found.', 404);
}

[$data, $errors] = student_brief_validate($_POST);
if ($data['student_name'] === '') {
    $data['student_name'] = trim((string)($student['full_name'] ?? ''));
}

if ($errors) {
    json_err(array_values($errors)[0] ?? 'Please complete the required fields.');
}

try {
    $briefId = student_brief_insert($pdo, $data, $studentId, 'teacher');
} catch (Throwable $e) {
    json_err('Could not save the student brief right now.');
}

json_ok([
    'message' => 'Student brief saved successfully.',
    'brief_id' => $briefId,
]);
