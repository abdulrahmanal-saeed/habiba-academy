<?php
// api/student/logout.php — Clear student session (GET, no CSRF needed)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
start_session();
$_SESSION = [];
session_destroy();
json_ok(['message' => 'Logged out']);
