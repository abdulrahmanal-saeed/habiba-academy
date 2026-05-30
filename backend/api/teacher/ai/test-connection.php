<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/ai-governance.php';
require_once __DIR__ . '/../../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$result = ai_governance_test_connection($pdo);
json_ok($result);
