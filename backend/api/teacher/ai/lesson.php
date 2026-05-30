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

$input         = json_decode(file_get_contents('php://input'), true) ?? [];
$studentId     = (int)($input['student_id']     ?? 0);
$analysis      = $input['analysis']             ?? null;
$sessionNumber = (int)($input['session_number'] ?? 0);
$extraContext  = trim((string)($input['extra_context'] ?? ''));

if ($studentId <= 0) json_err('Invalid student ID');

$stmt = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$stmt->execute([$studentId]);
if (!$stmt->fetch()) json_err('Student not found', 404);

try {
    $ctx      = get_student_context($pdo, $studentId);
    $text     = build_context_text($ctx);
    $contract = $ctx['contract'];
    $duration = $contract ? $contract['session_duration_minutes'] : 90;

    $analysisText = '';
    if (is_array($analysis)) {
        $analysisText  = "Student analysis:\n";
        $analysisText .= "  Status: " . ($analysis['status'] ?? '') . "\n";
        $analysisText .= "  Strengths: " . implode(', ', (array)($analysis['strengths'] ?? [])) . "\n";
        $analysisText .= "  Weak areas: " . implode(', ', (array)($analysis['weak_areas'] ?? [])) . "\n";
        $analysisText .= "  Recommended focus: " . ($analysis['recommended_focus'] ?? '') . "\n\n";
    }

    $sessionCtx = $sessionNumber > 0 ? "Session number: #{$sessionNumber}" : "Next upcoming session";

    $system = <<<SYSTEM
You are an expert Arabic language lesson designer for foreign learners.
Design practical, speaking-first Arabic lessons that build real communication ability.
Rules:
- Focus on real-life communication, not grammar theory
- Keep it achievable and appropriate for the student's level
- Include tashkeel (short vowel marks: حَرَكَات) on all newly introduced Arabic vocabulary
- Build speaking confidence through guided practice
- Avoid overloading the student with too much content
- Vocabulary example sentences should be short and practical
Respond with valid JSON only — no markdown, no extra text.
SYSTEM;

    $user = <<<USER
Design one complete Arabic lesson for this student.

{$text}
{$analysisText}
Priority order:
1) Address weak areas
2) Reinforce strengths
3) Progress toward next learning goal

Context: {$sessionCtx}, Duration: {$duration} minutes
Extra notes: {$extraContext}

Return ONLY this JSON:
{
  "lesson_title": "Short title (max 8 words)",
  "lesson_objective": "By the end of this lesson, the student will be able to...",
  "level_note": "One sentence: why this lesson is appropriate for this student's level",
  "warm_up": {
    "duration_minutes": 5,
    "activity": "Description of warm-up activity",
    "teacher_instructions": "Step-by-step teacher guide"
  },
  "vocabulary": [
    {
      "arabic": "كَلِمَة",
      "transliteration": "kalima",
      "meaning": "word",
      "example_sentence": "أَنا أَقرأ كَلِمة."
    }
  ],
  "guided_practice": {
    "duration_minutes": 15,
    "activity": "Description of guided practice",
    "teacher_instructions": "Step-by-step teacher guide"
  },
  "main_speaking_task": {
    "duration_minutes": 20,
    "description": "What the student will do",
    "student_instructions": "Instructions read to/by the student",
    "example_prompts": ["Prompt 1", "Prompt 2", "Prompt 3"]
  },
  "feedback_correction": {
    "focus_points": ["What to listen for and correct during the lesson"],
    "encouragement_tip": "How to keep the student motivated"
  },
  "homework_suggestion": "Brief description of a light follow-up homework task",
  "slides_outline": [
    { "slide": 1, "title": "Slide title", "content": "Key content (keep it brief and visual)" }
  ]
}

Include 4-8 vocabulary items with proper tashkeel.
Include 3-5 slides in slides_outline.
USER;

    $aiCall = ai_governance_logged_claude_json($pdo, 'prepare_next_lesson', $studentId, $system, $user, 3000, 'Prepare next lesson draft');
    $result = $aiCall['result'];

    foreach (['lesson_title','lesson_objective','vocabulary','warm_up','main_speaking_task'] as $key) {
        if (!isset($result[$key])) $result[$key] = null;
    }
    if (!is_array($result['vocabulary']))     $result['vocabulary']     = [];
    if (!is_array($result['slides_outline'])) $result['slides_outline'] = [];

    json_ok(['lesson' => $result, 'ai_request_id' => $aiCall['request_id']]);

} catch (RuntimeException $e) {
    ai_governance_json_error($e);
}
