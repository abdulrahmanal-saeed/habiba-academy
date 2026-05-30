<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/testimonials.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

ensure_testimonial_tables($pdo);

$id = (int)($_POST['id'] ?? 0);
$action = trim((string)($_POST['action'] ?? ''));
if ($id <= 0) json_err('Invalid testimonial ID');
if (!in_array($action, ['approve', 'reject'], true)) json_err('Invalid action');

$stmt = $pdo->prepare("SELECT id FROM student_testimonials WHERE id = ? LIMIT 1");
$stmt->execute([$id]);
if (!$stmt->fetch()) json_err('Testimonial not found', 404);

if ($action === 'approve') {
    $pdo->prepare("
        UPDATE student_testimonials
        SET review_status = 'approved', is_published = 1
        WHERE id = ?
    ")->execute([$id]);
    clear_testimonials_cache();
    json_ok(['status' => 'approved']);
}

$pdo->prepare("
    UPDATE student_testimonials
    SET review_status = 'rejected', is_published = 0
    WHERE id = ?
")->execute([$id]);
clear_testimonials_cache();
json_ok(['status' => 'rejected']);
