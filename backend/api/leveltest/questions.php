<?php
// api/leveltest/questions.php — Public: fetch all level-test question data (GET, no auth)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/leveltest_bank.php';
require_once __DIR__ . '/../../lib/lib/leveltest_db.php';
require_once __DIR__ . '/../../config/config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);

lt_ensure_db_tables($pdo);

$questions = [];

/* ── MCQ blocks (listening + reading) ──────────────────────── */
$mcqSql = "
    SELECT b.id          AS block_id,
           b.section,
           b.block_number,
           b.cefr_level,
           b.audio_path,
           b.passage_ar,
           q.id          AS q_id,
           q.item_number,
           q.question_ar,
           q.opt_a_ar,
           q.opt_b_ar,
           q.opt_c_ar,
           q.opt_d_ar,
           q.correct_opt
    FROM lt_blocks b
    JOIN lt_questions q
         ON q.block_id = b.id
        AND q.is_active = 1
    WHERE b.is_active = 1
    ORDER BY b.section DESC, b.block_number, q.item_number
";

$rows   = $pdo->query($mcqSql)->fetchAll();
$blocks = [];

foreach ($rows as $row) {
    $bid = (int) $row['block_id'];

    if (!isset($blocks[$bid])) {
        $isListening       = $row['section'] === 'listening';
        $blocks[$bid] = [
            'id'          => $bid,
            'type'        => 'mcq',
            'section'     => $row['section'],
            'blockNumber' => (int) $row['block_number'],
            'cefrLevel'   => $row['cefr_level'],
            'audioPath'   => $isListening ? ($row['audio_path'] ?: null) : null,
            'passageAr'   => !$isListening ? ($row['passage_ar'] ?: null) : null,
            'questions'   => [],
        ];
    }

    $options = array_values(array_filter([
        $row['opt_a_ar'] ?: null,
        $row['opt_b_ar'] ?: null,
        $row['opt_c_ar'] ?: null,
        $row['opt_d_ar'] ?: null,
    ]));

    $blocks[$bid]['questions'][] = [
        'id'            => (int) $row['q_id'],
        'itemNumber'    => (int) $row['item_number'],
        'question'      => $row['question_ar'],
        'options'       => $options,
        'correctAnswer' => strtoupper((string) $row['correct_opt']),
    ];
}

foreach (array_values($blocks) as $block) {
    $questions[] = $block;
}

/* ── Writing prompts ────────────────────────────────────────── */
$questions[] = [
    'id'     => 'writing_task1',
    'type'   => 'writing',
    'prompt' => lt_writing_task1_prompt(),
];

// Task 2 prompt varies by level — return all variants; frontend picks after MCQ scoring
$writingTask2Prompts = [];
foreach (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as $level) {
    $writingTask2Prompts[$level] = lt_writing_task2_for_level($level);
}
$questions[] = [
    'id'      => 'writing_task2',
    'type'    => 'writing',
    'prompt'  => lt_writing_task2_for_level('B1'), // default shown before level is known
    'prompts' => $writingTask2Prompts,
];

/* ── Speaking prompts ───────────────────────────────────────── */
foreach (lt_speaking_prompts() as $key => $sp) {
    $questions[] = [
        'id'       => $key,
        'type'     => 'speaking',
        'number'   => (int) str_replace('speaking_', '', $key),
        'prompt'   => $sp['title'],
        'bullets'  => $sp['bullets'],
        'imageUrl' => $sp['image'] ?? null,
    ];
}

json_ok(['questions' => $questions]);
