<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/ai-governance.php';
require_once __DIR__ . '/../../../lib/lib/ai-helpers.php';
require_once __DIR__ . '/../../../lib/lib/ai-system.php';
require_once __DIR__ . '/../../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))     json_err('Not authenticated', 401);

$input        = json_decode(file_get_contents('php://input'), true) ?? [];
$studentId    = (int)($input['student_id']   ?? 0);
$analysis     = $input['analysis']           ?? null;
$sections     = (array)($input['sections']   ?? ['writing','speaking']);
$lessonFocus  = trim((string)($input['lesson_focus']  ?? ''));
$extraContext = trim((string)($input['extra_context'] ?? ''));

if ($studentId <= 0) json_err('Invalid student ID');

$stmt = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$stmt->execute([$studentId]);
if (!$stmt->fetch()) json_err('Student not found', 404);

$allowedSections = ['listening','reading','mcq','writing','speaking'];
$sections = array_values(array_filter($sections, fn($s) => in_array($s, $allowedSections, true)));
if (empty($sections)) $sections = ['writing','speaking'];

try {
    $ctx  = get_student_context($pdo, $studentId);
    $text = build_context_text($ctx);

    $analysisText = '';
    if (is_array($analysis)) {
        $analysisText  = "Student analysis:\n";
        $analysisText .= "  Recommended homework: " . ($analysis['homework_recommendation'] ?? '') . "\n";
        $analysisText .= "  Weak areas: " . implode(', ', (array)($analysis['weak_areas'] ?? [])) . "\n\n";
    }

    $sectionsRequested   = implode(', ', $sections);
    $sectionInstructions = '';
    $sectionJson         = '';

    if (in_array('listening', $sections)) {
        $sectionInstructions .= "- Listening: suggest a YouTube search query or topic for a short clip appropriate for this level.\n";
        $sectionJson .= '  "listening": { "included": true, "instructions": "Instructions for the student", "suggested_topic": "YouTube search or topic" },' . "\n";
    } else { $sectionJson .= '  "listening": { "included": false },' . "\n"; }

    if (in_array('reading', $sections)) {
        $sectionInstructions .= "- Reading: write a SHORT Arabic passage (4-8 sentences) with tashkeel on all Arabic words.\n";
        $sectionJson .= '  "reading": { "included": true, "text": "Arabic passage with tashkeel" },' . "\n";
    } else { $sectionJson .= '  "reading": { "included": false },' . "\n"; }

    if (in_array('mcq', $sections)) {
        $sectionInstructions .= "- MCQ: 3-5 questions related to the topic.\n";
        $sectionJson .= '  "mcq": { "included": true, "questions": [{ "question_text": "...", "opt_a": "...", "opt_b": "...", "opt_c": "...", "opt_d": "...", "correct_option": "a" }] },' . "\n";
    } else { $sectionJson .= '  "mcq": { "included": false },' . "\n"; }

    if (in_array('writing', $sections)) {
        $sectionInstructions .= "- Writing: 1-2 short writing tasks (3-5 sentences each).\n";
        $sectionJson .= '  "writing": { "included": true, "questions": [{ "prompt": "...", "min_sentences": 3, "focus": "..." }] },' . "\n";
    } else { $sectionJson .= '  "writing": { "included": false },' . "\n"; }

    if (in_array('speaking', $sections)) {
        $sectionInstructions .= "- Speaking: 1-2 speaking tasks. Student records audio.\n";
        $sectionJson .= '  "speaking": { "included": true, "questions": [{ "prompt": "...", "time_limit_seconds": 60, "tips": "..." }] }' . "\n";
    } else { $sectionJson .= '  "speaking": { "included": false }' . "\n"; }

    $system = <<<SYSTEM
You are an Arabic homework designer for foreign language learners.
Design practical, engaging homework that reinforces speaking and real communication.
Keep it light and achievable — max 10-15 minutes total student effort.
Use tashkeel (حَرَكَات) for all newly introduced Arabic vocabulary.
Students are foreign learners of Arabic, not native speakers.
Respond with valid JSON only — no markdown, no extra text.
SYSTEM;

    $user = <<<USER
Design homework for this Arabic language student.

{$text}
{$analysisText}
Lesson focus: {$lessonFocus}
Extra notes: {$extraContext}
Sections to include: {$sectionsRequested}

Section instructions:
{$sectionInstructions}

Return ONLY this JSON:
{
  "title": "Homework title (short, descriptive)",
  {$sectionJson}
}

Important:
- Keep total homework under 15 minutes effort
- correct_option in MCQ must be exactly: "a", "b", "c", or "d"
- Arabic text must include tashkeel where appropriate
- Prompts should feel natural and conversational
USER;

    $aiCall = ai_governance_logged_claude_json($pdo, 'generate_homework', $studentId, $system, $user, 2500, 'Generate homework draft');
    $result = $aiCall['result'];

    if (!isset($result['title'])) $result['title'] = 'Homework';
    foreach ($allowedSections as $sec) {
        if (!isset($result[$sec])) $result[$sec] = ['included' => false];
    }

    json_ok(['homework' => $result, 'ai_request_id' => $aiCall['request_id']]);

} catch (RuntimeException $e) {
    ai_governance_json_error($e);
}
