<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/settings.php';
require_once __DIR__ . '/../../config/config/db.php';

$pdo = get_db();

/* ── GET — return all settings as key→value map ───────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $table = settings_table_name($pdo);
    $stmt  = $pdo->query("SELECT setting_key, setting_value FROM {$table} ORDER BY setting_key");
    $rows  = $stmt ? $stmt->fetchAll(PDO::FETCH_KEY_PAIR) : [];
    json_ok(['settings' => $rows ?: (object)[]]);
    exit;
}

/* ── POST — update one setting ────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_validate();
    $key   = trim((string)($_POST['setting_key']   ?? ''));
    $value = trim((string)($_POST['setting_value'] ?? ''));

    if ($key === '' || !preg_match('/^[a-z0-9_]+$/', $key)) {
        json_err('invalid setting_key');
        exit;
    }

    update_setting($pdo, $key, $value);
    json_ok(['key' => $key, 'value' => $value]);
    exit;
}

json_err('method not allowed');
