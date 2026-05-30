<?php
// lib/notify.php - Teacher + student notifications
declare(strict_types=1);
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/push.php';
require_once __DIR__ . '/communications.php';

if (!defined('NOTIFY_TO')) {
    define('NOTIFY_TO', 'ms.habibanabil@gmail.com');
}
if (!defined('NOTIFY_FROM')) {
    define('NOTIFY_FROM', 'info@mshabibanabil.com');
}

function notify_mail_headers(): string
{
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Smart Homework <" . NOTIFY_FROM . ">\r\n";
    $headers .= "Reply-To: " . NOTIFY_FROM . "\r\n";
    return $headers;
}

function notify_send_mail(string $to, string $subject, string $html): void
{
    if ($to === '') {
        return;
    }
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $ok = @mail($to, $encodedSubject, $html, notify_mail_headers());
    try {
        if (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
            communications_log_email($GLOBALS['pdo'], $to, $subject, $html, '', $ok ? 'sent' : 'logged');
        }
    } catch (Throwable) {}
}

function notify_ensure_delivery_log(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS notification_delivery_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_type VARCHAR(40) NOT NULL,
            item_id INT NOT NULL,
            channel VARCHAR(20) NOT NULL,
            recipient VARCHAR(255) DEFAULT NULL,
            sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_item_channel_recipient (item_type, item_id, channel, recipient(191))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $done = true;
}

function notify_delivery_logged(PDO $pdo, string $itemType, int $itemId, string $channel, string $recipient = ''): bool
{
    if ($itemType === '' || $itemId <= 0 || $channel === '') {
        return false;
    }
    notify_ensure_delivery_log($pdo);
    $stmt = $pdo->prepare("
        SELECT id
        FROM notification_delivery_log
        WHERE item_type = ? AND item_id = ? AND channel = ? AND recipient = ?
        LIMIT 1
    ");
    $stmt->execute([$itemType, $itemId, $channel, $recipient]);
    return (bool)$stmt->fetchColumn();
}

function notify_log_delivery(PDO $pdo, string $itemType, int $itemId, string $channel, string $recipient = ''): void
{
    if ($itemType === '' || $itemId <= 0 || $channel === '') {
        return;
    }
    notify_ensure_delivery_log($pdo);
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO notification_delivery_log (item_type, item_id, channel, recipient)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$itemType, $itemId, $channel, $recipient]);
}

function notify_base_url(): string
{
    $envUrl = trim((string)(getenv('APP_BASE_URL') ?: ''));
    if ($envUrl !== '') {
        return rtrim($envUrl, '/');
    }

    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $host = trim((string)($_SERVER['HTTP_HOST'] ?? 'mshabibanabil.com'));
    return ($https ? 'https://' : 'http://') . $host;
}

function notify_public_url(string $path): string
{
    if ($path === '') {
        return notify_base_url();
    }
    if (preg_match('~^https?://~i', $path)) {
        return $path;
    }
    return notify_base_url() . '/' . ltrim($path, '/');
}

function notify_simple_request(string $url, array $headers = [], ?string $body = null): void
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        if ($headers) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
        curl_exec($ch);
        curl_close($ch);
        return;
    }

    $context = stream_context_create([
        'http' => [
            'method' => $body === null ? 'GET' : 'POST',
            'timeout' => 8,
            'header' => $headers ? implode("\r\n", $headers) : '',
            'content' => $body ?? '',
        ],
    ]);
    @file_get_contents($url, false, $context);
}

