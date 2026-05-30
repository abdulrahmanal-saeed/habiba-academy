<?php
declare(strict_types=1);

require_once __DIR__ . '/settings.php';
require_once __DIR__ . '/helpers.php';

if (!function_exists('payment_default_settings')) {
    function payment_default_settings(): array
    {
        return [
            'pricing_enabled' => '1',
            'ziina_test_mode' => '0',
            'pricing_single_title' => 'Single Session',
            'pricing_single_badge' => 'Launch Price',
            'pricing_single_price' => 'AED 80',
            'pricing_single_original_price' => 'AED 120',
            'pricing_single_subtitle' => 'per session - 90 minutes',
            'pricing_single_description' => 'One 90-minute 1-on-1 lesson. Perfect for trying it out.',
            'pricing_single_features' => "Live 1-on-1 with your tutor\nPersonalized lesson plan\nSession notes shared after class",
            'pricing_single_paypal_url' => '',
            'pricing_monthly_title' => 'Monthly Plan',
            'pricing_monthly_badge' => 'Most Popular',
            'pricing_monthly_price' => 'AED 640',
            'pricing_monthly_original_price' => 'AED 960',
            'pricing_monthly_subtitle' => 'per month - 8 sessions - 12 hrs total',
            'pricing_monthly_description' => '2 sessions per week, every week of the month.',
            'pricing_monthly_features' => "8 x 90-minute live sessions\nConsistent weekly schedule\nProgress tracking\nHomework & practice materials",
            'pricing_monthly_paypal_url' => '',
            'pricing_bundle_title' => '30-Hour Bundle',
            'pricing_bundle_badge' => 'Launch Price',
            'pricing_bundle_price' => 'AED 1600',
            'pricing_bundle_original_price' => 'AED 2400',
            'pricing_bundle_subtitle' => 'one-time - 20 sessions - 30 hrs total',
            'pricing_bundle_description' => '20 sessions. Use them at your own pace.',
            'pricing_bundle_features' => "20 x 90-minute live sessions\nFlexible scheduling\nBest value per hour\nNever expires",
            'pricing_bundle_paypal_url' => '',
            'pricing_note' => 'Launch prices are available for a limited time only. Once the introductory period ends, prices will return to their original rates. Lock in your spot today.',
            'page_terms_content' => payment_default_terms(),
            'page_privacy_content' => payment_default_privacy(),
            'page_refund_content' => payment_default_refund(),
        ];
    }
}

if (!function_exists('payment_setting')) {
    function payment_setting(string $key): string
    {
        $defaults = payment_default_settings();
        return (string)get_setting($key, $defaults[$key] ?? '');
    }
}

if (!function_exists('payment_update_settings')) {
    function payment_update_settings(array $values): bool
    {
        $ok = true;
        foreach (array_keys(payment_default_settings()) as $key) {
            if (array_key_exists($key, $values)) {
                $ok = update_setting($key, trim((string)$values[$key])) && $ok;
            }
        }
        return $ok;
    }
}

if (!function_exists('payment_plans')) {
    function payment_plans(): array
    {
        $plans = [];
        foreach (['single', 'monthly', 'bundle'] as $slug) {
            $features = preg_split('/\R/u', payment_setting('pricing_' . $slug . '_features')) ?: [];
            $plans[$slug] = [
                'slug' => $slug,
                'title' => payment_setting('pricing_' . $slug . '_title'),
                'badge' => payment_setting('pricing_' . $slug . '_badge'),
                'price' => payment_setting('pricing_' . $slug . '_price'),
                'original_price' => payment_setting('pricing_' . $slug . '_original_price'),
                'subtitle' => payment_setting('pricing_' . $slug . '_subtitle'),
                'description' => payment_setting('pricing_' . $slug . '_description'),
                'features' => array_values(array_filter(array_map('trim', $features), static fn($v) => $v !== '')),
                'paypal_url' => payment_setting('pricing_' . $slug . '_paypal_url'),
                'popular' => $slug === 'monthly',
            ];
        }
        return $plans;
    }
}

