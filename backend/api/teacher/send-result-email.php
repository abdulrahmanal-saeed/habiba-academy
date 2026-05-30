<?php
// api/teacher/send-result-email.php — Send level test result to student by email
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/leveltest_bank.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$attempt_id = (int)($_POST['attempt_id'] ?? 0);
if ($attempt_id <= 0) json_err('Invalid attempt ID');

$stmt = $pdo->prepare("SELECT * FROM leveltest_attempts WHERE id = ?");
$stmt->execute([$attempt_id]);
$attempt = $stmt->fetch();
if (!$attempt)                                json_err('Attempt not found', 404);
if ($attempt['review_status'] !== 'reviewed') json_err('Attempt not yet reviewed');
if (empty($attempt['email']))                 json_err('No email address for this student');

$listening_score = (int)$attempt['listening_score'];
$reading_score   = (int)$attempt['reading_score'];
$writing_score   = (int)($attempt['writing_score']  ?? 0);
$speaking_score  = (int)($attempt['speaking_score'] ?? 0);

$l_pct = (int)round($listening_score / 30  * 100);
$r_pct = (int)round($reading_score   / 25  * 100);
$w_pct = (int)round($writing_score   / 40  * 100);
$s_pct = (int)round($speaking_score  / 80  * 100);
$total = $listening_score + $reading_score + $writing_score + $speaking_score;
$overall_pct = (int)round($total / 175 * 100);

$final_level = $attempt['final_level'];

function pct_to_lvl(int $pct): string {
    if ($pct < 40) return 'A2';
    if ($pct < 55) return 'B1';
    if ($pct < 70) return 'B2';
    if ($pct < 85) return 'C1';
    return 'C2';
}
function bilingual_level(string $l): string {
    return match($l) {
        'A2' => 'A2 — Elementary · أساسي',
        'B1' => 'B1 — Intermediate · متوسط',
        'B2' => 'B2 — Upper Intermediate · فوق المتوسط',
        'C1' => 'C1 — Advanced · متقدم',
        'C2' => 'C2 — Proficient · احترافي',
        default => $l
    };
}

$l_lvl = pct_to_lvl($l_pct);
$r_lvl = pct_to_lvl($r_pct);
$w_lvl = pct_to_lvl($w_pct);
$s_lvl = pct_to_lvl($s_pct);

$bank = lt_bank();

$name     = $attempt['full_name'];
$to_email = $attempt['email'];
$date_str = date('d/m/Y', strtotime($attempt['created_at']));
$notes    = $attempt['teacher_notes'] ?? '';

$subject  = '=?UTF-8?B?' . base64_encode('نتيجة اختبار تحديد المستوى | Level Test Result — حبيبة نبيل') . '?=';
$from     = 'info@mshabibanabil.com';
$fromName = '=?UTF-8?B?' . base64_encode('حبيبة نبيل') . '?=';

$overall_label = bilingual_level($final_level);

function score_row(string $ar, string $en, string $icon, int $raw, int $max, string $lvl): string {
    $label = bilingual_level($lvl);
    return "<tr style='border-bottom:1px solid #e5f0f0'>
      <td style='padding:10px 14px'>
        <span style='font-size:16px'>{$icon}</span>
        <span style='font-size:14px;font-weight:600;color:#1a1a1a;margin-right:6px'>{$ar}</span>
        <span style='font-size:12px;color:#999'>{$en}</span>
      </td>
      <td style='padding:10px 14px;font-size:16px;font-weight:900;color:#0d4f4f;text-align:center'>{$raw}/{$max}</td>
      <td style='padding:10px 14px;font-size:12px;color:#444;text-align:center'>{$label}</td>
    </tr>";
}

