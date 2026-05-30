<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/book-sales.php';
require_teacher();

$pdo      = get_pdo();
$teacherId = (int)($_SESSION['teacher_id'] ?? 0);
book_sales_ensure_schema($pdo);

/* ─── GET ──────────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sub = trim($_GET['sub'] ?? '');

    /* activation requests sub-page */
    if ($sub === 'requests') {
        $status = trim($_GET['status'] ?? '');
        $where  = '';
        $params = [];
        if ($status !== '' && in_array($status, ['pending','approved','rejected','needs_more_info'], true)) {
            $where  = 'WHERE r.status = ?';
            $params = [$status];
        }
        $stmt = $pdo->prepare("
            SELECT r.*, s.full_name, s.login_code, b.title_en AS book_title, p.title_en AS package_title
            FROM book_activation_requests r
            JOIN students s ON s.id = r.student_id
            JOIN books b ON b.id = r.book_id
            JOIN book_packages p ON p.id = r.package_id
            $where
            ORDER BY r.created_at DESC
            LIMIT 300
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        foreach ($rows as &$r) { $r['price'] = (float)$r['price']; }
        unset($r);
        json_ok(['requests' => $rows]);
    }

    /* main launch data */
    $book = book_sales_book($pdo);
    if (!$book) json_err('Book not found', 404);
    $bookId = (int)$book['id'];

    $settings = book_sales_launch_settings($pdo, $bookId);
    [$statusEn, $statusAr, $statusBadge] = book_sales_launch_status_label((string)$settings['student_visibility_status']);

    $activeAccess    = (int)$pdo->query("SELECT COUNT(*) FROM student_book_access WHERE book_id={$bookId} AND access_status='active'")->fetchColumn();
    $pendingRequests = (int)$pdo->query("SELECT COUNT(*) FROM book_activation_requests WHERE book_id={$bookId} AND status='pending'")->fetchColumn();
    $package         = book_sales_package($pdo, $bookId);

    $countByType = static function (string $type) use ($pdo, $bookId): int {
        $st = $pdo->prepare("SELECT COUNT(*) FROM book_units WHERE book_id=? AND unit_type=? AND status='published'");
        $st->execute([$bookId, $type]);
        return (int)$st->fetchColumn();
    };
    $unitExists = static function (string $slug) use ($pdo, $bookId): bool {
        $st = $pdo->prepare("SELECT COUNT(*) FROM book_units WHERE book_id=? AND slug=? AND status='published'");
        $st->execute([$bookId, $slug]);
        return (int)$st->fetchColumn() > 0;
    };

    $readiness = [
        ['label' => 'Front cover added',                                            'done' => $unitExists('cover')],
        ['label' => 'Intro pages added (min 5)',                                    'done' => $countByType('intro_page') >= 5],
        ['label' => 'Lessons 1-12 added',                                           'done' => $countByType('lesson') >= 12],
        ['label' => 'Review 1 added',                                               'done' => $unitExists('review-1-lessons-1-to-4')],
        ['label' => 'Review 2 added',                                               'done' => $unitExists('review-2-lessons-5-to-8')],
        ['label' => 'Final Review added',                                           'done' => $countByType('final_review') >= 1],
        ['label' => 'Ending pages added',                                           'done' => $countByType('ending_page') >= 2 && $countByType('back_cover') >= 1],
        ['label' => 'Book product/sales page completed',                            'done' => true],
        ['label' => 'Price set to AED 80',                                          'done' => $package && (int)$package['price'] === 80],
        ['label' => 'Package includes teacher feedback + extra review session',      'done' => $package && (int)$package['includes_teacher_feedback'] === 1 && (int)$package['includes_extra_review_session'] === 1],
        ['label' => 'Teacher/admin preview tested',                                 'done' => false],
        ['label' => 'Student preview tested',                                       'done' => false],
        ['label' => 'Access control tested',                                        'done' => false],
        ['label' => 'Activation request flow tested',                               'done' => false],
        ['label' => 'Notifications tested',                                         'done' => false],
        ['label' => 'Audio placeholders checked',                                   'done' => false],
        ['label' => 'Teacher feedback flow tested',                                 'done' => false],
    ];

    $auditStmt = $pdo->prepare("
        SELECT id, old_status, new_status, change_note, created_at
        FROM book_launch_audit_log
        WHERE book_id=?
        ORDER BY created_at DESC, id DESC
        LIMIT 12
    ");
    $auditStmt->execute([$bookId]);
    $auditLog = $auditStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    foreach ($settings as $k => $v) {
        if ($k !== 'student_visibility_status') {
            $settings[$k] = (bool)(int)$v;
        }
    }

    json_ok([
        'book'             => ['id' => $bookId, 'title_en' => (string)$book['title_en'], 'title_ar' => (string)($book['title_ar'] ?? '')],
        'settings'         => $settings,
        'status_label'     => ['en' => $statusEn, 'ar' => $statusAr, 'badge' => $statusBadge],
        'active_access'    => $activeAccess,
        'pending_requests' => $pendingRequests,
        'readiness'        => $readiness,
        'audit_log'        => $auditLog,
    ]);
}

/* ─── POST ─────────────────────────────────────────────────────────────── */
csrf_validate();
$action  = trim($_POST['action'] ?? '');
$book    = book_sales_book($pdo);
if (!$book) json_err('Book not found', 404);
$bookId  = (int)$book['id'];
$current = book_sales_launch_settings($pdo, $bookId);

/* request actions */
if ($action === 'approve_request') {
    $reqId = (int)($_POST['request_id'] ?? 0);
    $note  = trim($_POST['admin_note'] ?? '');
    if ($reqId < 1) json_err('Invalid request id', 422);
    try {
        book_sales_approve_request($pdo, $reqId, $teacherId, $note);
        json_ok(['message' => 'Request approved and access activated']);
    } catch (Throwable $e) {
        json_err($e->getMessage(), 422);
    }
}

if ($action === 'reject_request' || $action === 'needs_more_info') {
    $reqId  = (int)($_POST['request_id'] ?? 0);
    $note   = trim($_POST['admin_note'] ?? '');
    $status = $action === 'reject_request' ? 'rejected' : 'needs_more_info';
    if ($reqId < 1) json_err('Invalid request id', 422);
    try {
        book_sales_update_request_status($pdo, $reqId, $status, $note, $teacherId);
        json_ok(['message' => 'Request updated']);
    } catch (Throwable $e) {
        json_err($e->getMessage(), 422);
    }
}

/* launch control presets */
if ($action === 'launch') {
    book_sales_save_launch_settings($pdo, $bookId, [
        'student_visibility_status' => 'launched',
        'dashboard_card_enabled' => 1, 'fixed_icon_enabled' => 1, 'login_banner_enabled' => 1,
        'homework_popup_enabled' => 1, 'feedback_popup_enabled' => 1, 'product_page_enabled' => 1,
        'preview_enabled' => 1, 'checkout_enabled' => 1, 'locked_cta_enabled' => 1,
        'coming_soon_card_enabled' => 0, 'marketing_notifications_enabled' => 1,
        'activation_notifications_enabled' => 1, 'submission_feedback_notifications_enabled' => 1,
        'allow_existing_access_when_paused' => 1,
    ], $teacherId, 'Launch book to students');
    json_ok(['message' => 'Book launched']);
}

if ($action === 'hide') {
    book_sales_save_launch_settings($pdo, $bookId, [
        'student_visibility_status' => 'teacher_preview_only',
        'dashboard_card_enabled' => 0, 'fixed_icon_enabled' => 0, 'login_banner_enabled' => 0,
        'homework_popup_enabled' => 0, 'feedback_popup_enabled' => 0, 'product_page_enabled' => 0,
        'preview_enabled' => 0, 'checkout_enabled' => 0, 'locked_cta_enabled' => 0,
        'coming_soon_card_enabled' => 0, 'marketing_notifications_enabled' => 0,
        'activation_notifications_enabled' => (int)($current['activation_notifications_enabled'] ?? 1),
        'submission_feedback_notifications_enabled' => (int)($current['submission_feedback_notifications_enabled'] ?? 1),
        'allow_existing_access_when_paused' => 1,
    ], $teacherId, 'Hide book from students');
    json_ok(['message' => 'Book hidden']);
}

if ($action === 'pause') {
    book_sales_save_launch_settings($pdo, $bookId, [
        'student_visibility_status' => 'paused',
        'dashboard_card_enabled' => 0, 'fixed_icon_enabled' => 0, 'login_banner_enabled' => 0,
        'homework_popup_enabled' => 0, 'feedback_popup_enabled' => 0, 'product_page_enabled' => 0,
        'preview_enabled' => 0, 'checkout_enabled' => 0, 'locked_cta_enabled' => 0,
        'coming_soon_card_enabled' => 0, 'marketing_notifications_enabled' => 0,
        'activation_notifications_enabled' => (int)($current['activation_notifications_enabled'] ?? 1),
        'submission_feedback_notifications_enabled' => (int)($current['submission_feedback_notifications_enabled'] ?? 1),
        'allow_existing_access_when_paused' => 1,
    ], $teacherId, 'Pause new sales');
    json_ok(['message' => 'New sales paused']);
}

if ($action === 'save') {
    $checkboxes = [
        'dashboard_card_enabled','fixed_icon_enabled','login_banner_enabled','homework_popup_enabled',
        'feedback_popup_enabled','product_page_enabled','preview_enabled','checkout_enabled',
        'locked_cta_enabled','coming_soon_card_enabled','marketing_notifications_enabled',
        'activation_notifications_enabled','submission_feedback_notifications_enabled','allow_existing_access_when_paused',
    ];
    $newSettings = ['student_visibility_status' => trim($_POST['student_visibility_status'] ?? 'teacher_preview_only')];
    foreach ($checkboxes as $field) {
        $newSettings[$field] = isset($_POST[$field]) ? 1 : 0;
    }
    $note = trim($_POST['change_note'] ?? 'Manual launch settings update');
    book_sales_save_launch_settings($pdo, $bookId, $newSettings, $teacherId, $note);
    json_ok(['message' => 'Launch settings saved']);
}

json_err('Unknown action', 400);
