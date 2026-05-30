<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/book-sales.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);
csrf_validate();

$studentId = (int)$_SESSION['student_id'];
$body = (array)(json_decode((string)file_get_contents('php://input'), true) ?: $_POST);

$packageId       = (int)($body['package_id'] ?? 0);
$paymentMethod   = trim(h((string)($body['payment_method']   ?? 'bank_transfer')));
$paymentRef      = trim(h((string)($body['payment_reference'] ?? '')));
$studentNotes    = trim(h((string)($body['student_notes']    ?? '')));

if ($packageId <= 0) json_err('package_id is required', 422);

book_sales_ensure_schema($pdo);
$book = book_sales_book($pdo);
if (!$book) json_err('Book not found', 404);

$bookId   = (int)$book['id'];
$settings = book_sales_launch_settings($pdo, $bookId);

if (!book_sales_student_can_checkout($settings)) json_err('Checkout is not available', 403);

if (book_sales_has_active_access($pdo, $studentId, $bookId)) {
    json_err('You already have access to this book', 409);
}

try {
    $requestId = book_sales_create_activation_request($pdo, $studentId, $bookId, $packageId, [
        'payment_method'    => $paymentMethod,
        'payment_reference' => $paymentRef,
        'payment_proof_path'=> '',
        'student_notes'     => $studentNotes,
    ]);
} catch (RuntimeException $e) {
    json_err($e->getMessage(), 400);
}

json_ok(['requestId' => $requestId]);
