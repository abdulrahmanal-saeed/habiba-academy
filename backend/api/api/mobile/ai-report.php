<?php
// api/mobile/ai-report.php — AI progress report for mobile app (token-auth wrapper)
declare(strict_types=1);
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// Accept JSON body
$body = [];
$contentType = (string)($_SERVER['CONTENT_TYPE'] ?? '');
if (str_contains($contentType, 'application/json')) {
    $body = (array)(json_decode(file_get_contents('php://input'), true) ?? []);
} else {
    $body = $_POST;
}

$studentId = (int)($body['student_id'] ?? 0);
if ($studentId <= 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'student_id required']);
    exit;
}

// Set teacher session so the existing ai-report.php endpoint works
$_SESSION['teacher_logged'] = true;
start_session();

// Proxy to the existing ai-report endpoint logic
// We replicate the core logic here to avoid session complexity
require_once __DIR__ . '/../../lib/ai-helpers.php';

try {
    $ctx = get_student_context($pdo, $studentId);
} catch (Throwable $e) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Student not found']);
    exit;
}

$apiKey = trim((string)(getenv('ANTHROPIC_API_KEY') ?: ''));
if ($apiKey === '') {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'AI service not configured']);
    exit;
}

$contextText = build_context_text($ctx);
$levelDesc   = get_level_description($ctx['student']['level'] ?? 'A1');

$systemPrompt = "You are an expert Arabic language teacher assistant creating detailed, professional student progress reports.
Write in both Arabic and English. Be specific, encouraging, and constructive.
Focus on practical improvements and celebrate achievements.
Always respond with valid JSON only — no markdown, no explanation outside JSON.";

$userPrompt = "Generate a comprehensive progress report for this Arabic language student.

{$contextText}

Return JSON with this exact structure:
{
  \"report_title\": \"تقرير تقدم الطالب · Student Progress Report\",
  \"generated_date\": \"" . date('Y-m-d') . "\",
  \"student_name\": \"{$ctx['student']['full_name']}\",
  \"current_level\": \"{$ctx['student']['level']}\",
  \"executive_summary\": \"2-3 sentence Arabic + English summary\",
  \"progress_highlights\": [\"highlight 1\", \"highlight 2\", \"highlight 3\"],
  \"strengths\": [\"strength 1\", \"strength 2\"],
  \"areas_for_improvement\": [\"area 1\", \"area 2\"],
  \"sessions_overview\": \"Summary of sessions attended and quality\",
  \"homework_performance\": \"Summary of homework scores and engagement\",
  \"speaking_performance\": \"Summary of speaking scenario performance\",
  \"vocabulary_notes\": \"Notes on vocabulary progress and weak words\",
  \"recommendations\": [\"recommendation 1\", \"recommendation 2\", \"recommendation 3\"],
  \"teacher_message\": \"Personalized encouraging message in Arabic to the student\",
  \"next_steps\": [\"next step 1\", \"next step 2\"]
}";

try {
    $report = claude_chat($systemPrompt, $userPrompt, 3000);
} catch (RuntimeException $e) {
    if ($e->getMessage() === 'NO_API_KEY') {
        http_response_code(503);
        echo json_encode(['ok' => false, 'error' => 'AI service not configured']);
    } else {
        http_response_code(502);
        echo json_encode(['ok' => false, 'error' => 'AI generation failed: ' . $e->getMessage()]);
    }
    exit;
}

// Attach metadata
$report['_meta'] = [
    'student_level'   => $ctx['student']['level'],
    'sessions_done'   => $ctx['stats']['done'] ?? 0,
    'sessions_total'  => $ctx['stats']['total'] ?? 0,
    'student_country' => $ctx['student']['country'] ?? '',
    'student_age'     => $ctx['student']['age'] ?? null,
];

try {
    $save = $pdo->prepare("INSERT INTO mobile_ai_reports (student_id, report_json) VALUES (?, ?)");
    $save->execute([$studentId, json_encode($report, JSON_UNESCAPED_UNICODE)]);
} catch (Throwable $ignored) {
    // Report generation should still succeed if history storage is unavailable.
}

echo json_encode(['ok' => true, 'report' => $report], JSON_UNESCAPED_UNICODE);
