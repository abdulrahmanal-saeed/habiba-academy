<?php
declare(strict_types=1);
require_once __DIR__ . '/../../../lib/lib/helpers.php';
require_once __DIR__ . '/../../../lib/lib/ai-governance.php';
require_once __DIR__ . '/../../../config/config/db.php';
start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);
if (empty($_SESSION['teacher_logged'])) json_err('Not authenticated', 401);

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$articleType = trim((string)($input['article_type'] ?? 'Speaking problem article'));
$audience    = trim((string)($input['audience']     ?? 'Adults learning Arabic'));
$keywords    = trim((string)($input['keywords']     ?? 'Arabic speaking, learn Arabic'));
$notes       = trim((string)($input['notes']        ?? ''));
$language    = trim((string)($input['language']     ?? 'English'));

try {
    $system = <<<SYSTEM
You are a senior content strategist for Habiba Nabil Arabic Academy.
Generate useful educational marketing articles for non-native Arabic learners.
Rules:
- Output valid JSON only.
- The article must be practical, clear, and trustworthy.
- Do not invent fake testimonials or unverifiable claims.
- Keep the CTA soft and relevant.
- Status is draft only. Never publish automatically.
SYSTEM;

    $user = <<<USER
Generate a draft article.

Article type: {$articleType}
Audience: {$audience}
Target language: {$language}
Keywords: {$keywords}
Teacher notes: {$notes}

Return ONLY this JSON:
{
  "title": "Article title",
  "english_title": "English title if different, otherwise same title",
  "slug": "seo-friendly-slug",
  "seo_meta_title": "SEO meta title under 60 chars",
  "seo_meta_description": "SEO meta description under 155 chars",
  "excerpt": "Short excerpt",
  "body": "Full article body with headings and useful practical advice",
  "cta": "Short CTA paragraph",
  "target_audience": "Who this article is for",
  "keywords": ["keyword 1", "keyword 2"],
  "suggested_internal_links": ["Pricing page", "Level test page"],
  "cover_image_prompt": "Prompt for a warm realistic cover image"
}
USER;

    $aiCall  = ai_governance_logged_claude_json($pdo, 'generate_article', null, $system, $user, 3500, 'Generate article draft');
    $article = $aiCall['result'];

    foreach (['title','excerpt','body','seo_meta_title','seo_meta_description','cta','cover_image_prompt'] as $key) {
        if (!isset($article[$key])) $article[$key] = '';
    }
    if (!empty($article['cta'])) {
        $article['body'] = trim((string)$article['body']) . "\n\n" . trim((string)$article['cta']);
    }
    $article['status'] = 'draft';

    json_ok(['article' => $article, 'ai_request_id' => $aiCall['request_id']]);
} catch (RuntimeException $e) {
    ai_governance_json_error($e);
}
