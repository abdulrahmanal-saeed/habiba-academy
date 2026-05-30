<?php
// api/review/create.php — Teacher creates a student review
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/review/helpers.php';
require_once __DIR__ . '/../../lib/lib/notify.php';
require_once __DIR__ . '/../../lib/lib/push.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

ensure_review_tables($pdo);
ensure_publish_schedule_support($pdo);
// Ensure publish_at column exists (missing from ensure_review_tables)
try { $pdo->exec("ALTER TABLE student_reviews ADD COLUMN publish_at DATETIME NULL DEFAULT NULL AFTER review_date"); } catch (Throwable $e) {}

$studentId   = (int)($_POST['student_id']   ?? 0);
$reviewType  = trim((string)($_POST['review_type']  ?? 'weekly_review'));
$title       = trim((string)($_POST['title']        ?? ''));
$reviewDate  = trim((string)($_POST['review_date']  ?? date('Y-m-d')));
$publishTime = trim((string)($_POST['publish_time'] ?? ''));
$status      = trim((string)($_POST['status']       ?? 'draft'));
$schemaJson  = trim((string)($_POST['schema_json']  ?? ''));

if ($studentId <= 0) json_err('Invalid student ID');
if (!in_array($reviewType, ['weekly_review', 'monthly_review'], true)) $reviewType = 'weekly_review';
if (!in_array($status, ['draft', 'published', 'closed'], true))        $status     = 'draft';
if ($schemaJson === '') json_err('Review JSON is required');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $reviewDate)) json_err('Invalid review date');
$publishAt = normalize_publish_at($reviewDate, $publishTime);
if ($status === 'published' && !$publishAt) json_err('Invalid publish date/time');

$studentStmt = $pdo->prepare("SELECT id FROM students WHERE id = ? LIMIT 1");
$studentStmt->execute([$studentId]);
if (!$studentStmt->fetch()) json_err('Student not found', 404);

try {
    $schema     = review_decode_schema($schemaJson);
    $points     = review_points_summary($schema);
    if ($title === '') $title = review_title_from_schema($schema);
} catch (RuntimeException $e) {
    json_err($e->getMessage());
}

$metaJson   = json_encode(review_meta($schema), JSON_UNESCAPED_UNICODE);
$schemaJson = json_encode($schema,              JSON_UNESCAPED_UNICODE);

$stmt = $pdo->prepare("
    INSERT INTO student_reviews
        (student_id, review_type, title, review_date, publish_at, status, schema_json, meta_json,
         auto_points_total, manual_points_total, total_points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([
    $studentId, $reviewType, $title, $reviewDate, $publishAt, $status,
    $schemaJson, $metaJson ?: null,
    $points['auto'], $points['manual'], $points['total'],
]);
$reviewId = (int)$pdo->lastInsertId();

if ($status === 'published' && $publishAt && strtotime((string)$publishAt) <= time()) {
    try {
        notify_student_publication($pdo, $studentId, [
            'kind'          => review_type_label($reviewType),
            'title'         => $title,
            'headline'      => review_type_label($reviewType) . ' published',
            'body'          => 'Your review "' . $title . '" is now available.',
            'action_label'  => 'Open Review',
            'action_url'    => '/student/review/take.php?review_id=' . $reviewId,
            'delivery_type' => 'review',
            'delivery_id'   => $reviewId,
        ]);
    } catch (Throwable) {}
    try {
        $student    = push_student_row($pdo, $studentId);
        $waMessage  = whatsapp_review_message($student, $reviewType);
        push_notify_teacher(
            $pdo,
            'Send review on WhatsApp',
            review_type_label($reviewType) . ' is ready. Open WhatsApp or copy the message.',
            '/teacher/reviews.php',
            (string)($student['whatsapp'] ?? ''),
            $waMessage
        );
    } catch (Throwable) {}
}

json_ok([
    'review_id'        => $reviewId,
    'title'            => $title,
    'publish_at'       => $publishAt,
    'effective_status' => effective_publish_status($status, $publishAt, $reviewDate),
]);
