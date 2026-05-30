<?php
// api/teacher/ai-report.php — Generate a full student progress report
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/ai-governance.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$studentId    = (int)($input['student_id'] ?? 0);
$academyName  = trim((string)($input['academy_name']  ?? ''));
$extraContext = trim((string)($input['extra_context'] ?? ''));

if ($studentId <= 0) json_err('Invalid student ID');

// ── Gather core data ─────────────────────────────────────────────────────
$ctx = get_student_context($pdo, $studentId);
if (empty($ctx['student'])) json_err('Student not found', 404);

$student   = $ctx['student'];
$contract  = $ctx['contract'] ?? null;
$sessions  = $ctx['sessions'] ?? [];
$subs      = $ctx['submissions'] ?? [];
$recs      = $ctx['recordings']  ?? [];
$weakWords = $ctx['weak_words']  ?? [];
$mistakes  = $ctx['mistakes']    ?? [];

// ── Add reviews as homework submissions ──────────────────────────────────
$reviewSubs = [];
try {
    $rStmt = $pdo->prepare("
        SELECT sr.title AS hw_title,
               srs.total_score AS mcq_score,
               r.total_points  AS mcq_total,
               srs.submitted_at,
               srs.teacher_note,
               'review' AS sub_type,
               sr.review_type
        FROM student_review_submissions srs
        JOIN student_reviews sr ON sr.id = srs.review_id
        LEFT JOIN (
            SELECT review_id, SUM(points) AS total_points
            FROM review_mcq_questions
            GROUP BY review_id
        ) r ON r.review_id = sr.id
        WHERE srs.student_id = ?
        ORDER BY srs.submitted_at DESC
        LIMIT 10
    ");
    $rStmt->execute([$studentId]);
    $reviewSubs = $rStmt->fetchAll();
} catch (Throwable $e) {}

// Merge: reviews labelled as Review, homeworks as Homework
$allSubs = array_merge(
    array_map(fn($s) => array_merge($s, ['sub_type' => 'homework']), $subs),
    $reviewSubs
);
usort($allSubs, fn($a, $b) => strcmp((string)($b['submitted_at'] ?? ''), (string)($a['submitted_at'] ?? '')));

// ── Stats ────────────────────────────────────────────────────────────────
// Fix: session status is 'completed' (not 'done')
$doneSessions  = count(array_filter($sessions, static fn($s) => ($s['status'] ?? '') === 'completed'));
$totalSessions = count($sessions);

$hwSubmitted   = count(array_filter($allSubs, fn($s) => ($s['sub_type'] ?? 'homework') === 'homework'));
$revSubmitted  = count($reviewSubs);
$totalSubmitted = count($allSubs);

$mcqScores = [];
foreach ($allSubs as $s) {
    if ((int)($s['mcq_total'] ?? 0) > 0) {
        $mcqScores[] = (float)$s['mcq_score'] / (int)$s['mcq_total'];
    }
}
$avgScoreStr = $mcqScores ? round(array_sum($mcqScores) / count($mcqScores) * 100) . '%' : 'N/A';

$levelDesc = [
    'A1'=>'Complete Beginner','A2'=>'Elementary','B1'=>'Intermediate',
    'B2'=>'Upper Intermediate','C1'=>'Advanced','C2'=>'Mastery',
];
$level     = strtoupper((string)($student['level'] ?? 'A2'));
$levelFull = $level . ' — ' . ($levelDesc[$level] ?? $level);

$contractInfo = $contract
    ? ($contract['total_hours'] . ' hours total, ' . $contract['session_duration_minutes']
       . ' min/session, started ' . ($contract['start_date'] ?? 'N/A')
       . ', ' . $contract['total_sessions'] . ' sessions planned')
    : 'No contract on file';

// ── Build detailed session list ──────────────────────────────────────────
$sessionsList = '';
foreach ($sessions as $s) {
    $status    = ($s['status'] === 'completed') ? '✅' : '⬜';
    $date      = $s['actual_date'] ?? $s['planned_date'] ?? '';
    $skills    = !empty($s['skills'])       ? ' Skills: ' . $s['skills']       : '';
    $goals     = !empty($s['goals'])        ? ' | Goals: ' . $s['goals']       : '';
    $notes     = !empty($s['teacher_notes'])? ' | Teacher notes: ' . $s['teacher_notes'] : '';
    $sessionsList .= "  $status Session {$s['session_number']}: " . ($s['title'] ?? 'Untitled')
        . ($date ? " ($date)" : '') . $skills . $goals . $notes . "\n";
}

// ── Build submission list ─────────────────────────────────────────────────
$hwList = '';
foreach (array_slice($allSubs, 0, 12) as $s) {
    $type     = ($s['sub_type'] === 'review') ? '[Review]' : '[Homework]';
    $scoreStr = ((int)($s['mcq_total'] ?? 0) > 0)
        ? $s['mcq_score'] . '/' . $s['mcq_total']
        : 'No score';
    $note = !empty($s['teacher_note']) ? ' — teacher: ' . $s['teacher_note'] : '';
    $hwList .= "  - $type " . ($s['hw_title'] ?? 'Assignment') . ": $scoreStr" . $note . "\n";
}

$scList = '';
foreach (array_slice($recs, 0, 8) as $r) {
    $note   = !empty($r['teacher_note']) ? ' — ' . $r['teacher_note'] : '';
    $scList .= "  - " . ($r['sc_title'] ?? 'Scenario') . ": {$r['take_count']} take(s)$note\n";
}

$weakStr    = $weakWords ? implode(', ', array_slice($weakWords, 0, 15)) : 'none';
$mistakeStr = $mistakes  ? implode(', ', array_slice($mistakes,  0, 10)) : 'none';

$currentDate  = date('d M Y');
$studentName  = (string)($student['full_name'] ?? '');
$studentAge   = (string)($student['age'] ?? '');
$studentCountry = (string)($student['country'] ?? '');

// ── AI prompt ────────────────────────────────────────────────────────────
$system = 'You are an expert Arabic language teacher assistant writing a formal student progress report. '
        . 'Write clearly and professionally. The report will be shared with the student and/or their family. '
        . 'Write in English. Be honest, specific, and encouraging. '
        . 'Use the REAL data provided — do NOT invent information. If sessions are 0, say so honestly. '
        . 'Respond with valid JSON only — no markdown fences, no extra text.';

$userPrompt = "Generate a complete, detailed student progress report using ONLY the data below.\n\n"
    . "Report date: $currentDate\n"
    . "Student: $studentName | Level: $levelFull | Age: $studentAge | Country: $studentCountry\n"
    . "Contract: $contractInfo\n"
    . "Sessions completed: $doneSessions of $totalSessions planned\n"
    . "Homework submitted: $hwSubmitted | Reviews submitted: $revSubmitted | Total assignments: $totalSubmitted\n"
    . "Average score: $avgScoreStr\n"
    . ($hwList   ? "\nRecent assignments (homework + reviews):\n$hwList" : "\nNo assignments submitted yet.\n")
    . ($scList   ? "\nSpeaking scenarios:\n$scList" : "\nNo scenario recordings yet.\n")
    . "Weak vocabulary words: $weakStr\n"
    . "Tracked grammar/error patterns: $mistakeStr\n"
    . ($sessionsList ? "\nFull session plan (✅=completed, ⬜=planned):\n$sessionsList" : "\nNo sessions planned yet.\n")
    . ($extraContext ? "\nTeacher note: $extraContext\n" : '')
    . "\nIMPORTANT: Use the session list above to describe exactly which topics were covered, what skills were practiced in each session, and any teacher notes. Be specific about session titles and content.\n"
    . "\nReturn this exact JSON:\n"
    . '{'
    . '"report_title":"Arabic Language Progress Report",'
    . '"generated_date":"' . $currentDate . '",'
    . '"student_name":"' . addslashes($studentName) . '",'
    . '"current_level":"' . $levelFull . '",'
    . '"executive_summary":"3-4 sentences summarizing real progress based on the data above",'
    . '"progress_highlights":["specific highlight from session data","specific highlight from assignments","specific highlight from scores — 3 items"],'
    . '"strengths":["specific strength based on data — 3 items"],'
    . '"areas_for_improvement":["specific area from weak words or mistakes — 3 items"],'
    . '"sessions_overview":"Detailed paragraph: how many sessions done, which topics covered (use real session titles), skills practiced, teacher notes if any",'
    . '"homework_performance":"Paragraph: how many homeworks + reviews submitted, scores achieved, quality based on teacher notes",'
    . '"speaking_performance":"Paragraph: scenario recordings, how many takes, teacher feedback if available",'
    . '"vocabulary_notes":"Specific weak words listed, patterns in mistakes, what to focus on",'
    . '"recommendations":["actionable recommendation 1","actionable recommendation 2","actionable recommendation 3"],'
    . '"teacher_message":"Warm personal message to the student — 3-4 sentences, encouraging but specific",'
    . '"next_steps":"Specific next sessions to cover, upcoming milestones, what to prepare"'
    . '}';

try {
    $aiCall = ai_governance_logged_claude_json($pdo, 'generate_weekly_summary', $studentId, $system, $userPrompt, 3000, 'Generate student progress report');
    $report = $aiCall['result'];
} catch (RuntimeException $e) {
    ai_governance_json_error($e);
}

// Attach metadata for the frontend to display in stats boxes
$report['academy_name']     = $academyName ?: null;
$report['student_level']    = $level;
$report['sessions_done']    = $doneSessions;
$report['sessions_total']   = $totalSessions;
$report['hw_submitted']     = $hwSubmitted;
$report['rev_submitted']    = $revSubmitted;
$report['total_submitted']  = $totalSubmitted;
$report['avg_score']        = $avgScoreStr;
$report['contract_info']    = $contractInfo;
$report['student_country']  = $studentCountry;
$report['student_age']      = $studentAge;

json_ok(['report' => $report, 'ai_request_id' => $aiCall['request_id'] ?? null]);