function skill_block(string $ar, string $en, string $icon, int $raw, int $max, string $lvl, array $bank_skill): string {
    $label   = bilingual_level($lvl);
    $desc    = htmlspecialchars($bank_skill[$lvl]['desc']    ?? '', ENT_QUOTES);
    $bullets = $bank_skill[$lvl]['bullets'] ?? [];
    $bullet_html = '';
    foreach ($bullets as $b) {
        $bullet_html .= "<li style='margin-bottom:4px'>" . htmlspecialchars($b, ENT_QUOTES) . "</li>";
    }
    return "
      <div style='border:1px solid #d0e8e8;border-radius:10px;padding:18px 20px;margin-bottom:16px'>
        <div style='display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px'>
          <div>
            <span style='font-size:20px'>{$icon}</span>
            <span style='font-size:16px;font-weight:700;color:#1a1a1a;margin-right:8px'>{$ar}</span>
            <span style='font-size:13px;color:#888'>{$en}</span>
          </div>
          <div style='text-align:center;flex-shrink:0'>
            <div style='font-size:22px;font-weight:900;color:#0d4f4f;line-height:1'>{$raw}/{$max}</div>
            <div style='font-size:11px;color:#0d4f4f;margin-top:2px'>{$label}</div>
          </div>
        </div>
        <div style='width:100%;background:#e0f0f0;border-radius:4px;height:5px;margin-bottom:12px'>
          <div style='background:#0d4f4f;border-radius:4px;height:5px;width:" . round($raw/$max*100) . "%'></div>
        </div>
        <p style='font-size:14px;color:#555;direction:rtl;text-align:right;margin:0 0 8px'>{$desc}</p>
        <ul style='font-size:13px;color:#666;direction:rtl;text-align:right;margin:0;padding-right:18px'>
          {$bullet_html}
        </ul>
      </div>";
}

$score_rows = score_row('الاستماع', 'Listening', '&#x1F3A7;', $listening_score, 30, $l_lvl)
            . score_row('القراءة',  'Reading',   '&#x1F4D6;', $reading_score,   25, $r_lvl)
            . score_row('التحدث',   'Speaking',  '&#x1F5E3;', $speaking_score,  80, $s_lvl)
            . score_row('الكتابة',  'Writing',   '&#x270D;',  $writing_score,   40, $w_lvl);

$skill_blocks = skill_block('الاستماع', 'Listening', '&#x1F3A7;', $listening_score, 30, $l_lvl, $bank['listening'])
              . skill_block('القراءة',  'Reading',   '&#x1F4D6;', $reading_score,   25, $r_lvl, $bank['reading'])
              . skill_block('التحدث',   'Speaking',  '&#x1F5E3;', $speaking_score,  80, $s_lvl, $bank['speaking'])
              . skill_block('الكتابة',  'Writing',   '&#x270D;',  $writing_score,   40, $w_lvl, $bank['writing']);

$notes_section = '';
if ($notes) {
    $notes_html = htmlspecialchars($notes, ENT_QUOTES);
    $notes_section = "
      <div style='background:#e8f5f5;border-radius:10px;padding:18px 20px;margin-bottom:24px'>
        <div style='font-size:13px;font-weight:700;color:#0d4f4f;margin-bottom:8px'>
          Teacher Notes &middot; &#x645;&#x644;&#x627;&#x62D;&#x638;&#x627;&#x62A; &#x627;&#x644;&#x645;&#x639;&#x644;&#x645;&#x629;
        </div>
        <div style='font-size:14px;color:#444;white-space:pre-wrap;direction:rtl;text-align:right'>{$notes_html}</div>
      </div>";
}

