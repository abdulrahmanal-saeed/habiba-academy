<?php
// api/teacher/contract-save.php — Create or update student contract
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../lib/lesson-schedule.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))      json_err('Not authenticated', 401);
csrf_validate();
ensure_lesson_schedule_schema($pdo);

$student_id  = (int)($_POST['student_id']               ?? 0);
$total_hours = (float)($_POST['total_hours']             ?? 0);
$sess_min    = (int)($_POST['session_duration_minutes']  ?? 90);
$start_date  = trim($_POST['start_date']                 ?? '');
$notes       = trim($_POST['notes']                      ?? '');
$packageName = substr(trim((string)($_POST['package_name'] ?? '')), 0, 120);
$defaultPrice = (float)($_POST['default_price_aed'] ?? 120);

if ($student_id <= 0) json_err('Invalid student');
if ($total_hours <= 0) json_err('Total hours required');
if ($sess_min <= 0)    json_err('Session duration required');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) json_err('Invalid start date');
if ($defaultPrice <= 0) $defaultPrice = 120.0;

$totalSessions = (int)round($total_hours / ($sess_min / 60));
if ($totalSessions < 1) json_err('Contract too short');

// Check existing contract
$stmt = $pdo->prepare("SELECT id FROM student_contracts WHERE student_id = ?");
$stmt->execute([$student_id]);
$existing = $stmt->fetch();

try {
    $pdo->beginTransaction();

    if ($existing) {
        $contractId = (int)$existing['id'];
        $pdo->prepare("
            UPDATE student_contracts
            SET total_hours=?, session_duration_minutes=?, start_date=?, notes=?,
                package_name=?, default_price_aed=?, updated_at=NOW()
            WHERE student_id=?
        ")->execute([$total_hours, $sess_min, $start_date, $notes, $packageName, $defaultPrice, $student_id]);

        // Add new session slots if total increased
        $maxStmt = $pdo->prepare("SELECT MAX(session_number) FROM lesson_plan_sessions WHERE contract_id = ?");
        $maxStmt->execute([$contractId]);
        $currentMax = (int)$maxStmt->fetchColumn();

        $ins = $pdo->prepare("
            INSERT INTO lesson_plan_sessions
                (contract_id, student_id, session_number, duration_minutes, price, subject, updated_at)
            VALUES (?,?,?,?,?,'Arabic',NOW())
        ");
        for ($i = $currentMax + 1; $i <= $totalSessions; $i++) {
            $ins->execute([$contractId, $student_id, $i, $sess_min, $defaultPrice]);
        }
    } else {
        $pdo->prepare("
            INSERT INTO student_contracts
                (student_id, total_hours, session_duration_minutes, start_date, notes, package_name, default_price_aed, updated_at)
            VALUES (?,?,?,?,?,?,?,NOW())
        ")->execute([$student_id, $total_hours, $sess_min, $start_date, $notes, $packageName, $defaultPrice]);
        $contractId = (int)$pdo->lastInsertId();

        // Auto-generate all session slots
        $ins = $pdo->prepare("
            INSERT INTO lesson_plan_sessions
                (contract_id, student_id, session_number, duration_minutes, price, subject, updated_at)
            VALUES (?,?,?,?,?,'Arabic',NOW())
        ");
        for ($i = 1; $i <= $totalSessions; $i++) {
            $ins->execute([$contractId, $student_id, $i, $sess_min, $defaultPrice]);
        }
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    json_err('Save failed: ' . $e->getMessage());
}

json_ok(['contract_id' => $contractId, 'total_sessions' => $totalSessions]);
