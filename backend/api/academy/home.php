<?php
declare(strict_types=1);

require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../config/config/db.php';
require_once __DIR__ . '/../../lib/lib/roles-portals.php';

start_session();
if (empty($_SESSION['academy_id'])) json_err('Not authenticated', 401);
$academy_id = (int)$_SESSION['academy_id'];
portals_ensure_schema($pdo);

$stmt = $pdo->prepare('SELECT id, name, email, status FROM academies WHERE id = ? LIMIT 1');
$stmt->execute([$academy_id]);
$academy = $stmt->fetch();
if (!$academy) json_err('Academy not found', 404);

$sStmt = $pdo->prepare("
    SELECT st.id, st.full_name, st.login_code, st.level, st.is_active,
           COUNT(CASE WHEN lps.status = 'completed' THEN 1 END) AS completed_sessions,
           COUNT(CASE WHEN lps.status IN ('planned','rescheduled')
                       AND lps.planned_date >= CURDATE() THEN 1 END) AS upcoming_sessions
    FROM academy_students ast
    JOIN students st ON st.id = ast.student_id
    LEFT JOIN lesson_plan_sessions lps ON lps.student_id = st.id
    WHERE ast.academy_id = ? AND ast.status = 'active'
    GROUP BY st.id
    ORDER BY st.full_name
");
$sStmt->execute([$academy_id]);
$students = $sStmt->fetchAll() ?: [];

json_ok([
    'academy'  => $academy,
    'students' => $students,
    'kpis'     => [
        'student_count'   => count($students),
        'total_completed' => (int)array_sum(array_column($students, 'completed_sessions')),
        'total_upcoming'  => (int)array_sum(array_column($students, 'upcoming_sessions')),
    ],
]);
