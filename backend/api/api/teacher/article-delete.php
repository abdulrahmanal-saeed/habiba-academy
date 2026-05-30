<?php
declare(strict_types=1);
require_once __DIR__ . '/../../teacher/_guard.php';

csrf_validate();

$id = (int)($_POST['id'] ?? 0);
if ($id <= 0) json_err('Invalid ID.', 422);

$st = $pdo->prepare('SELECT cover_image FROM articles WHERE id = ? LIMIT 1');
$st->execute([$id]);
$row = $st->fetch(PDO::FETCH_ASSOC);
if (!$row) json_err('Not found.', 404);

if ($row['cover_image']) {
    $path = __DIR__ . '/../../' . $row['cover_image'];
    if (file_exists($path)) @unlink($path);
}

$pdo->prepare('DELETE FROM articles WHERE id = ?')->execute([$id]);
header('Location: /teacher/articles.php?deleted=1');
exit;
