<?php
// api/leveltest/quick-submit.php — Process quick level check (reading only, no DB write)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/leveltest_bank.php';
require_once __DIR__ . '/../../lib/quick_test_db.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /leveltest/entry.php');
    exit;
}

// CSRF
$token = trim((string)($_POST['_csrf'] ?? ''));
if (!$token || !hash_equals((string)($_SESSION['_csrf_token'] ?? ''), $token)) {
    http_response_code(400);
    echo 'Bad request.';
    exit;
}

// Use DB-backed answer key; fall back to hardcoded if DB is unavailable
try {
    qt_ensure_tables($pdo);
    $readKey = qt_answer_key($pdo);
} catch (Throwable $e) {
    $readKey = lt_read_key(); // fallback to hardcoded
}

$total   = max(1, count($readKey));
$raw     = $_POST['reading'] ?? [];
$score   = 0;

for ($i = 1; $i <= $total; $i++) {
    $v = strtoupper(trim((string)($raw[$i] ?? '')));
    if (isset($readKey[$i]) && $v === $readKey[$i]) {
        $score++;
    }
}

$level = lt_level_from_score($score, $total);

$_SESSION['lt_quick_level'] = $level;
$_SESSION['lt_quick_score'] = $score;
$_SESSION['lt_quick_total'] = $total;

header('Location: /leveltest/quick-result.php');
exit;
