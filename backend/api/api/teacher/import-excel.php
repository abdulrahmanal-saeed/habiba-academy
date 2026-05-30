<?php
// api/teacher/import-excel.php — Parse and import homework/scenario from Excel
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

start_session();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged']))      json_err('Not authenticated', 401);
csrf_validate();

// ── Read uploaded file ────────────────────────────────────────────────────
if (empty($_FILES['excel_file']) || $_FILES['excel_file']['error'] !== UPLOAD_ERR_OK) {
    json_err('No file uploaded');
}

$file = $_FILES['excel_file'];
if ($file['size'] > 5 * 1024 * 1024) json_err('File too large (max 5 MB)');

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if ($ext !== 'xlsx') json_err('Only .xlsx files are accepted');

// Validate actual MIME type — XLSX files are ZIP/OOXML archives
$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$fileMime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);
$allowedXlsxMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',          // XLSX is a ZIP archive — reported by many servers
    'application/octet-stream', // Generic fallback from some browsers
];
if (!in_array($fileMime, $allowedXlsxMimes, true)) {
    json_err('Invalid file type: ' . $fileMime . '. Only .xlsx files accepted.');
}

$confirm = (bool)($_POST['confirm'] ?? false);

// ── Load spreadsheet ──────────────────────────────────────────────────────
try {
    $spreadsheet = IOFactory::load($file['tmp_name']);
} catch (Throwable $e) {
    json_err('Could not read Excel file: ' . $e->getMessage());
}

$sheet    = $spreadsheet->getActiveSheet();
$maxRow   = $sheet->getHighestRow();

// ── Load existing student codes for validation ────────────────────────────
$studentMap = []; // code => id
$rows = $pdo->query("SELECT id, login_code FROM students WHERE is_active = 1")->fetchAll();
foreach ($rows as $r) {
    $studentMap[strtoupper(trim($r['login_code']))] = (int)$r['id'];
}

// ── Helper: get cell value safely ────────────────────────────────────────
function cellVal(object $sheet, string $col, int $row): string {
    $val = $sheet->getCell($col . $row)->getValue();
    return trim((string)($val ?? ''));
}

function cellDateVal(object $sheet, string $col, int $row): string {
    $cell = $sheet->getCell($col . $row);
    $val = $cell->getValue();
    if (is_numeric($val) && ExcelDate::isDateTime($cell)) {
        return ExcelDate::excelToDateTimeObject((float)$val)->format('Y-m-d');
    }
    return trim((string)($val ?? ''));
}

function headerMap(object $sheet): array {
    $map = [];
    $max = Coordinate::columnIndexFromString($sheet->getHighestColumn());
    for ($i = 1; $i <= $max; $i++) {
        $col = Coordinate::stringFromColumnIndex($i);
        $header = strtolower(trim((string)($sheet->getCell($col . '1')->getValue() ?? '')));
        if ($header !== '') {
            $map[$header] = $col;
        }
    }
    return $map;
}

function headerCell(array $headers, object $sheet, string $name, int $row, string $fallback = ''): string {
    $key = strtolower($name);
    if (isset($headers[$key])) {
        return cellVal($sheet, $headers[$key], $row);
    }
    return $fallback !== '' ? cellVal($sheet, $fallback, $row) : '';
}

function numberedQuestionGroups(array $headers, string $prefix, array $fields): array {
    $groups = [];
    foreach ($headers as $header => $col) {
        if (preg_match('/^' . preg_quote($prefix, '/') . '(\d+)_([a-z_]+)$/', $header, $m)) {
            $idx = (int)$m[1];
            $field = $m[2];
            if (in_array($field, $fields, true)) {
                $groups[$idx][$field] = $col;
            }
        }
    }
    ksort($groups);
    return $groups;
}

$headers = headerMap($sheet);

// ── Parse rows ────────────────────────────────────────────────────────────
$preview  = [];
$errors   = [];
$created  = ['homeworks' => 0, 'scenarios' => 0];

