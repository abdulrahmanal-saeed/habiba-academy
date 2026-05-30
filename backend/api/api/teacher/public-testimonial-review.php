<?php
// api/teacher/public-testimonial-review.php — Approve or reject a public testimonial
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))      json_err('Not authenticated', 401);
csrf_validate();

$id     = (int)($_POST['id']     ?? 0);
$action = trim((string)($_POST['action'] ?? ''));

if ($id <= 0)                                       json_err('Invalid ID');
if (!in_array($action, ['approve','reject'], true)) json_err('Invalid action');

require_once __DIR__ . '/../../lib/testimonials.php';
ensure_public_testimonial_table($pdo);

$approved = $action === 'approve' ? 1 : 0;
$pdo->prepare("UPDATE public_testimonials SET is_approved = ? WHERE id = ?")->execute([$approved, $id]);
clear_testimonials_cache();

json_ok(['approved' => $approved]);
