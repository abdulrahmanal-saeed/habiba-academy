<?php
// api/teacher/brief-question-save.php — Manage academy brief form questions
declare(strict_types=1);
require_once __DIR__ . '/../../lib/helpers.php';
require_once __DIR__ . '/../../lib/student-briefs.php';
require_once __DIR__ . '/../../config/db.php';
start_session();

if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$action = trim((string)($_REQUEST['action'] ?? ''));

// ── LIST — GET, no CSRF needed ────────────────────────────────────────────────
if ($action === 'list') {
    $questions = brief_questions_load($pdo, true); // include hidden
    json_ok(['questions' => $questions]);
}

// All mutating actions require POST + CSRF
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
csrf_validate();

// ── TOGGLE HIDDEN ─────────────────────────────────────────────────────────────
if ($action === 'toggle_hidden') {
    $id = (int)($_POST['id'] ?? 0);
    if ($id < 1) json_err('Invalid question ID');

    $row = $pdo->prepare("SELECT id, is_hidden FROM brief_form_questions WHERE id = ? LIMIT 1");
    $row->execute([$id]);
    $q = $row->fetch();
    if (!$q) json_err('Question not found', 404);

    $newVal = $q['is_hidden'] ? 0 : 1;
    $pdo->prepare("UPDATE brief_form_questions SET is_hidden = ? WHERE id = ? LIMIT 1")
        ->execute([$newVal, $id]);

    json_ok(['id' => $id, 'is_hidden' => $newVal]);
}

// ── DELETE (custom questions only) ────────────────────────────────────────────
if ($action === 'delete') {
    $id = (int)($_POST['id'] ?? 0);
    if ($id < 1) json_err('Invalid question ID');

    $row = $pdo->prepare("SELECT id, is_core FROM brief_form_questions WHERE id = ? LIMIT 1");
    $row->execute([$id]);
    $q = $row->fetch();
    if (!$q)               json_err('Question not found', 404);
    if ((int)$q['is_core']) json_err('Core questions cannot be deleted. You can hide them instead.');

    $pdo->prepare("DELETE FROM brief_form_questions WHERE id = ? LIMIT 1")->execute([$id]);
    json_ok(['deleted' => $id]);
}

// ── UPDATE LABEL / PLACEHOLDER ────────────────────────────────────────────────
if ($action === 'update') {
    $id          = (int)($_POST['id'] ?? 0);
    $label       = trim((string)($_POST['label'] ?? ''));
    $placeholder = trim((string)($_POST['placeholder'] ?? ''));

    if ($id < 1)          json_err('Invalid question ID');
    if ($label === '')    json_err('Label is required');
    if (mb_strlen($label) > 400) $label = mb_substr($label, 0, 400);

    $row = $pdo->prepare("SELECT id FROM brief_form_questions WHERE id = ? LIMIT 1");
    $row->execute([$id]);
    if (!$row->fetch()) json_err('Question not found', 404);

    $pdo->prepare("UPDATE brief_form_questions SET label = ?, placeholder = ? WHERE id = ? LIMIT 1")
        ->execute([$label, $placeholder !== '' ? $placeholder : null, $id]);

    json_ok(['id' => $id, 'label' => $label]);
}

// ── ADD CUSTOM QUESTION ───────────────────────────────────────────────────────
if ($action === 'add') {
    $label       = trim((string)($_POST['label'] ?? ''));
    $fieldType   = trim((string)($_POST['field_type'] ?? 'text'));
    $placeholder = trim((string)($_POST['placeholder'] ?? ''));
    $options     = trim((string)($_POST['options'] ?? ''));
    $isRequired  = isset($_POST['is_required']) ? 1 : 0;
    $colSize     = trim((string)($_POST['col_size'] ?? 'col-md-6'));

    if ($label === '') json_err('Label is required');
    if (mb_strlen($label) > 400) $label = mb_substr($label, 0, 400);

    $allowedTypes = ['text', 'textarea', 'select', 'email', 'number'];
    if (!in_array($fieldType, $allowedTypes, true)) $fieldType = 'text';

    $allowedCols = ['col-12', 'col-md-6', 'col-md-4', 'col-md-3'];
    if (!in_array($colSize, $allowedCols, true)) $colSize = 'col-md-6';

    // Generate safe unique field_name from label
    $base = preg_replace('/[^a-z0-9]+/', '_', strtolower($label));
    $base = trim($base, '_');
    $base = substr($base ?: 'custom', 0, 80);
    $fieldName = $base;
    $suffix = 1;
    while (true) {
        $chk = $pdo->prepare("SELECT 1 FROM brief_form_questions WHERE field_name = ? LIMIT 1");
        $chk->execute([$fieldName]);
        if (!$chk->fetch()) break;
        $fieldName = $base . '_' . $suffix++;
    }

    // Max sort_order + 1
    $maxSort = (int)$pdo->query("SELECT COALESCE(MAX(sort_order),0) FROM brief_form_questions")->fetchColumn();

    $ins = $pdo->prepare("
        INSERT INTO brief_form_questions
            (sort_order, field_name, label, field_type, options, placeholder,
             is_required, is_hidden, is_core, col_size)
        VALUES (?,?,?,?,?,?,?,0,0,?)
    ");
    $ins->execute([
        $maxSort + 1,
        $fieldName,
        $label,
        $fieldType,
        $options !== '' ? $options : null,
        $placeholder !== '' ? $placeholder : null,
        $isRequired,
        $colSize,
    ]);
    $newId = (int)$pdo->lastInsertId();

    $row = $pdo->prepare("SELECT * FROM brief_form_questions WHERE id = ? LIMIT 1");
    $row->execute([$newId]);
    json_ok(['question' => $row->fetch()]);
}

json_err('Unknown action');
