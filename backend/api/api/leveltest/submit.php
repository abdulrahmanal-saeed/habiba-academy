<?php
// api/leveltest/submit.php â€” Submit final level test answers (writing + speaking)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/leveltest_bank.php';
require_once __DIR__ . '/../../lib/leveltest_db.php';
require_once __DIR__ . '/../../lib/notify.php';
require_once __DIR__ . '/../../lib/push.php';
require_once __DIR__ . '/../../config/db.php';
start_session();
lt_ensure_db_tables($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
csrf_validate();

// Must have student info loaded (set at registration or from existing student profile)
if (empty($_SESSION['lt_student_info'])) json_err('Not in test session', 401);
$info = $_SESSION['lt_student_info'];

// Validate writing
$writing1 = trim((string)($_POST['writing_task1'] ?? ''));
$writing2 = trim((string)($_POST['writing_task2'] ?? ''));
if ($writing1 === '') json_err('Writing task 1 is required');
if ($writing2 === '') json_err('Writing task 2 is required');

// Save speaking audio files
$uploadDir = __DIR__ . '/../../uploads/leveltest/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$allowedMimes = ['audio/webm','video/webm','audio/ogg','audio/wav','audio/mpeg','audio/mp4','audio/aac','application/octet-stream'];
$allowedExts  = ['webm','ogg','wav','mp3','mp4','aac','m4a'];
$maxBytes     = 20 * 1024 * 1024;

function saveSpeak(string $field, string $dir, array $mimes, array $exts, int $max): ?string {
    if (empty($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) return null;
    $f = $_FILES[$field];
    if ($f['error'] !== UPLOAD_ERR_OK) return null;
    if ($f['size'] <= 0 || $f['size'] > $max) return null;
    $mime    = (string)mime_content_type($f['tmp_name']);
    $fileExt = strtolower(pathinfo((string)($f['name'] ?? ''), PATHINFO_EXTENSION));
    // Accept if MIME matches OR file extension matches (browser MIME reporting varies)
    if (!in_array($mime, $mimes, true) && !in_array($fileExt, $exts, true)) return null;
    // Determine output extension
    if (in_array($fileExt, $exts, true)) {
        $ext = $fileExt;
    } else {
        $ext = str_contains($mime,'ogg') ? 'ogg'
             : (str_contains($mime,'wav')  ? 'wav'
             : (str_contains($mime,'aac')  ? 'aac'
             : (str_contains($mime,'mp4')  ? 'mp4'
             : (str_contains($mime,'mpeg') ? 'mp3' : 'webm'))));
    }
    $name = $field . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $dest = rtrim($dir,'/') . '/' . $name;
    if (!move_uploaded_file($f['tmp_name'], $dest)) return null;
    return 'uploads/leveltest/' . $name;
}

// Preserve writing in session before speaking validation â€” so student doesn't lose text on retry
$_SESSION['lt_writing_draft'] = ['task1' => $writing1, 'task2' => $writing2];

$sp1 = saveSpeak('speaking_1', $uploadDir, $allowedMimes, $allowedExts, $maxBytes);
$sp2 = saveSpeak('speaking_2', $uploadDir, $allowedMimes, $allowedExts, $maxBytes);
$sp3 = saveSpeak('speaking_3', $uploadDir, $allowedMimes, $allowedExts, $maxBytes);
$sp4 = saveSpeak('speaking_4', $uploadDir, $allowedMimes, $allowedExts, $maxBytes);

if (!$sp1 || !$sp2 || !$sp3 || !$sp4) {
    $missing = array_filter([
        !$sp1 ? 'Speaking 1' : null,
        !$sp2 ? 'Speaking 2' : null,
        !$sp3 ? 'Speaking 3' : null,
        !$sp4 ? 'Speaking 4' : null,
    ]);
    json_err('Missing or invalid recordings: ' . implode(', ', $missing) . '. Please re-record and try again.');
}

// Compute auto score from session â€” DB-based (variant-aware)
$listeningAnswers = (array)($_SESSION['lt_listening_answers'] ?? []);
$readingAnswers   = (array)($_SESSION['lt_reading_answers']   ?? []);
$listenQIds       = (array)($_SESSION['lt_q_ids_listening']   ?? []);
$readQIds         = (array)($_SESSION['lt_q_ids_reading']     ?? []);
$writingPromptIds = (array)($_SESSION['lt_writing_prompt_ids'] ?? []);
$speakingPromptIds = (array)($_SESSION['lt_speaking_prompt_ids'] ?? []);

$listenScore = lt_score_by_ids($pdo, $listeningAnswers, $listenQIds);
$readScore   = lt_score_by_ids($pdo, $readingAnswers,   $readQIds);
$listenMax   = max(1, count($listenQIds));
$readMax     = max(1, count($readQIds));

$levels = ['A2'=>1,'B1'=>2,'B2'=>3,'C1'=>4,'C2'=>5];
$lv = lt_level_from_score($listenScore, $listenMax);
$rv = lt_level_from_score($readScore, $readMax);
$overallLevel = ($levels[$lv] >= $levels[$rv]) ? $lv : $rv;

$speakingJson = json_encode(['speaking_1'=>$sp1,'speaking_2'=>$sp2,'speaking_3'=>$sp3,'speaking_4'=>$sp4], JSON_UNESCAPED_UNICODE);

// INSERT the attempt row now that the test is fully completed
// email/whatsapp use '' fallback because leveltest_attempts has NOT NULL constraint
$deviceId = (string)($_COOKIE['lt_device_id'] ?? '');
if ($deviceId === '') {
    $deviceId = bin2hex(random_bytes(16));
    setcookie('lt_device_id', $deviceId, [
        'expires' => time() + 60 * 60 * 24 * 365,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}
$applicantType = !empty($_SESSION['lt_existing_student_id']) ? 'existing_student' : 'new_applicant';
$deviceHash = hash('sha256', $deviceId);
$ipHash = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? ''));
$uaHash = hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? ''));