function notify_student_whatsapp(string $phone, string $message): void
{
    $phone = preg_replace('/\D+/', '', $phone);
    if ($phone === '') {
        return;
    }

    $cloudToken = trim((string)(getenv('WHATSAPP_CLOUD_TOKEN') ?: ''));
    $cloudPhoneId = trim((string)(getenv('WHATSAPP_CLOUD_PHONE_ID') ?: ''));
    if ($cloudToken !== '' && $cloudPhoneId !== '') {
        $url = 'https://graph.facebook.com/v22.0/' . rawurlencode($cloudPhoneId) . '/messages';
        $payload = json_encode([
            'messaging_product' => 'whatsapp',
            'to' => $phone,
            'type' => 'text',
            'text' => ['preview_url' => false, 'body' => $message],
        ], JSON_UNESCAPED_UNICODE);
        if (is_string($payload)) {
            notify_simple_request($url, [
                'Authorization: Bearer ' . $cloudToken,
                'Content-Type: application/json',
            ], $payload);
        }
        return;
    }

    $callMeBotKey = trim((string)(getenv('WHATSAPP_CALLMEBOT_APIKEY') ?: ''));
    if ($callMeBotKey !== '') {
        $url = 'https://api.callmebot.com/whatsapp.php?phone=' . rawurlencode($phone)
            . '&text=' . rawurlencode($message)
            . '&apikey=' . rawurlencode($callMeBotKey);
        notify_simple_request($url);
    }
}

function notify_student_email_html(string $studentName, string $headline, string $body, string $ctaLabel, string $ctaUrl): string
{
    $studentName = htmlspecialchars($studentName !== '' ? $studentName : 'Student', ENT_QUOTES, 'UTF-8');
    $headline = htmlspecialchars($headline, ENT_QUOTES, 'UTF-8');
    $bodyHtml = nl2br(htmlspecialchars($body, ENT_QUOTES, 'UTF-8'));
    $ctaLabel = htmlspecialchars($ctaLabel, ENT_QUOTES, 'UTF-8');
    $ctaUrl = htmlspecialchars($ctaUrl, ENT_QUOTES, 'UTF-8');

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;background:#f4f6fb">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08)">
      <tr>
        <td style="padding:24px 28px;background:linear-gradient(135deg,#0f766e,#155e75);color:#fff">
          <div style="font-size:18px;font-weight:700">Habiba Nabil</div>
          <div style="margin-top:6px;font-size:13px;opacity:.88">A new update is waiting for you</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px">
          <div style="font-size:14px;color:#64748b;margin-bottom:12px">Hello {$studentName},</div>
          <div style="font-size:24px;line-height:1.3;font-weight:700;color:#0f172a;margin-bottom:12px">{$headline}</div>
          <div style="font-size:15px;line-height:1.8;color:#334155;margin-bottom:24px">{$bodyHtml}</div>
          <a href="{$ctaUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700">{$ctaLabel}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;background:#f8fafc;font-size:12px;color:#94a3b8">
          mshabibanabil.com · This message was sent automatically.
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>
HTML;
}

function notify_teacher(string $subject, array $items): void
{
    $date = format_app_datetime(date('Y-m-d H:i:s'), 'd M Y');
    $rowsHtml = '';

    foreach ($items as $item) {
        $icon = htmlspecialchars($item['icon'] ?? '', ENT_QUOTES, 'UTF-8');
        $label = htmlspecialchars($item['label'] ?? '', ENT_QUOTES, 'UTF-8');
        $value = htmlspecialchars($item['value'] ?? '—', ENT_QUOTES, 'UTF-8');
        $rowsHtml .= "
        <tr>
          <td style='padding:10px 0;border-bottom:1px solid #f0eef9;white-space:nowrap'>
            <span style='font-size:17px'>{$icon}</span>
            <span style='color:#999;font-size:12px;margin-right:6px'>{$label}</span>
          </td>
          <td style='padding:10px 0;border-bottom:1px solid #f0eef9;text-align:left;font-weight:600;color:#2d2d2d;font-size:14px'>{$value}</td>
        </tr>";
    }

    $html = <<<HTML
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.09)">
      <tr><td style="background:linear-gradient(135deg,#6c4abf 0%,#9f73e6 100%);padding:22px 28px">
        <div style="color:#fff;font-size:17px;font-weight:700">إشعار جديد · Smart Homework</div>
        <div style="color:rgba(255,255,255,.65);font-size:12px;margin-top:3px">{$date}</div>
      </td></tr>
      <tr><td style="padding:24px 28px">
        <table width="100%" cellpadding="0" cellspacing="0">
          {$rowsHtml}
        </table>
      </td></tr>
      <tr><td style="background:#f9f7ff;padding:14px 28px;font-size:11px;color:#aaa;text-align:center">
        mshabibanabil.com · تم الإرسال تلقائيًا من النظام
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
HTML;

    notify_send_mail(NOTIFY_TO, $subject, $html);
}

