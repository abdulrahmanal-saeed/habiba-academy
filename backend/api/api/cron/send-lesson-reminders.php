<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/cron-jobs.php';
require_once __DIR__ . '/../../config/db.php';
header('Content-Type: application/json; charset=utf-8');
cron_require_token();
$hours = (int)($_GET['hours'] ?? 24);
if (!in_array($hours, [1,24], true)) $hours = 24;
$count = cron_send_lesson_reminders($pdo, $hours);
echo json_encode(['ok' => true, 'sent' => $count], JSON_UNESCAPED_UNICODE);
