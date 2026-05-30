<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/cron-jobs.php';
require_once __DIR__ . '/../../config/db.php';
header('Content-Type: application/json; charset=utf-8');
cron_require_token();
$count = cron_send_homework_reminders($pdo);
echo json_encode(['ok' => true, 'sent' => $count], JSON_UNESCAPED_UNICODE);
