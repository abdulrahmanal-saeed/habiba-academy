<?php
// lib/pwa-head.php — PWA meta tags + push init (include inside <head>)
$_hnVapidPublic = trim((string)(getenv('VAPID_PUBLIC_KEY') ?: ''));
$_hnIsTeacher   = !empty($_SESSION['teacher_logged']);
$_hnIsStudent   = !empty($_SESSION['student_id']);
$_hnAuthed      = $_hnIsTeacher || $_hnIsStudent;
?>
  <meta name="theme-color" content="#0d4f4f">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="HN Academy">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/assets/img/icon-180.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/img/icon-192.png">
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').catch(function () {});
      });
    }
<?php if ($_hnAuthed && $_hnVapidPublic): ?>
    window.VAPID_PUBLIC_KEY = <?= json_encode($_hnVapidPublic) ?>;
<?php endif; ?>
  </script>
<?php if ($_hnAuthed && $_hnVapidPublic): ?>
  <script src="/assets/js/push-init.js" defer></script>
<?php endif; ?>
