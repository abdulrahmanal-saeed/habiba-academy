<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/testimonials.php';
require_teacher();

$pdo = get_pdo();
ensure_testimonial_tables($pdo);
ensure_platform_testimonial_table($pdo);

/* ─── GET ──────────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $student = fetch_teacher_testimonials($pdo);
    $platform = fetch_teacher_platform_testimonials($pdo);
    $public   = fetch_teacher_public_testimonials($pdo);
    json_ok(['student' => $student, 'platform' => $platform, 'public' => $public]);
}

/* ─── POST ─────────────────────────────────────────────────────────────── */
csrf_validate();
$action = trim($_POST['action'] ?? '');
$id     = (int)($_POST['id'] ?? 0);
$source = trim($_POST['source'] ?? 'student');

if ($id < 1) json_err('Invalid id', 422);

if ($action === 'approve') {
    if ($source === 'platform') {
        $pdo->prepare("
            UPDATE platform_testimonials
            SET review_status='approved', is_published=1, approved_at=NOW(), show_on_homepage=1
            WHERE id=?
        ")->execute([$id]);
    } elseif ($source === 'public') {
        $pdo->prepare("UPDATE public_testimonials SET is_approved=1 WHERE id=?")->execute([$id]);
    } else {
        $pdo->prepare("
            UPDATE student_testimonials
            SET review_status='approved', is_published=1
            WHERE id=?
        ")->execute([$id]);
    }
    clear_testimonials_cache();
    json_ok(['message' => 'Approved']);
}

if ($action === 'reject') {
    if ($source === 'platform') {
        $pdo->prepare("
            UPDATE platform_testimonials
            SET review_status='rejected', is_published=0, rejected_at=NOW()
            WHERE id=?
        ")->execute([$id]);
    } elseif ($source === 'public') {
        $pdo->prepare("UPDATE public_testimonials SET is_approved=0 WHERE id=?")->execute([$id]);
    } else {
        $pdo->prepare("
            UPDATE student_testimonials
            SET review_status='rejected', is_published=0
            WHERE id=?
        ")->execute([$id]);
    }
    clear_testimonials_cache();
    json_ok(['message' => 'Rejected']);
}

json_err('Unknown action', 400);
