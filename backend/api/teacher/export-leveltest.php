<?php
// api/teacher/export-leveltest.php — Download all level test results as CSV
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) {
    header('Location: /teacher/login.php');
    exit;
}

$rows = $pdo->query("
    SELECT la.id, la.full_name, la.email, la.whatsapp, la.age, la.country,
           la.listening_score, la.reading_score, la.writing_score, la.speaking_score,
           la.auto_score, la.final_level, la.overall_estimated_level,
           la.review_status, la.created_at
    FROM leveltest_attempts la
    ORDER BY la.created_at DESC
")->fetchAll(PDO::FETCH_ASSOC);

$filename = 'leveltest_results_' . date('Ymd_His') . '.csv';

header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: no-cache, no-store, must-revalidate');

echo "\xEF\xBB\xBF"; // UTF-8 BOM for Excel

$out = fopen('php://output', 'w');

fputcsv($out, [
    'ID', 'Name', 'Email', 'WhatsApp', 'Age', 'Country',
    'Listening /30', 'Reading /25', 'Writing /40', 'Speaking /80',
    'Auto Score /55', 'Final Level', 'Estimated Level',
    'Status', 'Date',
]);

foreach ($rows as $r) {
    fputcsv($out, [
        $r['id'],
        $r['full_name'],
        $r['email']     ?? '',
        $r['whatsapp']  ?? '',
        $r['age']       ?? '',
        $r['country']   ?? '',
        $r['listening_score'] ?? '',
        $r['reading_score']   ?? '',
        $r['writing_score']   ?? '',
        $r['speaking_score']  ?? '',
        $r['auto_score']      ?? '',
        $r['final_level']     ?? '',
        $r['overall_estimated_level'] ?? '',
        $r['review_status']   ?? 'pending',
        $r['created_at']      ?? '',
    ]);
}

fclose($out);
exit;
