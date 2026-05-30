<?php
// api/student/progress.php — Student progress stats: level, achievements, score history
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
$student_id = (int)$_SESSION['student_id'];

// Student info
$st = $pdo->prepare("SELECT full_name, level FROM students WHERE id = ? LIMIT 1");
$st->execute([$student_id]);
$me = $st->fetch();
if (!$me) json_err('Student not found', 404);

// Homework stats
$hwStmt = $pdo->prepare("
    SELECT COUNT(*) AS cnt, SUM(mcq_score) AS total_score, SUM(mcq_total) AS total_possible
    FROM homework_submissions WHERE student_id = ? AND is_submitted = 1
");
$hwStmt->execute([$student_id]);
$hwRow   = $hwStmt->fetch();
$hwCount = (int)($hwRow['cnt'] ?? 0);
$hwPoss  = (int)($hwRow['total_possible'] ?? 0);
$avgPct  = $hwPoss > 0 ? (int)round(($hwRow['total_score'] / $hwPoss) * 100) : null;

// Scenarios recorded
$scStmt = $pdo->prepare(
    "SELECT COUNT(DISTINCT scenario_id) AS cnt FROM scenario_recordings WHERE student_id = ?"
);
$scStmt->execute([$student_id]);
$scCount = (int)($scStmt->fetch()['cnt'] ?? 0);

// Perfect scores
$perfStmt = $pdo->prepare("
    SELECT COUNT(*) AS cnt FROM homework_submissions
    WHERE student_id = ? AND is_submitted = 1 AND mcq_total > 0 AND mcq_score = mcq_total
");
$perfStmt->execute([$student_id]);
$perfCount = (int)($perfStmt->fetch()['cnt'] ?? 0);

// Completed sessions
$sessStmt = $pdo->prepare(
    "SELECT COUNT(*) AS cnt FROM lesson_plan_sessions WHERE student_id = ? AND status = 'completed'"
);
$sessStmt->execute([$student_id]);
$sessCount = (int)($sessStmt->fetch()['cnt'] ?? 0);

// Streak (consecutive homework days ending today)
$streakStmt = $pdo->prepare("
    SELECT DATE(submitted_at) AS sub_date FROM homework_submissions
    WHERE student_id = ? AND is_submitted = 1
    GROUP BY DATE(submitted_at) ORDER BY sub_date DESC
");
$streakStmt->execute([$student_id]);
$streakDates = array_column($streakStmt->fetchAll(), 'sub_date');
$streak = 0;
if ($streakDates) {
    $check = new DateTimeImmutable('today');
    foreach ($streakDates as $d) {
        $dObj = new DateTimeImmutable($d);
        if ((int)abs((int)$check->diff($dObj)->days) <= 1) {
            $streak++;
            $check = $dObj;
        } else {
            break;
        }
    }
}

// Score history (last 10 MCQ homeworks, oldest-first for chart)
$histStmt = $pdo->prepare("
    SELECT h.title, hs.mcq_score, hs.mcq_total, hs.submitted_at
    FROM homework_submissions hs JOIN homeworks h ON h.id = hs.homework_id
    WHERE hs.student_id = ? AND hs.is_submitted = 1 AND hs.mcq_total > 0
    ORDER BY hs.submitted_at DESC LIMIT 10
");
$histStmt->execute([$student_id]);
$scoreHistory = array_reverse($histStmt->fetchAll());

// Achievements
$levelOrder = ['A1' => 1, 'A2' => 2, 'B1' => 3, 'B2' => 4, 'C1' => 5, 'C2' => 6];
$level      = $me['level'] ?: null;
$allDefs    = [
    ['emoji' => '🎯', 'title_en' => 'First Homework',  'title_ar' => 'أول واجب',        'ok' => $hwCount >= 1],
    ['emoji' => '📝', 'title_en' => '5 Homeworks',     'title_ar' => '5 واجبات',        'ok' => $hwCount >= 5],
    ['emoji' => '📚', 'title_en' => 'Homework Hero',   'title_ar' => 'بطل الواجبات',    'ok' => $hwCount >= 10],
    ['emoji' => '💯', 'title_en' => 'Perfect Score',   'title_ar' => 'درجة كاملة',      'ok' => $perfCount >= 1],
    ['emoji' => '🎙️','title_en' => 'First Recording', 'title_ar' => 'أول تسجيل',       'ok' => $scCount >= 1],
    ['emoji' => '🗣️','title_en' => 'Vocal Learner',   'title_ar' => 'متعلم نشيط',      'ok' => $scCount >= 3],
    ['emoji' => '🔥', 'title_en' => '3-Day Streak',    'title_ar' => '3 أيام متواصلة', 'ok' => $streak >= 3],
    ['emoji' => '⚡', 'title_en' => 'Week Warrior',    'title_ar' => 'محارب الأسبوع',   'ok' => $streak >= 7],
    ['emoji' => '⭐', 'title_en' => 'High Achiever',   'title_ar' => 'متفوق',           'ok' => $avgPct !== null && $avgPct >= 80],
    ['emoji' => '📈', 'title_en' => 'Rising Star',     'title_ar' => 'نجم صاعد',        'ok' => $level && ($levelOrder[$level] ?? 0) >= 3],
];
$strip    = fn($a) => ['emoji' => $a['emoji'], 'title_en' => $a['title_en'], 'title_ar' => $a['title_ar']];
$allFront = array_map($strip, $allDefs);
$earned   = array_map($strip, array_values(array_filter($allDefs, fn($a) => $a['ok'])));

json_ok(['data' => [
    'full_name'        => $me['full_name'],
    'level'            => $level,
    'hw_count'         => $hwCount,
    'avg_pct'          => $avgPct,
    'sc_count'         => $scCount,
    'perf_count'       => $perfCount,
    'sess_count'       => $sessCount,
    'streak'           => $streak,
    'score_history'    => array_map(fn($r) => [
        'title'        => $r['title'],
        'mcq_score'    => (int)$r['mcq_score'],
        'mcq_total'    => (int)$r['mcq_total'],
        'submitted_at' => $r['submitted_at'],
    ], $scoreHistory),
    'achievements'     => $earned,
    'all_achievements' => $allFront,
]]);