for ($r = 2; $r <= $maxRow; $r++) {
    $type        = strtolower(cellVal($sheet, 'A', $r));
    $studentCode = strtoupper(cellVal($sheet, 'B', $r));
    $title       = cellVal($sheet, 'C', $r);
    $date        = cellDateVal($sheet, 'D', $r);
    $status      = strtolower(cellVal($sheet, 'E', $r));

    // Skip entirely empty rows
    if ($type === '' && $studentCode === '' && $title === '') continue;

    // Validate type
    if (!in_array($type, ['homework', 'scenario'], true)) {
        $errors[] = "Row {$r}: Invalid type '{$type}' (must be 'homework' or 'scenario')";
        continue;
    }

    // Validate student code
    if (!isset($studentMap[$studentCode])) {
        $errors[] = "Row {$r}: Student code '{$studentCode}' not found";
        continue;
    }
    $student_id = $studentMap[$studentCode];

    // Validate title
    if ($title === '') {
        $errors[] = "Row {$r}: Title is required";
        continue;
    }

    // Validate date
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        $errors[] = "Row {$r}: Date '{$date}' must be YYYY-MM-DD format";
        continue;
    }

    // Normalize status
    if (!in_array($status, ['published', 'draft', 'closed'], true)) $status = 'draft';

    if ($type === 'homework') {
        // ── Parse homework fields ─────────────────────────────────────────
        $listeningUrl  = cellVal($sheet, 'F', $r);
        $listeningInst = cellVal($sheet, 'G', $r);
        $readingText   = cellVal($sheet, 'H', $r);

        $mcqQuestions = [];
        foreach (numberedQuestionGroups($headers, 'mcq', ['q','a','b','c','d','correct']) as $idx => $cols) {
            $q = isset($cols['q']) ? cellVal($sheet, $cols['q'], $r) : '';
            if ($q === '') continue;
            $correct = strtolower(isset($cols['correct']) ? cellVal($sheet, $cols['correct'], $r) : '');
            if (!in_array($correct, ['a','b','c','d'], true)) $correct = 'a';
            $mcqQuestions[] = [
                'question_text'  => $q,
                'option_a'       => isset($cols['a']) ? cellVal($sheet, $cols['a'], $r) : '',
                'option_b'       => isset($cols['b']) ? cellVal($sheet, $cols['b'], $r) : '',
                'option_c'       => isset($cols['c']) ? cellVal($sheet, $cols['c'], $r) : '',
                'option_d'       => isset($cols['d']) ? cellVal($sheet, $cols['d'], $r) : '',
                'correct_option' => $correct,
            ];
        }

        $writingQuestions = [];
        foreach (numberedQuestionGroups($headers, 'writing', ['prompt','min_sentences','focus']) as $idx => $cols) {
            $p = isset($cols['prompt']) ? cellVal($sheet, $cols['prompt'], $r) : '';
            if ($p === '') continue;
            $writingQuestions[] = [
                'prompt'        => $p,
                'min_sentences' => (int)((isset($cols['min_sentences']) ? cellVal($sheet, $cols['min_sentences'], $r) : '') ?: 3),
                'focus_area'    => isset($cols['focus']) ? cellVal($sheet, $cols['focus'], $r) : '',
            ];
        }

        $speakingQuestions = [];
        foreach (numberedQuestionGroups($headers, 'speaking', ['prompt','time_seconds','tips']) as $idx => $cols) {
            $p = isset($cols['prompt']) ? cellVal($sheet, $cols['prompt'], $r) : '';
            if ($p === '') continue;
            $speakingQuestions[] = [
                'prompt'      => $p,
                'time_limit'  => (int)((isset($cols['time_seconds']) ? cellVal($sheet, $cols['time_seconds'], $r) : '') ?: 60),
                'tips'        => isset($cols['tips']) ? cellVal($sheet, $cols['tips'], $r) : '',
            ];
        }

        $preview[] = [
            'row'         => $r,
            'type'        => 'homework',
            'student_code'=> $studentCode,
            'title'       => $title,
            'date'        => $date,
            'status'      => $status,
            'mcq_count'   => count($mcqQuestions),
            'writing_count'=> count($writingQuestions),
            'speaking_count'=> count($speakingQuestions),
        ];

        if ($confirm) {
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO homeworks (student_id, title, hw_date, status, media_url, media_instructions, reading_text, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $student_id, $title, $date, $status,
                    $listeningUrl  ?: null,
                    $listeningInst ?: null,
                    $readingText   ?: null,
                ]);
                $homework_id = (int)$pdo->lastInsertId();

                if ($mcqQuestions) {
                    $ins = $pdo->prepare("
                        INSERT INTO homework_mcq_questions
                               (homework_id, q_order, question_text, opt_a, opt_b, opt_c, opt_d, correct_option)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    foreach ($mcqQuestions as $i => $q) {
                        $ins->execute([
                            $homework_id, $i + 1,
                            $q['question_text'],
                            $q['option_a'],
                            $q['option_b'],
                            $q['option_c'] ?: null,
                            $q['option_d'] ?: null,
                            $q['correct_option'],
                        ]);
                    }
                }

                if ($writingQuestions) {
                    $ins = $pdo->prepare("
                        INSERT INTO homework_writing_questions (homework_id, q_order, prompt, min_sentences, focus)
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    foreach ($writingQuestions as $i => $q) {
                        $ins->execute([
                            $homework_id, $i + 1,
                            $q['prompt'],
                            $q['min_sentences'],
                            $q['focus_area'] ?: null,
                        ]);
                    }
                }

                if ($speakingQuestions) {
                    $ins = $pdo->prepare("
                        INSERT INTO homework_speaking_questions (homework_id, q_order, prompt, time_limit_seconds, tips)
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    foreach ($speakingQuestions as $i => $q) {
                        $ins->execute([
                            $homework_id, $i + 1,
                            $q['prompt'],
                            $q['time_limit'],
                            $q['tips'] ?: null,
                        ]);
                    }
                }

                $pdo->commit();
                $created['homeworks']++;
            } catch (Throwable $e) {
                $pdo->rollBack();
                $errors[] = "Row {$r}: DB error — " . $e->getMessage();
            }
        }

    } elseif ($type === 'scenario') {
        // ── Parse scenario fields ─────────────────────────────────────────
        $situation   = cellVal($sheet, 'F', $r);
        $prompt      = cellVal($sheet, 'G', $r);
        $timeLimit   = (int)(cellVal($sheet, 'H', $r) ?: 120);
        $keywords    = cellVal($sheet, 'I', $r);
        $modelAnswer = cellVal($sheet, 'J', $r);

        $preview[] = [
            'row'          => $r,
            'type'         => 'scenario',
            'student_code' => $studentCode,
            'title'        => $title,
            'date'         => $date,
            'status'       => $status,
            'time_limit'   => $timeLimit,
        ];

        if ($confirm) {
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO scenarios (student_id, title, sc_date, status, situation, prompt, time_limit_seconds, model_answer, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $student_id, $title, $date, $status,
                    $situation   ?: null,
                    $prompt      ?: null,
                    $timeLimit,
                    $modelAnswer ?: null,
                ]);
                $scenario_id = (int)$pdo->lastInsertId();

                if ($keywords !== '') {
                    $kwList = array_values(array_filter(array_map('trim', explode(',', $keywords))));
                    $ins    = $pdo->prepare("INSERT INTO scenario_keywords (scenario_id, keyword) VALUES (?, ?)");
                    foreach ($kwList as $kw) {
                        if ($kw !== '') $ins->execute([$scenario_id, $kw]);
                    }
                }

                $pdo->commit();
                $created['scenarios']++;
            } catch (Throwable $e) {
                $pdo->rollBack();
                $errors[] = "Row {$r}: DB error — " . $e->getMessage();
            }
        }
    }
}

json_ok([
    'preview' => $preview,
    'errors'  => $errors,
    'created' => $created,
    'confirm' => $confirm,
]);
