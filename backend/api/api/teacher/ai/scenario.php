<?php
// api/teacher/ai/scenario.php — Generate a speaking scenario with AI
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/helpers.php';
require_once __DIR__ . '/../../../lib/ai-governance.php';
require_once __DIR__ . '/../../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);

$input        = json_decode(file_get_contents('php://input'), true) ?? [];
$studentId    = (int)($input['student_id']   ?? 0);
$analysis     = $input['analysis']           ?? null;
$topic        = trim((string)($input['topic']         ?? ''));
$extraContext = trim((string)($input['extra_context']  ?? ''));

if ($studentId <= 0) json_err('Invalid student ID');

$stmt = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$stmt->execute([$studentId]);
if (!$stmt->fetch()) json_err('Student not found', 404);

try {
    $ctx  = get_student_context($pdo, $studentId);
    $text = build_context_text($ctx);

    $analysisText = '';
    if (is_array($analysis)) {
        $analysisText  = "Student analysis:\n";
        $analysisText .= "  Scenario recommendation: " . ($analysis['scenario_recommendation'] ?? '') . "\n";
        $analysisText .= "  Weak areas: " . implode(', ', (array)($analysis['weak_areas'] ?? [])) . "\n\n";
    }

    $topicHint = $topic
        ? "Suggested topic/context: {$topic}"
        : "Choose the most suitable real-life topic for this student's level.";

    $system = <<<SYSTEM
You are an Arabic speaking scenario designer for foreign language learners.
Design realistic, practical speaking scenarios that encourage real communication in Arabic.
Scenarios should feel like situations the student might actually face in real life.
The scenario must require the student to speak in full sentences, not single words.
Keep the language level appropriate — use simple, practical Arabic.
Provide tashkeel (حَرَكَات) on the vocabulary hint words.
Students are foreign learners of Arabic, not native speakers.
Respond with valid JSON only — no markdown, no extra text.
SYSTEM;

    $user = <<<USER
Design one Arabic speaking scenario for this student.

{$text}
{$analysisText}
{$topicHint}
Extra notes: {$extraContext}

The scenario must:
- Feel like a real-life situation (at a café, meeting someone, asking directions, shopping, etc.)
- Require the student to produce full Arabic sentences
- Match the student's current level — not too easy, not too hard
- Include helpful vocabulary keywords with tashkeel

Return ONLY this JSON:
{
  "title": "Short scenario title",
  "situation": "2-3 sentences describing the context and setting in English",
  "prompt": "Clear instruction to the student: what they must say or do, in English",
  "time_limit_seconds": 120,
  "keywords": ["كَلِمَة مع تشكيل", "another keyword"],
  "model_answer": "An example of a good student response in Arabic (with tashkeel on key words) — for teacher reference only"
}

time_limit_seconds should be between 60 and 300 based on difficulty.
Include 4-8 keywords with Arabic tashkeel.
USER;

    $aiCall = ai_governance_logged_claude_json($pdo, 'generate_scenario', $studentId, $system, $user, 1500, 'Generate speaking scenario draft');
    $result = $aiCall['result'];

    $result['title']              = trim((string)($result['title']              ?? 'Speaking Scenario'));
    $result['situation']          = trim((string)($result['situation']          ?? ''));
    $result['prompt']             = trim((string)($result['prompt']             ?? ''));
    $result['time_limit_seconds'] = max(60, min(300, (int)($result['time_limit_seconds'] ?? 120)));
    $result['keywords']           = array_values((array)($result['keywords']    ?? []));
    $result['model_answer']       = trim((string)($result['model_answer']       ?? ''));

    json_ok(['scenario' => $result, 'ai_request_id' => $aiCall['request_id']]);

} catch (RuntimeException $e) {
    ai_governance_json_error($e);
}
