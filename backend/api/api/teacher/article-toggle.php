<?php
declare(strict_types=1);
require_once __DIR__ . '/../../teacher/_guard.php';

csrf_validate();

$id     = (int)($_POST['id'] ?? 0);
$status = in_array(($_POST['status'] ?? ''), ['published', 'draft'], true) ? $_POST['status'] : '';

if ($id <= 0 || $status === '') json_err('Invalid input.', 422);

$st = $pdo->prepare("UPDATE articles SET status = ?, updated_at = NOW() WHERE id = ?");
$st->execute([$status, $id]);

json_ok(['id' => $id, 'status' => $status]);
