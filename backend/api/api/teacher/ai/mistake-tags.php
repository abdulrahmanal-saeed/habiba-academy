<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/helpers.php';
require_once __DIR__ . '/../../../lib/ai-system.php';
require_once __DIR__ . '/../../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$studentId = (int)($_POST['student_id'] ?? 0);
$text = trim((string)($_POST['text'] ?? ''));
if ($studentId <= 0) json_err('Invalid student ID');
if ($text === '') json_err('Text is required');

$taxonomy = ai_active_taxonomy($pdo);
$suggestions = [];
$lower = mb_strtolower($text, 'UTF-8');

foreach ($taxonomy as $tag) {
    $code = (string)$tag['code'];
    $score = 0;

    if ((str_contains($lower, 'هذا') || str_contains($lower, 'هذه')) && $code === 'grammar_gender') {
        $score += 1;
    }
    if ((str_contains($lower, 'هو') || str_contains($lower, 'هي')) && $code === 'grammar_pronoun') {
        $score += 1;
    }
    if (mb_strlen($text, 'UTF-8') < 12 && $code === 'sentence_incomplete') {
        $score += 2;
    }
    if (preg_match('/\s{2,}/u', $text) && $code === 'grammar_word_order') {
        $score += 1;
    }
    if (preg_match('/[a-z]{4,}/i', $text) && $code === 'vocabulary_missing_word') {
        $score += 1;
    }

    if ($score > 0) {
        $suggestions[] = [
            'taxonomy_id' => (int)$tag['id'],
            'code' => $code,
            'label_en' => $tag['label_en'],
            'label_ar' => $tag['label_ar'],
            'confidence' => min(0.9, 0.45 + ($score * 0.15)),
            'reason' => 'Rule-based signal from the submitted answer.',
        ];
    }
}

if (!$suggestions) {
    foreach (array_slice($taxonomy, 0, 3) as $tag) {
        $suggestions[] = [
            'taxonomy_id' => (int)$tag['id'],
            'code' => $tag['code'],
            'label_en' => $tag['label_en'],
            'label_ar' => $tag['label_ar'],
            'confidence' => 0.35,
            'reason' => 'Low-confidence fallback. Teacher should verify.',
        ];
    }
}

$requestId = ai_log_request($pdo, [
    'student_id' => $studentId,
    'feature_key' => 'mistake_tags_rule',
    'model' => 'rule-detector',
    'input_hash' => ai_input_hash(['student_id' => $studentId, 'text' => $text]),
    'input_summary' => mb_substr($text, 0, 200, 'UTF-8'),
    'output' => ['suggestions' => $suggestions],
    'status' => 'success',
]);

json_ok(['suggestions' => $suggestions, 'ai_request_id' => $requestId]);
