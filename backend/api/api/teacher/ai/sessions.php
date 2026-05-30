<?php
// api/teacher/ai/sessions.php — Generate lesson session suggestions with AI
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/helpers.php';
require_once __DIR__ . '/../../../lib/ai-governance.php';
require_once __DIR__ . '/../../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);

$studentId    = (int)($_GET['student_id']   ?? 0);
$onlyEmpty    = (int)($_GET['only_empty']   ?? 1);
$countParam   = (int)($_GET['count']        ?? 0);
$extraContext = trim($_GET['extra_context'] ?? '');

if ($studentId <= 0) json_err('Invalid student ID');

$stmt = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$stmt->execute([$studentId]);
if (!$stmt->fetch()) json_err('Student not found', 404);

try {
    $ctx  = get_student_context($pdo, $studentId);
    $text = build_context_text($ctx);

    $allSessions = $ctx['sessions'];
    if ($onlyEmpty) {
        $targetSessions = array_values(array_filter($allSessions, fn($s) => empty(trim($s['title'] ?? ''))));
    } else {
        $targetSessions = array_values(array_filter($allSessions, fn($s) => $s['status'] === 'planned'));
    }

    if (empty($targetSessions)) json_err('No sessions to fill — all sessions already have titles');

    $count          = $countParam > 0 ? min($countParam, 20) : min(count($targetSessions), 20);
    $targetSessions = array_slice($targetSessions, 0, $count);
    $sessionNumbers = implode(', ', array_column($targetSessions, 'session_number'));
    $sessionCount   = count($targetSessions);
    $contract       = $ctx['contract'];
    $duration       = $contract ? $contract['session_duration_minutes'] : 90;

    $system = <<<SYSTEM
Before planning sessions, you MUST consider the student's current weaknesses, strengths, and progress history.

You are a curriculum planner for Arabic as a foreign language. You help teachers plan session-by-session learning paths.
The approach is speaking-first: practical Arabic, real communication, sentence production, tashkeel on new vocabulary.
Students are foreign learners — not native speakers.
Respond with valid JSON only — no markdown, no extra text.
SYSTEM;

    $user = <<<USER
Plan {$sessionCount} Arabic lesson sessions for this student.

{$text}
Extra context: {$extraContext}

Sessions to plan (by number): {$sessionNumbers}
Session duration: {$duration} minutes each

Rules:
- Build progressively on what was already completed
- Address weak areas first
- Keep sessions practical and speaking-focused
- Vary skills across sessions (don't repeat the same focus every time)

Return ONLY this JSON:
{
  "sessions": [
    {
      "session_number": 1,
      "title": "Short descriptive title (max 8 words)",
      "skills": ["speaking", "vocabulary"],
      "goals": "One sentence: what the student will achieve"
    }
  ]
}

Allowed skills (use only these): grammar, vocabulary, speaking, listening, reading, writing, pronunciation, revision
USER;

    $aiCall = ai_governance_logged_claude_json($pdo, 'plan_remaining_sessions', $studentId, $system, $user, 2000, 'Plan remaining sessions');
    $result = $aiCall['result'];

    if (!isset($result['sessions']) || !is_array($result['sessions'])) {
        json_err('AI returned unexpected format', 502);
    }

    $allowedSkills = ['grammar','vocabulary','speaking','listening','reading','writing','pronunciation','revision'];
    $validSessions = [];
    foreach ($result['sessions'] as $s) {
        if (!isset($s['session_number']) || !isset($s['title'])) continue;
        $skills = array_values(array_filter((array)($s['skills'] ?? []), fn($sk) => in_array($sk, $allowedSkills, true)));
        $validSessions[] = [
            'session_number' => (int)$s['session_number'],
            'title'          => trim((string)$s['title']),
            'skills'         => $skills,
            'goals'          => trim((string)($s['goals'] ?? '')),
        ];
    }

    json_ok(['sessions' => $validSessions, 'ai_request_id' => $aiCall['request_id']]);

} catch (RuntimeException $e) {
    ai_governance_json_error($e);
}
