<?php
// api/teacher/create-scenario.php — Create a new scenario with keywords
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/notify.php';
require_once __DIR__ . '/../../lib/lib/push.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();
ensure_publish_schedule_support($pdo);

$student_id    = (int)($_POST['student_id']    ?? 0);
$title         = trim((string)($_POST['title']         ?? ''));
$sc_date       = trim((string)($_POST['sc_date']       ?? ''));
$publish_time  = trim((string)($_POST['publish_time']  ?? ''));
$status        = trim((string)($_POST['status']        ?? 'draft'));
$situation     = trim((string)($_POST['situation']     ?? ''));
$prompt        = trim((string)($_POST['prompt']        ?? ''));
$time_limit    = (int)($_POST['time_limit']    ?? 120);
$keywords_raw  = trim((string)($_POST['keywords']      ?? ''));
$model_answer  = trim((string)($_POST['model_answer']  ?? ''));

if ($student_id <= 0) json_err('Invalid student ID');
if ($title === '')    json_err('Title is required');
if ($sc_date === '')  json_err('Date is required');

$validStatus = ['draft', 'published', 'closed'];
if (!in_array($status, $validStatus, true)) $status = 'draft';
$publish_at = normalize_publish_at($sc_date, $publish_time);
if ($status === 'published' && !$publish_at) json_err('Invalid publish date/time');

$check = $pdo->prepare("SELECT id FROM students WHERE id = ?");
$check->execute([$student_id]);
if (!$check->fetch()) json_err('Student not found', 404);

$keywords = array_values(array_filter(array_map('trim', explode(',', $keywords_raw))));

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare("
        INSERT INTO scenarios (student_id, title, sc_date, publish_at, status, situation, prompt, time_limit_seconds, model_answer, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $student_id, $title, $sc_date, $publish_at, $status,
        $situation ?: null, $prompt ?: null, $time_limit, $model_answer ?: null,
    ]);
    $scenario_id = (int)$pdo->lastInsertId();

    if ($keywords) {
        $ins = $pdo->prepare("INSERT INTO scenario_keywords (scenario_id, keyword) VALUES (?, ?)");
        foreach ($keywords as $kw) {
            if ($kw !== '') $ins->execute([$scenario_id, $kw]);
        }
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Failed to save scenario: ' . $e->getMessage());
}

if ($status === 'published' && $publish_at && strtotime((string)$publish_at) <= time()) {
    try {
        notify_student_publication($pdo, $student_id, [
            'kind'          => 'Scenario',
            'title'         => $title,
            'headline'      => 'New scenario published',
            'body'          => 'Your scenario "' . $title . '" is now available.',
            'action_label'  => 'Open Scenario',
            'action_url'    => '/student/scenario.php?scenario_id=' . $scenario_id,
            'delivery_type' => 'scenario',
            'delivery_id'   => $scenario_id,
        ]);
    } catch (Throwable) {}
    try {
        $student   = push_student_row($pdo, $student_id);
        $waMessage = whatsapp_scenario_message($student, $title);
        push_notify_teacher(
            $pdo,
            'Send scenario on WhatsApp',
            'Scenario "' . $title . '" is ready. Open WhatsApp or copy the message.',
            '/teacher/scenarios.php',
            (string)($student['whatsapp'] ?? ''),
            $waMessage
        );
    } catch (Throwable) {}
}

json_ok([
    'scenario_id'      => $scenario_id,
    'title'            => $title,
    'publish_at'       => $publish_at,
    'effective_status' => effective_publish_status($status, $publish_at, $sc_date),
]);