if (!function_exists('payment_policy_content')) {
    function payment_policy_content(string $slug): string
    {
        $map = [
            'terms' => 'page_terms_content',
            'privacy' => 'page_privacy_content',
            'refund' => 'page_refund_content',
        ];
        return payment_setting($map[$slug] ?? 'page_terms_content');
    }
}

if (!function_exists('payment_render_text')) {
    function payment_render_text(string $text): string
    {
        return nl2br(h($text));
    }
}

if (!function_exists('payment_default_terms')) {
    function payment_default_terms(): string
    {
        return <<<'TEXT'
Terms of Service
Effective date: 2025

By booking a session or purchasing any plan, you agree to the following terms. Please read them carefully before making a payment.

1. Services
We offer online Arabic language tutoring for non-native speakers, delivered via live 1-on-1 video sessions. All sessions are conducted by a qualified Arabic tutor based in the UAE.

2. Booking & cancellation
Sessions must be booked in advance. Once confirmed, the following policy applies:

CANCELLATION POLICY
More than 24 hours before the session - You may cancel or reschedule freely at no charge. We are happy to find a time that works better for you.

Less than 24 hours before the session - The session will be considered used and deducted from your plan or balance. We kindly ask that you notify us as early as possible out of respect for the tutor's time.

Tutor cancellation - In the rare event that your tutor needs to cancel, you will receive a full reschedule at a time of your choice, or a complete refund - whichever you prefer.

3. Payments
All prices are in UAE Dirhams (AED).
Payment is required before sessions are confirmed.
Launch prices are temporary and subject to change without prior notice.
The 30-Hour Bundle never expires once purchased.

4. Student conduct
Students are expected to attend on time and engage respectfully. We reserve the right to end a session if conduct is inappropriate, without refund.

5. Intellectual property
All materials and lesson notes shared during sessions are for personal use only and may not be reproduced or shared.

6. Contact
Email: info@mshabibanabil.com
WhatsApp: +971 50 929 8326
TEXT;
    }
}

if (!function_exists('payment_default_privacy')) {
    function payment_default_privacy(): string
    {
        return <<<'TEXT'
Privacy Policy
Effective date: 2025

We respect your privacy. This policy explains what data we collect, why we collect it, and how we protect it.

1. What we collect
Name and email address (for booking and communication)
Payment information (processed securely by our payment provider - we never store card details)
Session preferences and learning goals (to personalise your lessons)

2. How we use your data
To confirm bookings and send session reminders
To improve your learning experience
To process payments securely
To respond to your inquiries

3. Data sharing
We do not sell, rent, or share your personal data with third parties, except as required to process payments or as required by law.

4. Data retention
We retain your data for as long as you are an active student or as required by law. You may request deletion at any time by contacting us.

5. Cookies
Our website may use basic cookies to ensure correct functionality. We do not use tracking or advertising cookies.

6. Your rights
Access the personal data we hold about you
Request correction of inaccurate data
Request deletion of your data
Withdraw consent at any time

7. Contact
Email: info@mshabibanabil.com
WhatsApp: +971 50 929 8326
TEXT;
    }
}

if (!function_exists('payment_default_refund')) {
    function payment_default_refund(): string
    {
        return <<<'TEXT'
Refund Policy
Effective date: 2025

We want you to feel confident booking with us. Here is our straightforward refund policy.

Single sessions
Full refund if cancelled more than 24 hours before the session.
No refund for cancellations made less than 24 hours before - the session will be considered used.
If the tutor cancels, you receive a full refund or a free rescheduled session - your choice.

Monthly plan
Full refund available within 48 hours of your first session if you are unsatisfied.
After the first session, refunds are not available for remaining sessions in the month.
Unused sessions do not carry over to the next month.

30-Hour Bundle
Full refund available within 48 hours of your first session if you are unsatisfied.
After the first session, a partial refund may be issued for unused sessions at the single-session rate (AED 29 per session during launch pricing).
Sessions never expire - take your time.

How to request a refund
Email us with your name, booking reference, and reason. We aim to respond within 2 business days. Approved refunds are processed within 5-10 business days.

Contact
Email: info@mshabibanabil.com
WhatsApp: +971 50 929 8326
TEXT;
    }
}
