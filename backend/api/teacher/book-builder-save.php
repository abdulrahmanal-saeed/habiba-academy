<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

interactive_books_ensure_schema($pdo);

$body = (array)(json_decode(file_get_contents('php://input'), true) ?: []);

$lessonId  = isset($body['lesson_id'])  ? (int)$body['lesson_id']  : 0;
$bookId    = isset($body['book_id'])    ? (int)$body['book_id']    : 0;
$titleEn   = trim((string)($body['title_en']   ?? ''));
$titleAr   = trim((string)($body['title_ar']   ?? ''));
$slug      = trim((string)($body['slug']       ?? ''));
$unitType  = trim((string)($body['unit_type']  ?? 'lesson'));
$status    = trim((string)($body['status']     ?? 'draft'));
$sortOrder = isset($body['sort_order']) ? (int)$body['sort_order'] : null;
$content   = $body['content'] ?? null; // array|null

$allowedStatus    = ['draft', 'published', 'archived'];
$allowedUnitTypes = ['lesson', 'unit', 'review', 'test'];

if (!in_array($status, $allowedStatus, true))        $status   = 'draft';
if (!in_array($unitType, $allowedUnitTypes, true))   $unitType = 'lesson';

$contentJson = $content !== null ? json_encode($content, JSON_UNESCAPED_UNICODE) : null;

if ($lessonId) {
    // Update existing lesson
    $stmt = $pdo->prepare("SELECT id, book_id FROM book_lessons WHERE id = ? LIMIT 1");
    $stmt->execute([$lessonId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing) json_err('Lesson not found', 404);

    $sets  = [];
    $binds = [];

    if ($titleEn !== '') { $sets[] = 'title_en = ?';    $binds[] = $titleEn; }
    if ($titleAr !== '') { $sets[] = 'title_ar = ?';    $binds[] = $titleAr; }
    if ($slug    !== '') { $sets[] = 'slug = ?';        $binds[] = $slug; }
    $sets[] = 'unit_type = ?';    $binds[] = $unitType;
    $sets[] = 'status = ?';       $binds[] = $status;
    if ($sortOrder !== null) { $sets[] = 'sort_order = ?'; $binds[] = $sortOrder; }
    if ($contentJson !== null) { $sets[] = 'content_json = ?'; $binds[] = $contentJson; }
    $sets[] = 'updated_at = NOW()';

    $binds[] = $lessonId;
    $pdo->prepare("UPDATE book_lessons SET " . implode(', ', $sets) . " WHERE id = ?")
        ->execute($binds);

    json_ok(['lesson_id' => $lessonId, 'updated' => true]);
}

// Create new lesson
if (!$bookId) json_err('book_id required for new lesson', 400);
if ($titleEn === '') json_err('title_en required', 400);

$stmt = $pdo->prepare("SELECT id FROM books WHERE id = ? LIMIT 1");
$stmt->execute([$bookId]);
if (!$stmt->fetch()) json_err('Book not found', 404);

// Auto-assign lesson_number
$stmt = $pdo->prepare("SELECT COALESCE(MAX(lesson_number), 0) + 1 FROM book_lessons WHERE book_id = ?");
$stmt->execute([$bookId]);
$lessonNumber = (int)$stmt->fetchColumn();

if ($slug === '') {
    $slug = 'lesson-' . $lessonNumber;
}

$stmt = $pdo->prepare("
    INSERT INTO book_lessons
        (book_id, lesson_number, unit_type, title_en, title_ar, slug, status, sort_order, content_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
");
$stmt->execute([
    $bookId,
    $lessonNumber,
    $unitType,
    $titleEn,
    $titleAr !== '' ? $titleAr : $titleEn,
    $slug,
    $status,
    $sortOrder ?? $lessonNumber,
    $contentJson,
]);

$newId = (int)$pdo->lastInsertId();
json_ok(['lesson_id' => $newId, 'created' => true, 'lesson_number' => $lessonNumber]);
