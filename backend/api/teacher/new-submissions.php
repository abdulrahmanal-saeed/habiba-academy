<?php
// api/teacher/new-submissions.php — New hw/scenario activity since ISO timestamp
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$since = trim((string)($_GET['since'] ?? ''));
$sinceTs = $since ? strtotime($since) : 0;
if ($sinceTs <= 0) json_err('Invalid since parameter');

$sinceDateTime = date('Y-m-d H:i:s', $sinceTs);
$now           = date('Y-m-d H:i:s');

$hwCount = 0;
try {
    $st = $pdo->prepare("SELECT COUNT(*) FROM homework_submissions WHERE is_submitted = 1 AND submitted_at > ?");
    $st->execute([$sinceDateTime]);
    $hwCount = (int)$st->fetchColumn();
} catch (Throwable $e) {}

$scCount = 0;
try {
    $st = $pdo->prepare("SELECT COUNT(*) FROM scenario_recordings WHERE submitted_at > ?");
    $st->execute([$sinceDateTime]);
    $scCount = (int)$st->fetchColumn();
} catch (Throwable $e) {}

json_ok([
    'submissions' => $hwCount,
    'recordings'  => $scCount,
    'total'       => $hwCount + $scCount,
    'checked_at'  => $now,
]);
