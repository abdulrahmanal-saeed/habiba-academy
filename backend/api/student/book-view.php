<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/interactive-books.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['student_id'])) json_err('Not authenticated', 401);

interactive_books_ensure_schema($pdo);
$studentId = (int)$_SESSION['student_id'];
$bookId = (int)($_GET['book_id'] ?? 0);
if (!$bookId) json_err('book_id required', 400);

$stmt = $pdo->prepare("SELECT * FROM books WHERE id = ? AND status = 'published' LIMIT 1");
$stmt->execute([$bookId]);
$book = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$book || !interactive_books_student_can_access($pdo, $studentId, $bookId)) {
    json_err('Book not found', 404);
}

interactive_books_touch_access($pdo, $studentId, $bookId);

$lessons = interactive_books_published_lessons($pdo, $bookId);

// Latest submission per lesson for this student.
$subStmt = $pdo->prepare("
    SELECT s.lesson_id, s.id, s.status, s.auto_score
    FROM book_lesson_submissions s
    JOIN (
        SELECT lesson_id, MAX(id) AS max_id
        FROM book_lesson_submissions
        WHERE student_id = ? AND book_id = ?
        GROUP BY lesson_id
    ) latest ON latest.lesson_id = s.lesson_id AND latest.max_id = s.id
");
$subStmt->execute([$studentId, $bookId]);
$subs = [];
foreach (($subStmt->fetchAll(PDO::FETCH_ASSOC) ?: []) as $row) {
    $subs[(int)$row['lesson_id']] = $row;
}

$doneStatuses = ['feedback_sent', 'completed'];
$continueLessonId = null;

$lessonsOut = array_map(static function (array $lesson) use ($subs, $doneStatuses, &$continueLessonId) {
    $id = (int)$lesson['id'];
    $sub = $subs[$id] ?? null;
    $status = $sub ? (string)$sub['status'] : null;
    if ($continueLessonId === null && ($status === null || !in_array($status, $doneStatuses, true))) {
        $continueLessonId = $id;
    }
    return [
        'id' => $id,
        'lesson_number' => (int)$lesson['lesson_number'],
        'unit_type' => (string)$lesson['unit_type'],
        'title_en' => (string)$lesson['title_en'],
        'title_ar' => (string)$lesson['title_ar'],
        'slug' => (string)$lesson['slug'],
        'submission_status' => $status,
        'auto_score' => $sub ? (float)$sub['auto_score'] : null,
        'submission_id' => $sub ? (int)$sub['id'] : null,
    ];
}, $lessons);

// All lessons done → resume at the last lesson; no lessons → null.
if ($continueLessonId === null && !empty($lessonsOut)) {
    $continueLessonId = (int)$lessonsOut[count($lessonsOut) - 1]['id'];
}

json_ok([
    'book' => [
        'id' => (int)$book['id'],
        'title_en' => (string)$book['title_en'],
        'title_ar' => (string)$book['title_ar'],
        'slug' => (string)$book['slug'],
        'level' => (string)$book['level'],
        'status' => (string)$book['status'],
        'price' => (float)$book['price'],
    ],
    'lessons' => $lessonsOut,
    'continue_lesson_id' => $continueLessonId,
]);