function notify_student_publication(PDO $pdo, int $studentId, array $payload): void
{
    if ($studentId <= 0) {
        return;
    }

    $stmt = $pdo->prepare("SELECT full_name, email, whatsapp, login_code FROM students WHERE id = ? LIMIT 1");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$student) {
        return;
    }

    $headline = trim((string)($payload['headline'] ?? 'New update available'));
    $body = trim((string)($payload['body'] ?? 'A new item has been published for you.'));
    $actionLabel = trim((string)($payload['action_label'] ?? 'Open'));
    $actionUrl = notify_public_url((string)($payload['action_url'] ?? '/student/home.php'));
    $kind = trim((string)($payload['kind'] ?? 'Update'));
    $title = trim((string)($payload['title'] ?? $headline));
    $studentName = trim((string)($student['full_name'] ?? 'Student'));
    $loginCode = trim((string)($student['login_code'] ?? ''));
    $deliveryType = trim((string)($payload['delivery_type'] ?? ''));
    $deliveryId = (int)($payload['delivery_id'] ?? 0);
    $channels = (array)($payload['channels'] ?? ['email', 'whatsapp']);

    $subject = $kind . ' - ' . ($title !== '' ? $title : $headline);
    $fullBody = $body . ($loginCode !== '' ? "\n\nYour code: {$loginCode}" : '');

    $email = trim((string)($student['email'] ?? ''));
    if ($email !== '' && in_array('email', $channels, true)) {
        $alreadySent = $deliveryType !== '' && $deliveryId > 0
            ? notify_delivery_logged($pdo, $deliveryType, $deliveryId, 'email', $email)
            : false;
        if (!$alreadySent) {
            $html = notify_student_email_html($studentName, $headline, $fullBody, $actionLabel, $actionUrl);
            notify_send_mail($email, $subject, $html);
            if ($deliveryType !== '' && $deliveryId > 0) {
                notify_log_delivery($pdo, $deliveryType, $deliveryId, 'email', $email);
            }
        }
    }

    // Push notification to student's browser
    try {
        push_notify_student(
            $pdo,
            $studentId,
            '🆕 ' . $headline,
            $body,
            notify_public_url((string)($payload['action_url'] ?? '/student/home.php'))
        );
    } catch (Throwable) {}

    $whatsApp = trim((string)($student['whatsapp'] ?? ''));
    if ($whatsApp !== '' && in_array('whatsapp', $channels, true)) {
        $alreadySent = $deliveryType !== '' && $deliveryId > 0
            ? notify_delivery_logged($pdo, $deliveryType, $deliveryId, 'whatsapp', $whatsApp)
            : false;
        if ($alreadySent) {
            return;
        }
        $message = $headline . "\n" . $fullBody . "\n" . $actionUrl;
        notify_student_whatsapp($whatsApp, $message);
        if ($deliveryType !== '' && $deliveryId > 0) {
            notify_log_delivery($pdo, $deliveryType, $deliveryId, 'whatsapp', $whatsApp);
        }
    }
}

