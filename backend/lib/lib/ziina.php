<?php
declare(strict_types=1);

require_once __DIR__ . '/payment-pages.php';
require_once __DIR__ . '/checkout-flow.php';

if (!function_exists('ziina_api_key')) {
    function ziina_api_key(): string
    {
        return trim((string)(getenv('ZIINA_API_KEY') ?: ''));
    }
}

if (!function_exists('ziina_api_base')) {
    function ziina_api_base(): string
    {
        return 'https://api-v2.ziina.com/api';
    }
}

if (!function_exists('ziina_price_to_fils')) {
    function ziina_price_to_fils(string $price): int
    {
        $clean = preg_replace('/[^0-9.]/', '', $price) ?? '';
        if ($clean === '') {
            return 0;
        }
        return (int)round(((float)$clean) * 100);
    }
}

if (!function_exists('ziina_create_payment_intent')) {
    function ziina_create_payment_intent(string $planSlug, array $plan, ?string $paymentRef = null): array
    {
        $apiKey = ziina_api_key();
        if ($apiKey === '') {
            throw new RuntimeException('Payment service is not configured.');
        }

        $amount = ziina_price_to_fils((string)$plan['price']);
        if ($amount <= 0) {
            throw new RuntimeException('Invalid payment amount.');
        }

        $paymentRef = $paymentRef ?: bin2hex(random_bytes(16));
        $baseUrl = rtrim((string)(getenv('APP_URL') ?: 'https://mshabibanabil.com'), '/');
        $refQuery = '&ref=' . rawurlencode($paymentRef);
        $payload = [
            'amount' => $amount,
            'currency_code' => 'AED',
            'message' => 'Habiba Nabil Arabic Academy - ' . (string)$plan['title'],
            'success_url' => $baseUrl . '/payment-status.php?status=success&plan=' . rawurlencode($planSlug) . $refQuery,
            'cancel_url' => $baseUrl . '/payment-status.php?status=cancelled&plan=' . rawurlencode($planSlug) . $refQuery,
            'failure_url' => $baseUrl . '/payment-status.php?status=failed&plan=' . rawurlencode($planSlug) . $refQuery,
            'test' => payment_setting('ziina_test_mode') === '1',
            'allow_tips' => false,
        ];

        $ch = curl_init(ziina_api_base() . '/payment_intent');
        if (!$ch) {
            throw new RuntimeException('Could not initialize payment request.');
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            CURLOPT_TIMEOUT => 20,
        ]);

        $raw = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $raw === '') {
            throw new RuntimeException($curlError !== '' ? $curlError : 'Empty payment response.');
        }

        $data = json_decode((string)$raw, true);
        if (!is_array($data)) {
            throw new RuntimeException('Invalid payment response.');
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            $message = (string)($data['message'] ?? $data['error'] ?? 'Payment request failed.');
            throw new RuntimeException($message);
        }

        $redirectUrl = (string)($data['redirect_url'] ?? $data['payment_url'] ?? $data['url'] ?? '');
        if ($redirectUrl === '') {
            throw new RuntimeException('Payment link was not returned.');
        }

        $data['redirect_url'] = $redirectUrl;
        return $data;
    }
}

