<?php
declare(strict_types=1);

require_once __DIR__ . '/track_event.php';

try {
    analytics_bootstrap_request();
} catch (Throwable $e) {
    // Analytics must never block public pages.
}
