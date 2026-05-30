<?php
// api/teacher/generate-template.php — Generate and stream the Excel import template
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;

start_session();
if (empty($_SESSION['teacher_logged'])) {
    http_response_code(401);
    die('Not authenticated');
}

// ── Column definitions ────────────────────────────────────────────────────
// Each entry: [col_letter, header_label, width, section_color, applies_to]
// applies_to: 'both' | 'homework' | 'scenario'
$columns = [
  // Common
  ['A', 'type',                       12, 'FFFFFFFF', 'both'],
  ['B', 'student_code',               14, 'FFFFFFFF', 'both'],
  ['C', 'title',                      30, 'FFFFFFFF', 'both'],
  ['D', 'date (YYYY-MM-DD)',           16, 'FFFFFFFF', 'both'],
  ['E', 'status',                     12, 'FFFFFFFF', 'both'],
  // Listening / Scenario shared cols F-J
  ['F', 'listening_video_url  / situation',    30, 'FFD6E4F0', 'both'],
  ['G', 'listening_instructions / prompt',     30, 'FFD6E4F0', 'both'],
  ['H', 'reading_text / time_limit_sec',       30, 'FFDBF0D6', 'both'],
  ['I', 'scenario_keywords (comma) / mcq1_q',  30, 'FFFFF0CC', 'both'],
  ['J', 'model_answer / mcq1_a',               25, 'FFFFF0CC', 'both'],
  // MCQ 1 (homework only from here)
  ['K', 'mcq1_b',     20, 'FFFFF0CC', 'homework'],
  ['L', 'mcq1_c',     20, 'FFFFF0CC', 'homework'],
  ['M', 'mcq1_d',     20, 'FFFFF0CC', 'homework'],
  ['N', 'mcq1_correct (A/B/C/D)', 14, 'FFFFF0CC', 'homework'],
  // MCQ 2
  ['O', 'mcq2_q',     30, 'FFFFF0CC', 'homework'],
  ['P', 'mcq2_a',     20, 'FFFFF0CC', 'homework'],
  ['Q', 'mcq2_b',     20, 'FFFFF0CC', 'homework'],
  ['R', 'mcq2_c',     20, 'FFFFF0CC', 'homework'],
  ['S', 'mcq2_d',     20, 'FFFFF0CC', 'homework'],
  ['T', 'mcq2_correct', 14, 'FFFFF0CC', 'homework'],
  // MCQ 3
  ['U', 'mcq3_q',     30, 'FFFFF0CC', 'homework'],
  ['V', 'mcq3_a',     20, 'FFFFF0CC', 'homework'],
  ['W', 'mcq3_b',     20, 'FFFFF0CC', 'homework'],
  ['X', 'mcq3_c',     20, 'FFFFF0CC', 'homework'],
  ['Y', 'mcq3_d',     20, 'FFFFF0CC', 'homework'],
  ['Z', 'mcq3_correct', 14, 'FFFFF0CC', 'homework'],
  // MCQ 4
  ['AA','mcq4_q',     30, 'FFFFF0CC', 'homework'],
  ['AB','mcq4_a',     20, 'FFFFF0CC', 'homework'],
  ['AC','mcq4_b',     20, 'FFFFF0CC', 'homework'],
  ['AD','mcq4_c',     20, 'FFFFF0CC', 'homework'],
  ['AE','mcq4_d',     20, 'FFFFF0CC', 'homework'],
  ['AF','mcq4_correct', 14, 'FFFFF0CC', 'homework'],
  // MCQ 5
  ['AG','mcq5_q',     30, 'FFFFF0CC', 'homework'],
  ['AH','mcq5_a',     20, 'FFFFF0CC', 'homework'],
  ['AI','mcq5_b',     20, 'FFFFF0CC', 'homework'],
  ['AJ','mcq5_c',     20, 'FFFFF0CC', 'homework'],
  ['AK','mcq5_d',     20, 'FFFFF0CC', 'homework'],
  ['AL','mcq5_correct', 14, 'FFFFF0CC', 'homework'],
  // Writing 1
  ['AM','writing1_prompt',       35, 'FFF0D6F0', 'homework'],
  ['AN','writing1_min_sentences', 14, 'FFF0D6F0', 'homework'],
  ['AO','writing1_focus',        25, 'FFF0D6F0', 'homework'],
  // Writing 2
  ['AP','writing2_prompt',       35, 'FFF0D6F0', 'homework'],
  ['AQ','writing2_min_sentences', 14, 'FFF0D6F0', 'homework'],
  ['AR','writing2_focus',        25, 'FFF0D6F0', 'homework'],
  // Writing 3
  ['AS','writing3_prompt',       35, 'FFF0D6F0', 'homework'],
  ['AT','writing3_min_sentences', 14, 'FFF0D6F0', 'homework'],
  ['AU','writing3_focus',        25, 'FFF0D6F0', 'homework'],
  // Speaking 1
  ['AV','speaking1_prompt',      35, 'FFD6F0F0', 'homework'],
  ['AW','speaking1_time_seconds', 14, 'FFD6F0F0', 'homework'],
  ['AX','speaking1_tips',        30, 'FFD6F0F0', 'homework'],
  // Speaking 2
  ['AY','speaking2_prompt',      35, 'FFD6F0F0', 'homework'],
  ['AZ','speaking2_time_seconds', 14, 'FFD6F0F0', 'homework'],
  ['BA','speaking2_tips',        30, 'FFD6F0F0', 'homework'],
  // Speaking 3
  ['BB','speaking3_prompt',      35, 'FFD6F0F0', 'homework'],
  ['BC','speaking3_time_seconds', 14, 'FFD6F0F0', 'homework'],
  ['BD','speaking3_tips',        30, 'FFD6F0F0', 'homework'],
];

