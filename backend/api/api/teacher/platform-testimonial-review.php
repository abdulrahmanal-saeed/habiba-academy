<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/testimonials.php';
require_once __DIR__ . '/../../lib/learning-audit.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

ensure_platform_testimonial_table($pdo);

$id = (int)($_POST['id'] ?? 0);
$action = trim((string)($_POST['action'] ?? ''));
if ($id <= 0) json_err('Invalid testimonial ID');

$stmt = $pdo->prepare("SELECT * FROM platform_testimonials WHERE id = ? LIMIT 1");
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) json_err('Testimonial not found', 404);

$allowed = ['approve', 'reject', 'archive', 'feature', 'unfeature', 'homepage_on', 'homepage_off', 'page_on', 'page_off'];
if (!in_array($action, $allowed, true)) json_err('Invalid action');

$updates = [];
$params = [];
if ($action === 'approve') {
    $updates[] = "review_status = 'approved'";
    $updates[] = "is_published = CASE WHEN permission_to_publish = 1 THEN 1 ELSE 0 END";
    $updates[] = "approved_at = NOW()";
    $updates[] = "rejected_at = NULL";
    $updates[] = "archived_at = NULL";
} elseif ($action === 'reject') {
    $updates[] = "review_status = 'rejected'";
    $updates[] = "is_published = 0";
    $updates[] = "rejected_at = NOW()";
} elseif ($action === 'archive') {
    $updates[] = "review_status = 'archived'";
    $updates[] = "is_published = 0";
    $updates[] = "archived_at = NOW()";
} elseif ($action === 'feature') {
    $updates[] = "featured = 1";
} elseif ($action === 'unfeature') {
    $updates[] = "featured = 0";
} elseif ($action === 'homepage_on') {
    $updates[] = "show_on_homepage = 1";
} elseif ($action === 'homepage_off') {
    $updates[] = "show_on_homepage = 0";
} elseif ($action === 'page_on') {
    $updates[] = "show_on_testimonials_page = 1";
} elseif ($action === 'page_off') {
    $updates[] = "show_on_testimonials_page = 0";
}

$params[] = $id;
$pdo->prepare("UPDATE platform_testimonials SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
clear_testimonials_cache();
learning_audit($pdo, 'testimonial_' . $action, 'testimonial', $id, ['action' => $action], $row, 'teacher', null);
json_ok(['status' => $action]);
