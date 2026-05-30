<?php
// api/teacher/ai/analyze-student.php — Analyze student progress with AI
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/helpers.php';
require_once __DIR__ . '/../../../lib/ai-governance.php';
require_once __DIR__ . '/../../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);

$studentId    = (int)($_GET['student_id']   ?? 0);
$extraContext = trim($_GET['extra_context'] ?? '');

if ($studentId <= 0) json_err('Invalid student ID');

$stmt = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$stmt->execute([$studentId]);
if (!$stmt->fetch()) json_err('Student not found', 404);

try {
    $ctx  = get_student_context($pdo, $studentId);
    $text = build_context_text($ctx);

    $system = <<<SYSTEM
You are an expert Arabic language teacher assistant. You help teachers understand their students' progress and plan effective lessons.
The teaching approach is speaking-first: focus on practical communication, real-life Arabic, sentence production, and building confidence.
The students are foreign learners studying Arabic as a foreign language (not native speakers).
Always respond with valid JSON only — no markdown, no explanation outside the JSON.
SYSTEM;

    $user = <<<USER
Analyze this Arabic language student and return a structured JSON assessment.

{$text}
Extra context from teacher: {$extraContext}

Return ONLY this JSON (no extra text):
{
  "summary": "2-3 sentence overall assessment of the student's current level and progress",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weak_areas": ["specific weak area 1", "specific weak area 2"],
  "recommended_focus": "What the next 2-3 lessons should focus on — be specific",
  "homework_recommendation": "What kind and difficulty of homework suits this student right now",
  "scenario_recommendation": "What kind of speaking scenario topic would be most useful and achievable",
  "status": "on_track"
}

For status use exactly one of: "on_track", "needs_review", "needs_support"
USER;

    $aiCall = ai_governance_logged_claude_json($pdo, 'analyze_student', $studentId, $system, $user, 1500, 'Analyze student progress');
    $result = $aiCall['result'];

    $required = ['summary','strengths','weak_areas','recommended_focus','homework_recommendation','scenario_recommendation','status'];
    foreach ($required as $key) {
        if (!array_key_exists($key, $result)) $result[$key] = '';
    }
    if (!in_array($result['status'], ['on_track','needs_review','needs_support'], true)) {
        $result['status'] = 'on_track';
    }
    if (!is_array($result['strengths']))  $result['strengths']  = [];
    if (!is_array($result['weak_areas'])) $result['weak_areas'] = [];

    json_ok(['analysis' => $result, 'ai_request_id' => $aiCall['request_id']]);

} catch (RuntimeException $e) {
    ai_governance_json_error($e);
}