if (!function_exists('ziina_create_checkout_payment_intent')) {
    function ziina_create_checkout_payment_intent(PDO $pdo, array $plan, array $order): array
    {
        $apiKey = ziina_api_key();
        if ($apiKey === '') {
            throw new RuntimeException('Payment service is not configured.');
        }

        $amount = (int)round(((float)$plan['amount_aed']) * 100);
        if ($amount <= 0) {
            throw new RuntimeException('Invalid payment amount.');
        }

        $checkoutRef = (string)$order['checkout_reference'];
        $baseUrl = rtrim((string)(getenv('APP_URL') ?: 'https://mshabibanabil.com'), '/');
        $refQuery = '&checkout_ref=' . rawurlencode($checkoutRef);
        $payload = [
            'amount' => $amount,
            'currency_code' => 'AED',
            'message' => 'Habiba Nabil Arabic Academy - ' . (string)$plan['title'],
            'success_url' => $baseUrl . '/payment-status.php?status=success&plan=' . rawurlencode((string)$plan['plan_key']) . $refQuery,
            'cancel_url' => $baseUrl . '/payment-status.php?status=cancelled&plan=' . rawurlencode((string)$plan['plan_key']) . $refQuery,
            'failure_url' => $baseUrl . '/payment-status.php?status=failed&plan=' . rawurlencode((string)$plan['plan_key']) . $refQuery,
            'test' => payment_setting('ziina_test_mode') === '1',
            'allow_tips' => false,
        ];

        $ch = curl_init(ziina_api_base() . '/payment_intent');
        if (!$ch) {
            throw new RuntimeException('Could not initialize payment request.');
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            CURLOPT_TIMEOUT => 20,
        ]);

        $raw = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $raw === '') {
            throw new RuntimeException($curlError !== '' ? $curlError : 'Empty payment response.');
        }

        $data = json_decode((string)$raw, true);
        if (!is_array($data)) {
            throw new RuntimeException('Invalid payment response.');
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            $message = (string)($data['message'] ?? $data['error'] ?? 'Payment request failed.');
            throw new RuntimeException($message);
        }

        $redirectUrl = (string)($data['redirect_url'] ?? $data['payment_url'] ?? $data['url'] ?? '');
        if ($redirectUrl === '') {
            throw new RuntimeException('Payment link was not returned.');
        }

        $data['redirect_url'] = $redirectUrl;
        $providerRef = (string)($data['id'] ?? $data['payment_intent_id'] ?? '');

        $pdo->prepare("UPDATE checkout_orders SET payment_reference = ?, payment_status = 'pending', updated_at = NOW() WHERE id = ?")
            ->execute([$providerRef !== '' ? $providerRef : null, (int)$order['id']]);
        $pdo->prepare("
            UPDATE payment_records
            SET provider_reference = ?,
                status = ?,
                raw_payload = ?,
                updated_at = NOW()
            WHERE checkout_order_id = ?
        ")->execute([
            $providerRef !== '' ? $providerRef : null,
            (string)($data['status'] ?? 'pending'),
            json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            (int)$order['id'],
        ]);

        checkout_audit($pdo, 'ziina_payment_intent_created', 'checkout_order', (int)$order['id'], null, [
            'provider_reference' => $providerRef,
            'status' => (string)($data['status'] ?? 'pending'),
        ], 'system');

        return $data;
    }
}

if (!function_exists('ziina_map_checkout_status')) {
    function ziina_map_checkout_status(string $routeStatus, string $providerStatus): string
    {
        $status = strtolower(trim($providerStatus !== '' ? $providerStatus : $routeStatus));
        if (in_array($status, ['completed', 'succeeded', 'success', 'paid', 'captured'], true)) {
            return 'paid';
        }
        if (in_array($status, ['failed', 'failure', 'cancelled', 'canceled', 'declined', 'expired'], true)) {
            return 'failed';
        }
        if ($routeStatus === 'cancelled' || $routeStatus === 'canceled') {
            return 'failed';
        }
        if ($routeStatus === 'failed') {
            return 'failed';
        }
        return 'pending_verification';
    }
}

if (!function_exists('ziina_update_checkout_status')) {
    function ziina_update_checkout_status(PDO $pdo, string $checkoutRef, string $routeStatus = ''): ?array
    {
        $order = checkout_find_order($pdo, $checkoutRef);
        if (!$order) {
            return null;
        }

        $stmt = $pdo->prepare("SELECT * FROM payment_records WHERE checkout_order_id = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([(int)$order['id']]);
        $record = $stmt->fetch() ?: [];

        $providerStatus = '';
        $intent = null;
        $providerRef = (string)($record['provider_reference'] ?? $order['payment_reference'] ?? '');
        if ($providerRef !== '') {
            try {
                $intent = ziina_get_payment_intent($providerRef);
                $providerStatus = (string)($intent['status'] ?? '');
            } catch (Throwable $ignored) {
                $providerStatus = (string)($record['status'] ?? '');
            }
        }

        $mapped = ziina_map_checkout_status(strtolower(trim($routeStatus)), $providerStatus);
        checkout_set_payment_status($pdo, (int)$order['id'], $mapped, 'ziina');

        $payload = $intent ?: ['route_status' => $routeStatus, 'provider_status' => $providerStatus];
        $pdo->prepare("
            UPDATE payment_records
            SET status = ?,
                raw_payload = ?,
                updated_at = NOW()
            WHERE checkout_order_id = ?
        ")->execute([
            $providerStatus !== '' ? $providerStatus : $mapped,
            json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            (int)$order['id'],
        ]);

        return [
            'order' => checkout_find_order($pdo, $checkoutRef),
            'provider_status' => $providerStatus,
            'mapped_status' => $mapped,
        ];
    }
}

