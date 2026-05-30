<?php
// api/teacher/lesson-plan-data.php — Fetch contract + sessions + stats
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lesson-schedule.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

ensure_lesson_schedule_schema($pdo);

$student_id = (int)($_GET['student_id'] ?? 0);
if ($student_id <= 0) json_err('Invalid student');

// Auto-create tables
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS student_contracts (
        id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        student_id               INT UNSIGNED NOT NULL,
        total_hours              DECIMAL(5,1) NOT NULL,
        session_duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 90,
        start_date               DATE NOT NULL,
        notes                    TEXT NOT NULL DEFAULT '',
        created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $pdo->exec("CREATE TABLE IF NOT EXISTS lesson_plan_sessions (
        id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        contract_id      INT UNSIGNED NOT NULL,
        student_id       INT UNSIGNED NOT NULL,
        session_number   SMALLINT UNSIGNED NOT NULL,
        title            VARCHAR(300) NOT NULL DEFAULT '',
        planned_date     DATE NULL,
        session_time     TIME NULL,
        actual_date      DATE NULL,
        status           ENUM('planned','completed','skipped','rescheduled') NOT NULL DEFAULT 'planned',
        skills           VARCHAR(500) NOT NULL DEFAULT '',
        goals            TEXT NOT NULL DEFAULT '',
        teacher_notes    TEXT NOT NULL DEFAULT '',
        price            DECIMAL(10,2) NOT NULL DEFAULT 120,
        subject          VARCHAR(120) NOT NULL DEFAULT 'عربي',
        is_paid          TINYINT(1) NOT NULL DEFAULT 0,
        is_milestone     TINYINT(1) NOT NULL DEFAULT 0,
        milestone_label  VARCHAR(100) NOT NULL DEFAULT '',
        created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       DATETIME NULL DEFAULT NULL,
        KEY idx_contract (contract_id),
        KEY idx_student  (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Throwable $e) {}

// Contract
$stmt = $pdo->prepare("SELECT * FROM student_contracts WHERE student_id = ? ORDER BY id DESC LIMIT 1");
$stmt->execute([$student_id]);
$contract = $stmt->fetch() ?: null;

if (!$contract) {
    json_ok(['contract' => null, 'sessions' => [], 'stats' => null]);
    exit;
}

// Sessions
$stmt = $pdo->prepare("
    SELECT *,
           COALESCE(session_time, planned_time) AS session_time
    FROM lesson_plan_sessions
    WHERE student_id = ?
    ORDER BY session_number ASC, planned_date ASC, COALESCE(session_time, planned_time) ASC
");
$stmt->execute([$student_id]);
$sessions = $stmt->fetchAll();

foreach ($sessions as &$s) {
    $s['skills'] = lesson_normalize_skills_csv((string)($s['skills'] ?? ''));
    $s['skills_arr'] = $s['skills'] ? array_values(array_filter(array_map('trim', explode(',', $s['skills'])))) : [];
}
unset($s);

// Stats
$hoursPerSession = (float)$contract['session_duration_minutes'] / 60;
$totalSessions   = (int)round((float)$contract['total_hours'] / $hoursPerSession);
$done            = count(array_filter($sessions, fn($s) => $s['status'] === 'completed'));
$skipped         = count(array_filter($sessions, fn($s) => $s['status'] === 'skipped'));
$absent          = count(array_filter($sessions, fn($s) => $s['status'] === 'absent'));
$cancelled       = count(array_filter($sessions, fn($s) => $s['status'] === 'cancelled'));
$rescheduled     = count(array_filter($sessions, fn($s) => $s['status'] === 'rescheduled'));
$usedSessions    = $done + $skipped + $absent;
$remaining       = max(0, $totalSessions - $usedSessions);
$pct             = $totalSessions > 0 ? (int)round($done / $totalSessions * 100) : 0;
$hoursUsed       = round($done * $hoursPerSession, 1);
$monthKey        = date('Y-m');
$monthSessions   = 0;
$monthHours      = 0.0;
$monthIncome     = 0.0;
$totalIncome     = 0.0;
foreach ($sessions as $s) {
    if (!in_array($s['status'], ['completed', 'absent'], true)) {
        continue;
    }
    $duration = (int)($s['duration_minutes'] ?? $contract['session_duration_minutes']);
    if ($duration <= 0) {
        $duration = (int)$contract['session_duration_minutes'];
    }
    $price = (float)($s['price'] ?? $contract['default_price_aed'] ?? 120);
    $totalIncome += $price;
    $dateForMonth = (string)($s['actual_date'] ?: $s['planned_date'] ?: '');
    if ($dateForMonth !== '' && substr($dateForMonth, 0, 7) === $monthKey) {
        if ($s['status'] === 'completed') {
            $monthSessions++;
            $monthHours += $duration / 60;
        }
        $monthIncome += $price;
    }
}

// Skill balance (from completed sessions)
$skillCounts = [];
foreach ($sessions as $s) {
    if ($s['status'] === 'completed' && $s['skills']) {
        foreach (array_filter(array_map('trim', explode(',', lesson_normalize_skills_csv((string)$s['skills'])))) as $sk) {
            $skillCounts[$sk] = ($skillCounts[$sk] ?? 0) + 1;
        }
    }
}
arsort($skillCounts);
$maxCount     = max(array_values($skillCounts) ?: [1]);
$skillBalance = [];
foreach ($skillCounts as $sk => $cnt) {
    $skillBalance[] = ['skill' => $sk, 'count' => $cnt, 'pct' => (int)round($cnt / $maxCount * 100)];
}

// Estimated finish
$estFinish = null;
$doneWithDates = array_values(array_filter($sessions, fn($s) => $s['status'] === 'completed' && $s['actual_date']));
if (count($doneWithDates) >= 2 && $remaining > 0) {
    $dates = array_column($doneWithDates, 'actual_date');
    sort($dates);
    $diff = (new DateTime($dates[0]))->diff(new DateTime(end($dates)))->days;
    if ($diff > 0) {
        $daysPerSess = $diff / (count($dates) - 1);
        $estFinish   = (new DateTime())->modify('+' . (int)ceil($remaining * $daysPerSess) . ' days')->format('M Y');
    }
}

json_ok([
    'contract' => $contract,
    'sessions' => $sessions,
    'stats'    => [
        'total'             => $totalSessions,
        'done'              => $done,
        'skipped'           => $skipped,
        'absent'            => $absent,
        'cancelled'         => $cancelled,
        'rescheduled'       => $rescheduled,
        'used_sessions'     => $usedSessions,
        'remaining'         => $remaining,
        'pct'               => $pct,
        'hours_used'        => $hoursUsed,
        'total_hours'       => (float)$contract['total_hours'],
        'hours_per_session' => round($hoursPerSession, 2),
        'month_sessions'    => $monthSessions,
        'month_hours'       => round($monthHours, 1),
        'month_income'      => round($monthIncome, 2),
        'total_income'      => round($totalIncome, 2),
        'est_finish'        => $estFinish,
        'skill_balance'     => $skillBalance,
    ],
]);
