<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/helpers.php';
require_once __DIR__ . '/../../../lib/ai-helpers.php';
require_once __DIR__ . '/../../../lib/ai-system.php';
require_once __DIR__ . '/../../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$studentId = (int)($_POST['student_id'] ?? 0);
$prompt = trim((string)($_POST['prompt'] ?? ''));
$answer = trim((string)($_POST['answer'] ?? ''));
$sample = trim((string)($_POST['sample_answer'] ?? ''));
$criteria = trim((string)($_POST['criteria'] ?? ''));

if ($studentId <= 0) json_err('Invalid student ID');
if ($answer === '') json_err('No answer to analyze');

$featureKey = 'writing_review_assist';
$model = 'claude-haiku-4-5-20251001';
$input = [
    'student_id' => $studentId,
    'prompt' => $prompt,
    'answer' => $answer,
    'sample' => $sample,
    'criteria' => $criteria,
];
$hash = ai_input_hash($input);

if ($cached = ai_cache_get($pdo, $featureKey, $hash)) {
    $requestId = ai_log_request($pdo, [
        'student_id' => $studentId,
        'feature_key' => $featureKey,
        'model' => $model,
        'input_hash' => $hash,
        'input_summary' => 'Cached writing review assist',
        'output' => $cached,
        'status' => 'cached',
    ]);
    json_ok(['assist' => $cached, 'ai_request_id' => $requestId, 'cached' => true]);
}

$system = <<<SYSTEM
You are an internal Arabic teacher assistant. You help the teacher review writing by suggesting possible issues only.
Do not grade automatically. Do not be overconfident. The teacher is the final decision maker.
Return valid JSON only.
SYSTEM;

$user = <<<USER
Review this Arabic writing answer for a non-native learner.

Prompt: {$prompt}
Student answer: {$answer}
Sample answer if available: {$sample}
Grading criteria if available: {$criteria}

Return only this JSON:
{
  "summary": "one concise teacher-facing summary",
  "possible_issues": ["issue 1", "issue 2"],
  "suggested_feedback": "short editable feedback for the teacher to send",
  "suggested_correction": "possible corrected answer or empty string if not enough information",
  "suggested_tags": ["taxonomy-style tag 1", "taxonomy-style tag 2"],
  "confidence": 0.0
}
Use confidence from 0 to 1. Phrase issues as possible, not certain.
USER;

try {
    $promptVersionId = ai_get_or_create_prompt_version($pdo, $featureKey, 'v1', $system, $user, $model);
    $result = claude_chat($system, $user, 1400);
    $result = [
        'summary' => (string)($result['summary'] ?? ''),
        'possible_issues' => array_values((array)($result['possible_issues'] ?? [])),
        'suggested_feedback' => (string)($result['suggested_feedback'] ?? ''),
        'suggested_correction' => (string)($result['suggested_correction'] ?? ''),
        'suggested_tags' => array_values((array)($result['suggested_tags'] ?? [])),
        'confidence' => max(0, min(1, (float)($result['confidence'] ?? 0.5))),
    ];
    ai_cache_set($pdo, $featureKey, $hash, $result, 86400);
    $requestId = ai_log_request($pdo, [
        'student_id' => $studentId,
        'feature_key' => $featureKey,
        'prompt_version_id' => $promptVersionId,
        'model' => $model,
        'input_hash' => $hash,
        'input_summary' => mb_substr($answer, 0, 200, 'UTF-8'),
        'output' => $result,
        'status' => 'success',
    ]);
    json_ok(['assist' => $result, 'ai_request_id' => $requestId, 'cached' => false]);
} catch (RuntimeException $e) {
    $fallback = [
        'summary' => 'AI is unavailable. Use manual review and the rule-based mistake tags.',
        'possible_issues' => [],
        'suggested_feedback' => '',
        'suggested_correction' => '',
        'suggested_tags' => [],
        'confidence' => 0,
    ];
    $requestId = ai_log_request($pdo, [
        'student_id' => $studentId,
        'feature_key' => $featureKey,
        'model' => $model,
        'input_hash' => $hash,
        'input_summary' => mb_substr($answer, 0, 200, 'UTF-8'),
        'output' => $fallback,
        'status' => 'failed',
        'error_message' => $e->getMessage(),
    ]);
    json_ok(['assist' => $fallback, 'ai_request_id' => $requestId, 'cached' => false, 'warning' => $e->getMessage()]);
}
