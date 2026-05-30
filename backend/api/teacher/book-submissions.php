<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
require_once __DIR__ . '/../../config/config/db.php';

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

interactive_books_ensure_schema($pdo);

$status    = trim((string)($_GET['status'] ?? ''));
$q         = trim((string)($_GET['q'] ?? ''));
$studentId = (int)($_GET['student_id'] ?? 0);
$where     = [];
$params    = [];

if ($studentId > 0) {
    $where[] = 'bls.student_id = ?';
    $params[] = $studentId;
}
if ($status !== '') {
    $where[] = 'bls.status = ?';
    $params[] = $status;
}
if ($q !== '') {
    $where[] = '(s.full_name LIKE ? OR s.login_code LIKE ? OR b.title_en LIKE ? OR l.title_en LIKE ?)';
    array_push($params, "%$q%", "%$q%", "%$q%", "%$q%");
}

$sql = "
    SELECT bls.id, bls.student_id, bls.status, bls.auto_score, bls.teacher_score,
           bls.submitted_at, bls.reviewed_at,
           s.full_name, s.login_code,
           b.title_en AS book_title,
           l.title_en AS lesson_title, l.lesson_number, l.unit_type
    FROM book_lesson_submissions bls
    JOIN students s ON s.id = bls.student_id
    JOIN books b ON b.id = bls.book_id
    JOIN book_lessons l ON l.id = bls.lesson_id
";
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY COALESCE(bls.submitted_at, bls.updated_at, bls.created_at) DESC, bls.id DESC LIMIT 200';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

$submissions = array_map(static function (array $r): array {
    return [
        'id'            => (int)$r['id'],
        'student_id'    => (int)$r['student_id'],
        'full_name'     => (string)$r['full_name'],
        'login_code'    => (string)$r['login_code'],
        'book_title'    => (string)$r['book_title'],
        'lesson_title'  => (string)$r['lesson_title'],
        'lesson_number' => (int)$r['lesson_number'],
        'unit_type'     => (string)$r['unit_type'],
        'status'        => (string)$r['status'],
        'auto_score'    => (float)$r['auto_score'],
        'teacher_score' => $r['teacher_score'] !== null ? (float)$r['teacher_score'] : null,
        'submitted_at'  => $r['submitted_at'],
        'reviewed_at'   => $r['reviewed_at'],
    ];
}, $rows);

json_ok(['submissions' => $submissions]);
