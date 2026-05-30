<?php
declare(strict_types=1);
require_once __DIR__ . '/../../lib/lib/helpers.php';
require_once __DIR__ . '/../../lib/lib/checkout-flow.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);

checkout_ensure_tables($pdo);
$rows = checkout_valid_plans($pdo);

$FEATURES = [
    'single'  => ['درس واحد مدته ٩٠ دقيقة', 'جلسة فردية مع الأستاذة حبيبة', 'مناهج مخصصة لمستواك', 'تسجيل الجلسة'],
    'monthly' => ['٨ جلسات (١٢ ساعة شهرياً)', 'متابعة أسبوعية لتقدمك', 'واجبات وتصحيح مخصص', 'تسجيل كل الجلسات', 'مجتمع طلاب خاص'],
    'bundle'  => ['٢٠ جلسة (٣٠ ساعة)', 'أفضل قيمة للمال', 'منهج شامل ومتكامل', 'متابعة يومية عند الحاجة', 'تقرير تقدم مفصّل', 'شهادة إتمام المستوى'],
];

$PERIOD = [
    'single'  => 'جلسة',
    'monthly' => 'شهر',
    'bundle'  => 'حزمة',
];

$items = array_map(static function (array $p) use ($FEATURES, $PERIOD): array {
    $key = (string)$p['plan_key'];
    return [
        'id'          => (int)$p['id'],
        'slug'        => $key,
        'name'        => (string)$p['title'],
        'description' => (string)($p['description'] ?? ''),
        'priceAed'    => (int)round((float)$p['amount_aed'] * 100),
        'periodLabel' => $PERIOD[$key] ?? 'شهر',
        'features'    => $FEATURES[$key] ?? [],
        'isPopular'   => $key === 'monthly',
        'ctaLabel'    => $key === 'monthly' ? 'الأكثر طلباً' : null,
    ];
}, $rows);

json_ok(['items' => $items]);
