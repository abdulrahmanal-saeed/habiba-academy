<?php
// api/teacher/leveltest-review-save.php — Save writing/speaking scores and final level
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$attempt_id     = (int)($_POST['attempt_id']     ?? 0);
$writing_score  = (int)($_POST['writing_score']  ?? 0);
$speaking_score = (int)($_POST['speaking_score'] ?? 0);
$teacher_notes  = trim((string)($_POST['teacher_notes'] ?? ''));

if ($attempt_id <= 0) json_err('Invalid attempt ID');

$row = $pdo->prepare("SELECT id, listening_score, reading_score, student_id FROM leveltest_attempts WHERE id = ?");
$row->execute([$attempt_id]);
$attempt = $row->fetch();
if (!$attempt) json_err('Attempt not found', 404);

function score_to_level(int $pct): string {
    if ($pct < 40) return 'A2';
    if ($pct < 55) return 'B1';
    if ($pct < 70) return 'B2';
    if ($pct < 85) return 'C1';
    return 'C2';
}

$listening_score = (int)$attempt['listening_score'];
$reading_score   = (int)$attempt['reading_score'];
$total_score     = $listening_score + $reading_score + $writing_score + $speaking_score;
$overall_pct     = (int)round($total_score / 175 * 100);
$final_level     = score_to_level($overall_pct);

$pdo->beginTransaction();
try {
    $pdo->prepare("
        UPDATE leveltest_attempts
        SET writing_score  = ?,
            speaking_score = ?,
            final_level    = ?,
            teacher_notes  = ?,
            review_status  = 'reviewed',
            reviewed_at    = NOW()
        WHERE id = ?
    ")->execute([$writing_score, $speaking_score, $final_level, $teacher_notes ?: null, $attempt_id]);

    if ($attempt['student_id']) {
        $pdo->prepare("UPDATE students SET level = ? WHERE id = ?")
            ->execute([$final_level, (int)$attempt['student_id']]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Failed to save review');
}

json_ok([
    'attempt_id'  => $attempt_id,
    'total_score' => $total_score,
    'overall_pct' => $overall_pct,
    'final_level' => $final_level,
]);