function process_scheduled_publication_emails(PDO $pdo, int $limit = 8): void
{
    if ($limit <= 0) {
        $html = notify_student_email_html($studentName, $headline, $fullBody, $actionLabel, $actionUrl);
        return;
    }

    ensure_publish_schedule_support($pdo);
    notify_ensure_delivery_log($pdo);

    $lockStmt = $pdo->query("SELECT GET_LOCK('scheduled_publication_emails', 0)");
    $lockAcquired = (int)$lockStmt->fetchColumn() === 1;
    if (!$lockAcquired) {
        return;
    }

    try {
        $dueItems = [];

        $queries = [
            'homework' => "
                SELECT h.id, h.student_id, h.title, h.publish_at
                FROM homeworks h
                WHERE h.status = 'published'
                  AND h.publish_at IS NOT NULL
                  AND h.publish_at <= NOW()
                  AND NOT EXISTS (
                    SELECT 1 FROM notification_delivery_log l
                    WHERE l.item_type = 'homework' AND l.item_id = h.id AND l.channel = 'email'
                  )
                ORDER BY h.publish_at ASC
                LIMIT {$limit}
            ",
            'scenario' => "
                SELECT sc.id, sc.student_id, sc.title, sc.publish_at
                FROM scenarios sc
                WHERE sc.status = 'published'
                  AND sc.publish_at IS NOT NULL
                  AND sc.publish_at <= NOW()
                  AND NOT EXISTS (
                    SELECT 1 FROM notification_delivery_log l
                    WHERE l.item_type = 'scenario' AND l.item_id = sc.id AND l.channel = 'email'
                  )
                ORDER BY sc.publish_at ASC
                LIMIT {$limit}
            ",
            'review' => "
                SELECT r.id, r.student_id, r.title, r.publish_at, r.review_type
                FROM student_reviews r
                WHERE r.status = 'published'
                  AND r.publish_at IS NOT NULL
                  AND r.publish_at <= NOW()
                  AND NOT EXISTS (
                    SELECT 1 FROM notification_delivery_log l
                    WHERE l.item_type = 'review' AND l.item_id = r.id AND l.channel = 'email'
                  )
                ORDER BY r.publish_at ASC
                LIMIT {$limit}
            ",
        ];

        foreach ($queries as $type => $sql) {
            foreach ($pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $row['item_type'] = $type;
                $dueItems[] = $row;
            }
        }

        usort($dueItems, static function (array $a, array $b): int {
            return strcmp((string)($a['publish_at'] ?? ''), (string)($b['publish_at'] ?? ''));
        });

        $dueItems = array_slice($dueItems, 0, $limit);
        foreach ($dueItems as $item) {
            $type = (string)$item['item_type'];
            $id = (int)$item['id'];
            $studentId = (int)$item['student_id'];
            $title = (string)($item['title'] ?? '');

            if ($type === 'homework') {
                notify_student_publication($pdo, $studentId, [
                    'kind' => 'Homework',
                    'title' => $title,
                    'headline' => 'New homework published',
                    'body' => 'Your homework "' . $title . '" is ready for you.',
                    'action_label' => 'Start Homework',
                    'action_url' => '/student/homework.php?homework_id=' . $id,
                    'delivery_type' => 'homework',
                    'delivery_id' => $id,
                    'channels' => ['email'],
                ]);
                continue;
            }

            if ($type === 'scenario') {
                notify_student_publication($pdo, $studentId, [
                    'kind' => 'Scenario',
                    'title' => $title,
                    'headline' => 'New scenario published',
                    'body' => 'Your scenario "' . $title . '" is now available.',
                    'action_label' => 'Open Scenario',
                    'action_url' => '/student/scenario.php?scenario_id=' . $id,
                    'delivery_type' => 'scenario',
                    'delivery_id' => $id,
                    'channels' => ['email'],
                ]);
                continue;
            }

            notify_student_publication($pdo, $studentId, [
                'kind' => ((string)($item['review_type'] ?? 'weekly_review')) === 'monthly_review' ? 'Monthly Review' : 'Weekly Review',
                'title' => $title,
                'headline' => (((string)($item['review_type'] ?? 'weekly_review')) === 'monthly_review' ? 'Monthly Review' : 'Weekly Review') . ' published',
                'body' => 'Your review "' . $title . '" is now available on the website.',
                'action_label' => 'Open Review',
                'action_url' => '/student/review/take.php?review_id=' . $id,
                'delivery_type' => 'review',
                'delivery_id' => $id,
                'channels' => ['email'],
            ]);
        }
    } catch (Throwable $ignored) {
        // Keep requests alive even if background scheduled delivery fails.
    } finally {
        $pdo->query("SELECT RELEASE_LOCK('scheduled_publication_emails')");
    }
}
