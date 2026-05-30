<?php
// api/auth/csrf.php — Return a fresh CSRF token (public, no auth required)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';

start_session();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_err('Method not allowed', 405);
}

json_ok(['csrf' => csrf_token()]);
