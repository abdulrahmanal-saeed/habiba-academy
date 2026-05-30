<?php
// api/teacher/add-student.php — Create a new student with auto-generated login code
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/notify.php';
require_once __DIR__ . '/../../lib/student-briefs.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);
csrf_validate();

$full_name = trim((string)($_POST['full_name'] ?? ''));
$level     = trim((string)($_POST['level']     ?? 'A2'));
$notes     = trim((string)($_POST['notes']     ?? ''));
$briefId   = (int)($_POST['brief_id'] ?? 0);

if ($full_name === '') json_err('Student name is required.');

$validLevels = ['A1','A2','B1','B2','C1','C2'];
if (!in_array($level, $validLevels, true)) $level = 'A2';

// Generate a unique AB-1234 style login code
function generateCode(PDO $pdo): string {
    $tries = 0;
    do {
        $letters = strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ'), 0, 2));
        $digits  = str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        $code    = $letters . '-' . $digits;
        $exists  = (bool)$pdo->prepare("SELECT 1 FROM students WHERE login_code = ?")
                              ->execute([$code]) ? $pdo->prepare("SELECT 1 FROM students WHERE login_code = ?")->execute([$code]) : true;
        // Re-check properly
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE login_code = ?");
        $stmt->execute([$code]);
        $exists = (bool)$stmt->fetchColumn();
        $tries++;
    } while ($exists && $tries < 50);
    return $code;
}

$loginCode = generateCode($pdo);

$stmt = $pdo->prepare("
    INSERT INTO students (full_name, login_code, level, notes, is_active, created_at)
    VALUES (?, ?, ?, ?, 1, NOW())
");
$stmt->execute([$full_name, $loginCode, $level, $notes ?: null]);
$studentId = (int)$pdo->lastInsertId();

if ($briefId > 0) {
    ensure_student_brief_tables($pdo);
    student_brief_mark_converted($pdo, $briefId, $studentId);
}

notify_teacher('👤 طالب جديد أُضيف — ' . $full_name, [
    ['icon' => '👤', 'label' => 'الاسم · Name',        'value' => $full_name],
    ['icon' => '🔑', 'label' => 'الكود · Login Code',  'value' => $loginCode],
    ['icon' => '📊', 'label' => 'المستوى · Level',     'value' => $level],
]);

json_ok([
    'student_id' => $studentId,
    'login_code' => $loginCode,
    'full_name'  => $full_name,
    'level'      => $level,
]);