$ss = new Spreadsheet();

// ── Sheet 1: Template ─────────────────────────────────────────────────────
$sheet = $ss->getActiveSheet();
$sheet->setTitle('Template');

// Set headers in row 1
foreach ($columns as $col) {
    [$letter, $label, $width] = $col;
    $sheet->setCellValue($letter . '1', $label);
    $sheet->getColumnDimension($letter)->setWidth((float)$width);
}

// Style header row: bold, colored by section, centered, border bottom
foreach ($columns as $col) {
    [$letter, , , $bgColor] = $col;
    $cell = $letter . '1';
    $sheet->getStyle($cell)->applyFromArray([
        'font'      => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FF333333']],
        'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $bgColor]],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'wrapText' => true],
        'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFAAAAAA']]],
    ]);
}

// Add 3 example rows
$examples = [
    // Homework example
    ['homework','MD-3718','Class 3 - Numbers','2026-04-15','published',
     'https://youtu.be/example','Listen twice before answering','Reading text here...',
     'What does كتاب mean?','Book','Pen','School','Teacher','A',
     'How do you say 5?','خمسة','ثلاثة','سبعة','واحد','A',
     '','','','','','','','','','','','','','','','','','','','','',
     'Write 3 sentences about your school using numbers.','3','Focus on numbers',
     '','','','','','','','','',
     'Say the numbers 1-10 in Arabic.','60','Speak clearly, take your time.',
     '','','','','','','','','',
    ],
    // Scenario example
    ['scenario','MD-3718','Shopping Scenario','2026-04-16','published',
     'You are in a shop buying school supplies.','Ask the shopkeeper for 2 items by name and colour.','90',
     'أريد, من فضلك, كم السعر','Say: أريد كتاباً أحمر من فضلك',
     '','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','',
    ],
];

foreach ($examples as $rIdx => $row) {
    $r = $rIdx + 2;
    $cIdx = 0;
    foreach ($columns as $col) {
        $sheet->setCellValue($col[0] . $r, $row[$cIdx] ?? '');
        $cIdx++;
    }
}

// Freeze header row
$sheet->freezePane('A2');

