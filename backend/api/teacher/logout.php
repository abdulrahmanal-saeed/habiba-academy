<?php
// api/teacher/logout.php — Destroy teacher session
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
start_session();

session_destroy();

json_ok(['message' => 'Logged out']);
