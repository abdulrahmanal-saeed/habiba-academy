<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/ai-system.php';
require_once __DIR__ . '/../../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$limit = max(1, min(50, (int)($_GET['limit'] ?? 20)));

try {
    json_ok(['items' => ai_review_priority($pdo, $limit)]);
} catch (Throwable $e) {
    json_err('Failed to load review priority: ' . $e->getMessage(), 500);
}
