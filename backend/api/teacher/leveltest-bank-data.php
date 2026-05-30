<?php
// api/teacher/leveltest-bank-data.php — Return all blocks + questions for teacher editor
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/leveltest_db.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

lt_ensure_db_tables($pdo);

$blocks = lt_get_all_for_teacher($pdo);

json_ok(['blocks' => $blocks]);
