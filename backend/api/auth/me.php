<?php
// api/auth/me.php — Return current session identity (used by frontend authStore on mount)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);

if (!empty($_SESSION['student_id'])) {
    json_ok([
        'user' => [
            'id'   => (int)$_SESSION['student_id'],
            'name' => (string)($_SESSION['student_name'] ?? ''),
            'role' => 'student',
        ],
        'role' => 'student',
    ]);
}

if (!empty($_SESSION['teacher_logged'])) {
    json_ok([
        'user' => [
            'id'   => 1,
            'name' => 'Teacher',
            'role' => 'teacher',
        ],
        'role' => 'teacher',
    ]);
}

if (!empty($_SESSION['owner_id'])) {
    json_ok([
        'user' => [
            'id'   => (int)$_SESSION['owner_id'],
            'name' => (string)($_SESSION['owner_name'] ?? ''),
            'role' => 'owner',
        ],
        'role' => 'owner',
    ]);
}

if (!empty($_SESSION['parent_id'])) {
    json_ok([
        'user' => [
            'id'   => (int)$_SESSION['parent_id'],
            'name' => (string)($_SESSION['parent_name'] ?? ''),
            'role' => 'parent',
        ],
        'role' => 'parent',
    ]);
}

if (!empty($_SESSION['academy_id'])) {
    json_ok([
        'user' => [
            'id'   => (int)$_SESSION['academy_id'],
            'name' => (string)($_SESSION['academy_name'] ?? ''),
            'role' => 'academy',
        ],
        'role' => 'academy',
    ]);
}

if (!empty($_SESSION['media_buyer_id'])) {
    json_ok([
        'user' => [
            'id'   => (int)$_SESSION['media_buyer_id'],
            'name' => (string)($_SESSION['media_buyer_name'] ?? ''),
            'role' => 'media-buyer',
        ],
        'role' => 'media-buyer',
    ]);
}

json_err('Not authenticated', 401);
