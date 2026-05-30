<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/book-sales.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);

$studentId = (int)$_SESSION['student_id'];

book_sales_ensure_schema($pdo);

$book = book_sales_book($pdo);
if (!$book) json_err('Book not found', 404);

$bookId    = (int)$book['id'];
$settings  = book_sales_launch_settings($pdo, $bookId);

if (!book_sales_student_can_view_product($settings)) json_err('Book not available', 403);

$package  = book_sales_package($pdo, $bookId);
$access   = book_sales_access($pdo, $studentId, $bookId);
$request  = book_sales_latest_request($pdo, $studentId, $bookId);
$hasAccess = book_sales_has_active_access($pdo, $studentId, $bookId);

book_sales_track($pdo, $studentId, 'book_product_page_viewed');

json_ok([
    'book' => [
        'id'      => $bookId,
        'titleEn' => (string)$book['title_en'],
        'titleAr' => (string)$book['title_ar'],
        'slug'    => (string)$book['slug'],
        'level'   => (string)$book['level'],
        'price'   => (float)$book['price'],
    ],
    'package' => $package ? [
        'id'                         => (int)$package['id'],
        'titleAr'                    => (string)$package['title_ar'],
        'titleEn'                    => (string)$package['title_en'],
        'descriptionAr'              => (string)$package['description_ar'],
        'descriptionEn'              => (string)$package['description_en'],
        'price'                      => (float)$package['price'],
        'originalPrice'              => (float)$package['original_price'],
        'currency'                   => (string)$package['currency'],
        'includesTeacherFeedback'    => (bool)$package['includes_teacher_feedback'],
        'includesExtraReviewSession' => (bool)$package['includes_extra_review_session'],
    ] : null,
    'hasAccess'    => $hasAccess,
    'accessStatus' => $access ? (string)$access['access_status'] : 'none',
    'requestStatus'=> $request ? (string)$request['status'] : null,
    'canCheckout'  => book_sales_student_can_checkout($settings) && !$hasAccess,
    'canPreview'   => book_sales_student_can_preview($settings),
]);
