<?php
// api/teacher/login.php — Teacher password login
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

// Already logged in
if (!empty($_SESSION['teacher_logged'])) {
    json_ok(['already' => true]);
}

csrf_validate();

$password = (string)($_POST['password'] ?? '');
if ($password === '') json_err('Password required');

$teacherPassword = (string)(getenv('TEACHER_PASSWORD') ?: 'Habiba2026#Smart');

if (!hash_equals($teacherPassword, $password)) {
    json_err('Incorrect password', 401);
}

session_regenerate_id(true);
$_SESSION['teacher_logged'] = true;

json_ok(['ok' => true]);