// Add data validation for key columns (rows 2–100)
function addDropdown(object $sheet, string $colRange, string $formula): void {
    $validation = $sheet->getDataValidation($colRange);
    $validation->setType(DataValidation::TYPE_LIST);
    $validation->setShowDropDown(false);
    $validation->setErrorStyle(DataValidation::STYLE_WARNING);
    $validation->setAllowBlank(true);
    $validation->setShowErrorMessage(false);
    $validation->setFormula1($formula);
}

addDropdown($sheet, 'A2:A100', '"homework,scenario"');
addDropdown($sheet, 'E2:E100', '"published,draft"');
foreach (['N','T','Z','AF','AL'] as $correctCol) {
    addDropdown($sheet, $correctCol . '2:' . $correctCol . '100', '"A,B,C,D"');
}

// ── Sheet 2: Instructions ─────────────────────────────────────────────────
$instrSheet = $ss->createSheet();
$instrSheet->setTitle('Instructions');
$instrSheet->getColumnDimension('A')->setWidth(20);
$instrSheet->getColumnDimension('B')->setWidth(60);

$instructions = [
    ['Field', 'Description'],
    ['', ''],
    ['=== COMMON FIELDS (both types) ===', ''],
    ['type', '"homework" or "scenario" — required'],
    ['student_code', 'The student login code (e.g. MD-3718) — required'],
    ['title', 'Name of the homework or scenario — required'],
    ['date', 'Date in YYYY-MM-DD format (e.g. 2026-04-15) — required'],
    ['status', '"published" (student sees it) or "draft" (hidden) — required'],
    ['', ''],
    ['=== HOMEWORK FIELDS ===', ''],
    ['col F: listening_video_url', 'YouTube or direct audio URL for listening section (optional)'],
    ['col G: listening_instructions', 'Instructions for the listening section (optional)'],
    ['col H: reading_text', 'Reading passage text — can be long (optional)'],
    ['cols I–N: mcq1', 'First MCQ question: question text, options A B C D, correct answer (A/B/C/D)'],
    ['cols O–T: mcq2', 'Second MCQ question (optional — leave blank if not needed)'],
    ['cols U–Z thru AG–AL: mcq3-5', 'Additional MCQ questions (optional)'],
    ['cols AM–AO: writing1', 'First writing prompt + minimum sentences + focus area (optional)'],
    ['cols AP–AU: writing2, writing3', 'Additional writing prompts (optional)'],
    ['cols AV–AX: speaking1', 'First speaking prompt + time in seconds + tips (optional)'],
    ['cols AY–BD: speaking2, speaking3', 'Additional speaking prompts (optional)'],
    ['', ''],
    ['=== SCENARIO FIELDS ===', ''],
    ['col F: situation', 'Description of the scenario situation'],
    ['col G: prompt', 'What the student must say/do'],
    ['col H: time_limit_seconds', 'Recording time limit in seconds (e.g. 90)'],
    ['col I: keywords', 'Comma-separated keywords student should use (e.g. أريد, من فضلك)'],
    ['col J: model_answer', 'Example/model answer for teacher reference (optional)'],
    ['', ''],
    ['=== NOTES ===', ''],
    ['Multiple rows', 'Each row = one assignment. Mix homework and scenario rows freely.'],
    ['Empty optional fields', 'Leave optional columns blank — they will be ignored.'],
    ['Student must exist', 'The student_code must match an existing student in the system.'],
];

foreach ($instructions as $r => $row) {
    $instrSheet->setCellValue('A' . ($r + 1), $row[0]);
    $instrSheet->setCellValue('B' . ($r + 1), $row[1] ?? '');
}

// Bold header row of instructions
$instrSheet->getStyle('A1:B1')->applyFromArray([
    'font' => ['bold' => true, 'size' => 11],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF6C4ABF']],
    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
]);

// Set active sheet to Template
$ss->setActiveSheetIndex(0);

// ── Stream file ───────────────────────────────────────────────────────────
$filename = 'homework_template_' . date('Ymd') . '.xlsx';

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: max-age=0');

$writer = new Xlsx($ss);
$writer->save('php://output');
exit;