$html = <<<HTML
<!DOCTYPE html>
<html lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#e8f5f5;font-family:Tahoma,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f5f5;padding:32px 0">
  <tr><td align="center">
    <table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:620px;width:100%;box-shadow:0 4px 24px rgba(13,79,79,.1)">

      <tr>
        <td style="background:linear-gradient(135deg,#0d4f4f 0%,#1a7a7a 100%);padding:40px 28px;text-align:center;color:#fff">
          <div style="font-size:13px;opacity:.8;margin-bottom:6px;letter-spacing:.5px">HABIBA NABIL &middot; &#x62D;&#x628;&#x64A;&#x628;&#x629; &#x646;&#x628;&#x64A;&#x644;</div>
          <div style="font-size:11px;opacity:.65;margin-bottom:20px">Arabic Language School</div>
          <div style="font-size:21px;font-weight:900;margin-bottom:20px">
            Level Test Result<br>
            <span style="font-size:17px;font-weight:400;opacity:.9">&#x646;&#x62A;&#x64A;&#x62C;&#x629; &#x627;&#x62E;&#x62A;&#x628;&#x627;&#x631; &#x62A;&#x62D;&#x62F;&#x64A;&#x62F; &#x627;&#x644;&#x645;&#x633;&#x62A;&#x648;&#x649;</span>
          </div>
          <div style="background:rgba(255,255,255,.18);display:inline-block;padding:12px 36px;border-radius:999px">
            <div style="font-size:42px;font-weight:900;line-height:1">{$final_level}</div>
          </div>
          <div style="margin-top:12px;font-size:15px;opacity:.9">{$overall_label}</div>
          <div style="margin-top:6px;font-size:13px;opacity:.7">Total &middot; &#x627;&#x644;&#x645;&#x62C;&#x645;&#x648;&#x639;: {$total}/175 ({$overall_pct}%)</div>
        </td>
      </tr>

      <tr>
        <td style="padding:24px 28px 8px">
          <div style="font-size:18px;font-weight:700;color:#1a1a1a">{$name}</div>
          <div style="font-size:13px;color:#888;margin-top:4px">Test date &middot; &#x62A;&#x627;&#x631;&#x64A;&#x62E; &#x627;&#x644;&#x627;&#x62E;&#x62A;&#x628;&#x627;&#x631;: {$date_str}</div>
        </td>
      </tr>

      <tr>
        <td style="padding:12px 28px 0">
          <div style="font-size:13px;font-weight:700;color:#0d4f4f;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">
            Score Summary &middot; &#x645;&#x644;&#x62E;&#x635; &#x627;&#x644;&#x646;&#x62A;&#x627;&#x626;&#x62C;
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #d0e8e8;border-radius:10px;overflow:hidden">
            <thead>
              <tr style="background:#e8f5f5">
                <th style="padding:10px 14px;font-size:12px;color:#0d4f4f;text-align:right;font-weight:700">Skill &middot; &#x627;&#x644;&#x645;&#x647;&#x627;&#x631;&#x629;</th>
                <th style="padding:10px 14px;font-size:12px;color:#0d4f4f;text-align:center;font-weight:700">Score</th>
                <th style="padding:10px 14px;font-size:12px;color:#0d4f4f;text-align:center;font-weight:700">Level &middot; &#x627;&#x644;&#x645;&#x633;&#x62A;&#x648;&#x649;</th>
              </tr>
            </thead>
            <tbody>
              {$score_rows}
            </tbody>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:24px 28px 8px">
          <div style="font-size:13px;font-weight:700;color:#0d4f4f;margin-bottom:14px;text-transform:uppercase;letter-spacing:.5px">
            Skills Detail &middot; &#x62A;&#x641;&#x627;&#x635;&#x64A;&#x644; &#x627;&#x644;&#x645;&#x647;&#x627;&#x631;&#x627;&#x62A;
          </div>
          {$skill_blocks}
        </td>
      </tr>

      {$notes_section_row}

      <tr>
        <td style="background:#e8f5f5;padding:24px 28px;text-align:center;border-top:1px solid #d0e8e8">
          <div style="font-size:14px;font-weight:700;color:#0d4f4f">Habiba Nabil &middot; &#x62D;&#x628;&#x64A;&#x628;&#x629; &#x646;&#x628;&#x64A;&#x644;</div>
          <div style="font-size:12px;color:#999;margin-top:4px">Arabic Language School &middot; &#x645;&#x62F;&#x631;&#x633;&#x629; &#x627;&#x644;&#x644;&#x63A;&#x629; &#x627;&#x644;&#x639;&#x631;&#x628;&#x64A;&#x629;</div>
          <div style="font-size:12px;color:#bbb;margin-top:2px">info@mshabibanabil.com</div>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
HTML;

if ($notes_section) {
    $notes_row = "<tr><td style='padding:0 28px 8px'>{$notes_section}</td></tr>";
    $html = str_replace('{$notes_section_row}', $notes_row, $html);
} else {
    $html = str_replace('{$notes_section_row}', '', $html);
}

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: {$fromName} <{$from}>\r\n";
$headers .= "Reply-To: {$from}\r\n";

$sent = mail($to_email, $subject, $html, $headers);
if (!$sent) json_err('Failed to send email. Please check server mail configuration.');

json_ok(['sent_to' => $to_email]);
