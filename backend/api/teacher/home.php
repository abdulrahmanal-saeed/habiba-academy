<?php
// api/teacher/home.php — Teacher dashboard: KPIs + today activity + priority queue + calendar
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/ai-system.php';
require_once __DIR__ . '/../../lib/lib/lesson-schedule.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))    json_err('Not authenticated', 401);

ensure_publish_schedule_support($pdo);
ensure_lesson_schedule_schema($pdo);

// ── KPIs ──────────────────────────────────────────────────────────────────
$kpis = ['students' => 0, 'homeworks' => 0, 'scenarios' => 0, 'tests' => 0,
         'hw_pending' => 0, 'sc_pending' => 0, 'students_new' => 0];

try { $kpis['students'] = (int)$pdo->query("SELECT COUNT(*) FROM students WHERE is_active=1")->fetchColumn(); } catch(Throwable $e){}
try {
    $hwCount  = (int)$pdo->query("SELECT COUNT(*) FROM homeworks")->fetchColumn();
    $revCount = 0;
    try { $revCount = (int)$pdo->query("SELECT COUNT(*) FROM student_reviews WHERE status != 'draft'")->fetchColumn(); } catch(Throwable $e2){}
    $kpis['homeworks'] = $hwCount + $revCount;
} catch(Throwable $e){}
try { $kpis['scenarios'] = (int)$pdo->query("SELECT COUNT(*) FROM scenarios")->fetchColumn(); } catch(Throwable $e){}
try { $kpis['tests']     = (int)$pdo->query("SELECT COUNT(*) FROM leveltest_attempts")->fetchColumn(); } catch(Throwable $e){}
try {
    $hwPend  = (int)$pdo->query("SELECT COUNT(*) FROM homeworks h WHERE h.status='published' AND COALESCE(h.publish_at,CONCAT(h.hw_date,' 00:00:00')) <= NOW() AND NOT EXISTS (SELECT 1 FROM homework_submissions hs WHERE hs.homework_id=h.id AND hs.is_submitted=1)")->fetchColumn();
    $revPend = 0;
    try { $revPend = (int)$pdo->query("SELECT COUNT(*) FROM student_reviews r WHERE r.status='published' AND COALESCE(r.publish_at,CONCAT(r.review_date,' 00:00:00')) <= NOW() AND NOT EXISTS (SELECT 1 FROM student_review_submissions s WHERE s.review_id=r.id)")->fetchColumn(); } catch(Throwable $e2){}
    $kpis['hw_pending'] = $hwPend + $revPend;
} catch(Throwable $e){}
try { $kpis['sc_pending'] = (int)$pdo->query("SELECT COUNT(*) FROM scenarios sc WHERE sc.status='published' AND COALESCE(sc.publish_at,CONCAT(sc.sc_date,' 00:00:00')) <= NOW() AND (SELECT COUNT(*) FROM scenario_recordings sr WHERE sr.scenario_id=sc.id AND sr.submitted_at IS NOT NULL) = 0")->fetchColumn(); } catch(Throwable $e){}
try { $kpis['students_new'] = (int)$pdo->query("SELECT COUNT(*) FROM students WHERE is_active=1 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)")->fetchColumn(); } catch(Throwable $e){}

// ── Today's homework activity ─────────────────────────────────────────────
$todayHw = [];
try {
    $rows = $pdo->query("
        SELECT s.id AS student_id, s.full_name, h.id AS homework_id, h.title, h.status AS hw_status,
               COALESCE(hs.is_submitted,0) AS submitted, hs.mcq_score, hs.mcq_total, hs.submitted_at
        FROM   homeworks h
        JOIN   students s ON s.id = h.student_id
        LEFT JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_id = h.student_id AND hs.is_submitted=1
        WHERE  h.status='published'
          AND DATE(COALESCE(h.publish_at, CONCAT(h.hw_date, ' 00:00:00'))) = CURDATE()
          AND COALESCE(h.publish_at, CONCAT(h.hw_date, ' 00:00:00')) <= NOW()
        ORDER  BY submitted ASC, s.full_name ASC
    ")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        $todayHw[] = [
            'student_id'   => (int)$r['student_id'],
            'student_name' => (string)$r['full_name'],
            'homework_id'  => (int)$r['homework_id'],
            'title'        => (string)$r['title'],
            'submitted'    => (bool)$r['submitted'],
            'mcq_score'    => $r['mcq_score'] !== null ? (int)$r['mcq_score'] : null,
            'mcq_total'    => $r['mcq_total'] !== null ? (int)$r['mcq_total'] : null,
            'submitted_at' => $r['submitted_at'],
        ];
    }
} catch(Throwable $e){}