if (!function_exists('ziina_get_payment_intent')) {
    function ziina_get_payment_intent(string $intentId): array
    {
        $apiKey = ziina_api_key();
        if ($apiKey === '') {
            throw new RuntimeException('Payment service is not configured.');
        }

        $ch = curl_init(ziina_api_base() . '/payment_intent/' . rawurlencode($intentId));
        if (!$ch) {
            throw new RuntimeException('Could not initialize payment status request.');
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey],
            CURLOPT_TIMEOUT => 20,
        ]);

        $raw = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $raw === '') {
            throw new RuntimeException($curlError !== '' ? $curlError : 'Empty payment status response.');
        }

        $data = json_decode((string)$raw, true);
        if (!is_array($data)) {
            throw new RuntimeException('Invalid payment status response.');
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            $message = (string)($data['message'] ?? $data['error'] ?? 'Payment status request failed.');
            throw new RuntimeException($message);
        }

        return $data;
    }
}

if (!function_exists('ziina_ensure_payment_table')) {
    function ziina_ensure_payment_table(PDO $pdo): void
    {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS payment_intents (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                payment_ref VARCHAR(64) NOT NULL UNIQUE,
                provider VARCHAR(32) NOT NULL DEFAULT 'ziina',
                provider_intent_id VARCHAR(128) NULL,
                plan_slug VARCHAR(32) NOT NULL,
                plan_title VARCHAR(190) NOT NULL,
                amount INT UNSIGNED NOT NULL,
                currency_code CHAR(3) NOT NULL DEFAULT 'AED',
                status VARCHAR(64) NOT NULL DEFAULT 'created',
                redirect_url TEXT NULL,
                raw_response JSON NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_provider_intent_id (provider_intent_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }
}

if (!function_exists('ziina_create_payment_ref')) {
    function ziina_create_payment_ref(PDO $pdo, string $planSlug, array $plan): string
    {
        ziina_ensure_payment_table($pdo);
        $ref = bin2hex(random_bytes(16));
        $stmt = $pdo->prepare("
            INSERT INTO payment_intents (payment_ref, plan_slug, plan_title, amount, currency_code, status)
            VALUES (?, ?, ?, ?, 'AED', 'created')
        ");
        $stmt->execute([$ref, $planSlug, (string)$plan['title'], ziina_price_to_fils((string)$plan['price'])]);
        return $ref;
    }
}

if (!function_exists('ziina_update_payment_record')) {
    function ziina_update_payment_record(PDO $pdo, string $ref, array $intent): void
    {
        ziina_ensure_payment_table($pdo);
        $stmt = $pdo->prepare("
            UPDATE payment_intents
            SET provider_intent_id = ?, status = ?, redirect_url = ?, raw_response = ?
            WHERE payment_ref = ?
        ");
        $stmt->execute([
            (string)($intent['id'] ?? ''),
            (string)($intent['status'] ?? 'unknown'),
            (string)($intent['redirect_url'] ?? ''),
            json_encode($intent, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $ref,
        ]);
    }
}

if (!function_exists('ziina_find_payment_by_ref')) {
    function ziina_find_payment_by_ref(PDO $pdo, string $ref): ?array
    {
        ziina_ensure_payment_table($pdo);
        $stmt = $pdo->prepare('SELECT * FROM payment_intents WHERE payment_ref = ? LIMIT 1');
        $stmt->execute([$ref]);
        $row = $stmt->fetch();
        return is_array($row) ? $row : null;
    }
}