$insAttempt = $pdo->prepare("
    INSERT INTO leveltest_attempts
        (full_name, email, whatsapp, age, country, applicant_type, test_type, lead_status,
         review_status, current_step, device_id_hash, ip_hash, user_agent_hash, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, 'full', 'new', 'pending', 'submitted', ?, ?, ?, NOW())
");
$insAttempt->execute([
    $info['full_name'],
    $info['email']     ?: '',
    $info['whatsapp']  ?: '',
    $info['age']       ?: null,
    $info['country']   ?: null,
    $applicantType,
    $deviceHash,
    $ipHash,
    $uaHash,
]);
$attempt_id = (int)$pdo->lastInsertId();
$_SESSION['lt_attempt_id'] = $attempt_id;

$pdo->beginTransaction();
try {
    $upd = $pdo->prepare("
        UPDATE leveltest_attempts
        SET listening_score = ?,
            listening_level = ?,
            reading_score = ?,
            reading_level = ?,
            overall_estimated_level = ?,
            auto_score = ?
        WHERE id = ?
    ");
    $upd->execute([$listenScore, $lv, $readScore, $rv, $overallLevel, $listenScore + $readScore, $attempt_id]);

    $allQIds = array_merge(array_values($listenQIds), array_values($readQIds));
    $correctMap = [];
    if (!empty($allQIds)) {
        $ph = implode(',', array_fill(0, count($allQIds), '?'));
        $cStmt = $pdo->prepare("SELECT id, correct_opt FROM lt_questions WHERE id IN ($ph)");
        $cStmt->execute($allQIds);
        foreach ($cStmt->fetchAll() as $r) {
            $correctMap[(int)$r['id']] = strtoupper((string)$r['correct_opt']);
        }
    }

    $insA = $pdo->prepare("
        INSERT INTO leveltest_answers (attempt_id, section, q_no, answer, is_correct)
        VALUES (?, ?, ?, ?, ?)
    ");
    for ($i = 1; $i <= count($listenQIds); $i++) {
        $ans = strtoupper((string)($listeningAnswers[$i] ?? 'X'));
        $correct = $correctMap[$listenQIds[$i] ?? 0] ?? null;
        $insA->execute([$attempt_id, 'listening', $i, $ans, ($correct && $ans === $correct) ? 1 : 0]);
    }
    for ($i = 1; $i <= count($readQIds); $i++) {
        $ans = strtoupper((string)($readingAnswers[$i] ?? 'X'));
        $correct = $correctMap[$readQIds[$i] ?? 0] ?? null;
        $insA->execute([$attempt_id, 'reading', $i, $ans, ($correct && $ans === $correct) ? 1 : 0]);
    }

    $insWS = $pdo->prepare("
        INSERT INTO leveltest_writing_speaking
            (attempt_id, writing_task1_text, writing_task2_text, speaking_audio_path)
        VALUES (?, ?, ?, ?)
    ");
    $insWS->execute([$attempt_id, $writing1, $writing2, $speakingJson]);

    lt_save_attempt_snapshot($pdo, $attempt_id, 'listening', $listenQIds);
    lt_save_attempt_snapshot($pdo, $attempt_id, 'reading', $readQIds);
    lt_save_prompt_snapshot($pdo, $attempt_id, 'writing', $writingPromptIds);
    lt_save_prompt_snapshot($pdo, $attempt_id, 'speaking', $speakingPromptIds);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Failed to save test results. Please try again.');
}

$_SESSION['lt_new_student_name'] = $info['full_name'];
$_SESSION['lt_new_student_wa'] = $info['whatsapp'] ?: '';

// Notify teacher â€” email
notify_teacher('ðŸŽ“ Ø§Ø®ØªØ¨Ø§Ø± Ù…Ø³ØªÙˆÙ‰ Ù…ÙƒØªÙ…Ù„ â€” ' . $info['full_name'], [
    ['icon' => 'ðŸ‘¤', 'label' => 'Ø§Ù„Ø·Ø§Ù„Ø¨ Â· Student',             'value' => $info['full_name']],
    ['icon' => 'ðŸ“Š', 'label' => 'Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„ØªÙ‚Ø¯ÙŠØ±ÙŠ Â· Est. Level', 'value' => $overallLevel],
    ['icon' => 'ðŸŽ§', 'label' => 'Ø§Ù„Ø§Ø³ØªÙ…Ø§Ø¹ Â· Listening',         'value' => $listenScore . '/' . $listenMax],
    ['icon' => 'ðŸ“–', 'label' => 'Ø§Ù„Ù‚Ø±Ø§Ø¡Ø© Â· Reading',            'value' => $readScore . '/' . $readMax],
    ['icon' => 'ðŸ“§', 'label' => 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Â· Email',               'value' => $info['email']],
    ['icon' => 'ðŸ“±', 'label' => 'ÙˆØ§ØªØ³Ø§Ø¨ Â· WhatsApp',            'value' => $info['whatsapp']],
]);
// Push â€” with WhatsApp deep link to reach the new student
$waNum = preg_replace('/\D+/', '', (string)($info['whatsapp'] ?? ''));
push_notify_teacher(
    $pdo,
    'ðŸŽ“ New level test â€” ' . $info['full_name'],
    'Est. level: ' . $overallLevel . ' Â· Listening: ' . $listenScore . '/30 Â· Reading: ' . $readScore . '/' . $readMax,
    '/teacher/level-test-results.php',
    $waNum
);

// Student confirmation email
if (!empty($info['email'])) {
    $studentName = $info['full_name'];
    $confirmSubject = '=?UTF-8?B?' . base64_encode('Ø´ÙƒØ±Ù‹Ø§ Ø¹Ù„Ù‰ Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø± â€” Habiba Nabil') . '?=';
    $confirmBody = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 24px;text-align:center">
    <div style="font-size:2rem;margin-bottom:8px">ðŸŽ“</div>
    <h1 style="color:#fff;margin:0;font-size:1.4rem;font-weight:700">Ø´ÙƒØ±Ù‹Ø§ Ø¹Ù„Ù‰ Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø±</h1>
    <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:.95rem">Thank you for completing the level test</p>
  </div>
  <div style="padding:28px 24px">
    <p style="font-size:1.05rem;color:#1f2937;margin:0 0 16px">Ù…Ø±Ø­Ø¨Ø§Ù‹ <strong>' . htmlspecialchars($studentName, ENT_QUOTES, 'UTF-8') . '</strong>ØŒ</p>
    <p style="color:#4b5563;line-height:1.7;margin:0 0 16px">Ù„Ù‚Ø¯ Ø£ÙƒÙ…Ù„ØªÙŽ Ø§Ø®ØªØ¨Ø§Ø± ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø¨Ù†Ø¬Ø§Ø­. Ø³ÙŠØªÙ… Ù…Ø±Ø§Ø¬Ø¹Ø© Ù†ØªÙŠØ¬ØªÙƒ Ù…Ù† Ù‚ÙØ¨Ù„ Ø§Ù„Ù…Ø¹Ù„Ù…Ø© <strong>Ø­Ø¨ÙŠØ¨Ø© Ù†Ø¨ÙŠÙ„</strong> ÙˆØ¥Ø±Ø³Ø§Ù„Ù‡Ø§ Ø¥Ù„ÙŠÙƒ Ø®Ù„Ø§Ù„ <strong>48 Ø³Ø§Ø¹Ø©</strong> Ø¹Ø¨Ø± Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø£Ùˆ Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨.</p>
    <p style="color:#6b7280;font-size:.9rem;line-height:1.6;margin:0 0 24px">You have successfully completed the English level placement test. Your results will be reviewed by teacher <strong>Habiba Nabil</strong> and sent to you within <strong>48 hours</strong> via email or WhatsApp.</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;text-align:center;border:1px solid #e5e7eb">
      <div style="font-size:.85rem;color:#9ca3af;margin-bottom:4px">Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„ØªÙ‚Ø¯ÙŠØ±ÙŠ Â· Estimated Level</div>
      <div style="font-size:1.8rem;font-weight:900;color:#7c3aed">' . $overallLevel . '</div>
    </div>
  </div>
  <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:.8rem;color:#9ca3af">mshabibanabil.com Â· Ù‡Ø°Ø§ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ù…ÙØ±Ø³ÙŽÙ„ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹</p>
  </div>
</div>
</body></html>';
    $confirmHeaders  = "MIME-Version: 1.0\r\n";
    $confirmHeaders .= "Content-Type: text/html; charset=UTF-8\r\n";
    $confirmHeaders .= "From: =?UTF-8?B?" . base64_encode('Ø­Ø¨ÙŠØ¨Ø© Ù†Ø¨ÙŠÙ„') . "?= <info@mshabibanabil.com>\r\n";
    @mail($info['email'], $confirmSubject, $confirmBody, $confirmHeaders);
}

// Clear session test data (keep lt_attempt_id for the thank-you page)
unset(
    $_SESSION['lt_student_info'],
    $_SESSION['lt_listening_answers'],
    $_SESSION['lt_reading_answers'],
    $_SESSION['lt_writing_level'],
    $_SESSION['lt_step'],
    $_SESSION['lt_writing_draft'],
    $_SESSION['lt_q_ids_listening'],
    $_SESSION['lt_q_ids_reading'],
    $_SESSION['lt_writing_prompt_ids'],
    $_SESSION['lt_speaking_prompt_ids']
);

json_ok(['message' => 'Submitted successfully', 'level_estimate' => $overallLevel]);
