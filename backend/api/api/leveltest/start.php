<?php
// api/leveltest/start.php — Store student info in session (DB insert deferred until completion)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
csrf_validate();

$full_name = trim((string)($_POST['full_name'] ?? ''));
$email     = trim((string)($_POST['email']     ?? ''));
$whatsapp  = preg_replace('/\D/', '', trim((string)($_POST['whatsapp'] ?? '')));
$age       = (int)($_POST['age']      ?? 0);
$country   = trim((string)($_POST['country']   ?? ''));

if ($full_name === '') json_err('Full name is required');
if ($whatsapp === '' && $email === '') json_err('WhatsApp number is required');
if ($whatsapp !== '' && str_starts_with($whatsapp, '0')) json_err('WhatsApp number must not start with 0');
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Valid email address required');

// Store student info in session — no DB insert until the test is fully completed
session_regenerate_id(true);
$_SESSION['lt_student_info'] = [
    'full_name' => $full_name,
    'email'     => $email ?: null,
    'whatsapp'  => $whatsapp ?: null,
    'age'       => $age ?: null,
    'country'   => $country ?: null,
];
$_SESSION['lt_full_name'] = $full_name;
$_SESSION['lt_step']      = 'listening';
unset($_SESSION['lt_attempt_id'], $_SESSION['lt_step_attempt'], $_SESSION['lt_listening_answers'], $_SESSION['lt_reading_answers'], $_SESSION['lt_writing_level']);

json_ok(['ok' => true]);
