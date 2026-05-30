<?php
declare(strict_types=1);
require_once __DIR__ . '/../lib/helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../lib/book-sales.php';

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_err('Method not allowed', 405);
}
if (empty($_SESSION['student_id'])) {
    json_err('Not authenticated', 401);
}
csrf_validate();
$eventKey = trim((string)($_POST['event_key'] ?? ''));
$eventValue = trim((string)($_POST['event_value'] ?? ''));
$allowed = [
    'book_banner_dismissed',
    'book_login_banner_last_shown',
    'book_popup_homework_last_shown',
    'book_popup_feedback_last_shown',
    'book_product_clicked',
    'book_preview_clicked',
    'book_unlock_clicked',
    'book_purchase_cta_clicked',
    'book_fixed_icon_dismissed',
];
if (!in_array($eventKey, $allowed, true)) {
    json_err('Invalid event.', 422);
}
book_sales_track($pdo, (int)$_SESSION['student_id'], $eventKey, $eventValue);
json_ok();
