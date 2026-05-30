<?php
// api/teacher/leveltest-attempts.php — List level test attempts (teacher view)
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/leveltest_db.php';
require_once __DIR__ . '/../../config/config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

lt_ensure_db_tables($pdo);

$status = trim((string)($_GET['status'] ?? 'all'));
$limit  = min(100, max(10, (int)($_GET['limit']  ?? 50)));
$offset = max(0, (int)($_GET['offset'] ?? 0));

$validStatus = ['pending', 'reviewed', 'all'];
if (!in_array($status, $validStatus, true)) $status = 'all';

$where = $status === 'all' ? '' : "WHERE la.review_status = :status";

$countSql = "SELECT COUNT(*) FROM leveltest_attempts la $where";
$countStmt = $pdo->prepare($countSql);
if ($status !== 'all') $countStmt->bindValue(':status', $status);
$countStmt->execute();
$total = (int)$countStmt->fetchColumn();

$pendingStmt = $pdo->query("SELECT COUNT(*) FROM leveltest_attempts WHERE review_status = 'pending'");
$pendingCount = (int)$pendingStmt->fetchColumn();

$sql = "
    SELECT la.id, la.student_id, la.full_name, la.email, la.whatsapp, la.age, la.country,
           la.applicant_type, la.test_type, la.lead_status, la.review_status,
           la.listening_score, la.reading_score, la.writing_score, la.speaking_score,
           la.auto_score, la.overall_estimated_level, la.final_level, la.teacher_notes,
           la.created_at, la.submitted_at, la.reviewed_at
    FROM leveltest_attempts la
    $where
    ORDER BY la.created_at DESC
    LIMIT :limit OFFSET :offset
";
$stmt = $pdo->prepare($sql);
if ($status !== 'all') $stmt->bindValue(':status', $status);
$stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$attempts = array_map(static function (array $r): array {
    return [
        'id'                      => (int)$r['id'],
        'student_id'              => $r['student_id'] ? (int)$r['student_id'] : null,
        'full_name'               => $r['full_name'],
        'email'                   => $r['email'],
        'whatsapp'                => $r['whatsapp'],
        'age'                     => $r['age'] !== null ? (int)$r['age'] : null,
        'country'                 => $r['country'],
        'applicant_type'          => $r['applicant_type'],
        'test_type'               => $r['test_type'],
        'lead_status'             => $r['lead_status'],
        'review_status'           => $r['review_status'],
        'listening_score'         => $r['listening_score'] !== null ? (int)$r['listening_score'] : null,
        'reading_score'           => $r['reading_score']   !== null ? (int)$r['reading_score']   : null,
        'writing_score'           => $r['writing_score']   !== null ? (int)$r['writing_score']   : null,
        'speaking_score'          => $r['speaking_score']  !== null ? (int)$r['speaking_score']  : null,
        'auto_score'              => $r['auto_score']      !== null ? (int)$r['auto_score']      : null,
        'overall_estimated_level' => $r['overall_estimated_level'],
        'final_level'             => $r['final_level'],
        'teacher_notes'           => $r['teacher_notes'],
        'created_at'              => $r['created_at'],
        'submitted_at'            => $r['submitted_at'],
        'reviewed_at'             => $r['reviewed_at'],
    ];
}, $stmt->fetchAll());

json_ok([
    'attempts'      => $attempts,
    'total'         => $total,
    'pending_count' => $pendingCount,
]);
