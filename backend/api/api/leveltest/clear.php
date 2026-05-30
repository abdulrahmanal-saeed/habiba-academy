<?php
// api/leveltest/clear.php — Clear in-progress level test session and restart
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
start_session();

unset(
    $_SESSION['lt_student_info'],
    $_SESSION['lt_attempt_id'],
    $_SESSION['lt_step'],
    $_SESSION['lt_step_attempt'],
    $_SESSION['lt_listening_answers'],
    $_SESSION['lt_reading_answers'],
    $_SESSION['lt_writing_level'],
    $_SESSION['lt_full_name']
);

header('Location: /leveltest/entry.php');
exit;