// ── Today's scenario activity ─────────────────────────────────────────────
$todaySc = [];
try {
    $rows = $pdo->query("
        SELECT s.id AS student_id, s.full_name, sc.id AS scenario_id, sc.title, sc.status AS sc_status,
               (SELECT COUNT(*) FROM scenario_recordings sr WHERE sr.scenario_id=sc.id AND sr.student_id=sc.student_id AND sr.submitted_at IS NOT NULL) AS recorded
        FROM   scenarios sc
        JOIN   students s ON s.id = sc.student_id
        WHERE  sc.status='published'
          AND DATE(COALESCE(sc.publish_at, CONCAT(sc.sc_date, ' 00:00:00'))) = CURDATE()
          AND COALESCE(sc.publish_at, CONCAT(sc.sc_date, ' 00:00:00')) <= NOW()
        ORDER  BY recorded ASC, s.full_name ASC
    ")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        $todaySc[] = [
            'student_id'   => (int)$r['student_id'],
            'student_name' => (string)$r['full_name'],
            'scenario_id'  => (int)$r['scenario_id'],
            'title'        => (string)$r['title'],
            'recorded'     => (int)$r['recorded'] > 0,
        ];
    }
} catch(Throwable $e){}

// ── Today's review activity ───────────────────────────────────────────────
$todayRev = [];
try {
    $rows = $pdo->query("
        SELECT s.id AS student_id, s.full_name, r.id AS review_id, r.title, r.review_type,
               COALESCE(srs.id, 0) AS submitted
        FROM   student_reviews r
        JOIN   students s ON s.id = r.student_id
        LEFT JOIN student_review_submissions srs ON srs.review_id = r.id
        WHERE  r.status = 'published'
          AND DATE(COALESCE(r.publish_at, CONCAT(r.review_date, ' 00:00:00'))) = CURDATE()
          AND COALESCE(r.publish_at, CONCAT(r.review_date, ' 00:00:00')) <= NOW()
        ORDER  BY submitted ASC, s.full_name ASC
    ")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        $todayRev[] = [
            'student_id'   => (int)$r['student_id'],
            'student_name' => (string)$r['full_name'],
            'review_id'    => (int)$r['review_id'],
            'title'        => (string)$r['title'],
            'review_type'  => (string)$r['review_type'],
            'submitted'    => (int)$r['submitted'] > 0,
        ];
    }
} catch(Throwable $e){}

// ── Priority queue ────────────────────────────────────────────────────────
$priorityItems = [];
try { $priorityItems = ai_review_priority($pdo, 20); } catch(Throwable $e){}

// ── Calendar (current month) ──────────────────────────────────────────────
$calMonth = (string)($_GET['month'] ?? date('Y-m'));
if (!preg_match('/^\d{4}-\d{2}$/', $calMonth)) $calMonth = date('Y-m');

$calendarSessions = [];
try {
    $monthStart = DateTimeImmutable::createFromFormat('!Y-m-d', $calMonth . '-01') ?: new DateTimeImmutable('first day of this month');
    $monthEnd   = $monthStart->modify('last day of this month');
    $stmt = $pdo->prepare("
        SELECT lps.id, lps.student_id, lps.session_number,
               COALESCE(NULLIF(lps.title,''), CONCAT('Session ', lps.session_number)) AS title,
               lps.planned_date,
               COALESCE(lps.session_time, lps.planned_time) AS session_time,
               COALESCE(lps.status, 'planned') AS status,
               st.full_name
        FROM lesson_plan_sessions lps
        JOIN students st ON st.id = lps.student_id
        WHERE lps.planned_date BETWEEN ? AND ?
        ORDER BY lps.planned_date ASC, COALESCE(lps.session_time, lps.planned_time) ASC, st.full_name ASC
    ");
    $stmt->execute([$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $calendarSessions[] = [
            'id'           => (int)$row['id'],
            'student_id'   => (int)$row['student_id'],
            'student_name' => (string)$row['full_name'],
            'title'        => (string)$row['title'],
            'planned_date' => (string)$row['planned_date'],
            'session_time' => $row['session_time'],
            'status'       => (string)$row['status'],
        ];
    }
} catch(Throwable $e){}

json_ok([
    'kpis'          => $kpis,
    'today_homework' => $todayHw,
    'today_scenarios' => $todaySc,
    'today_reviews'   => $todayRev,
    'priority_queue'  => $priorityItems,
    'calendar'        => $calendarSessions,
]);
