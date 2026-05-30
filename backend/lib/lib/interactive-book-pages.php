<?php
declare(strict_types=1);

function interactive_book_static_pages(): array
{
    return [
        'cover' => [
            'type' => 'cover',
            'title' => 'Arabic for Daily Life',
            'subtitle_ar' => 'العربية للحياة اليومية',
            'subtitle_en' => 'Beginner Level - A0 to A1',
            'brand' => 'Habiba Nabil Arabic Academy',
            'feature_line' => 'Interactive Book • 12 Lessons • Reviews • Audio • Speaking Tasks',
            'footer' => 'Practical Arabic for real life situations',
            'next' => 'thank-you',
        ],
        'thank-you' => [
            'type' => 'info',
            'title_ar' => 'شكرًا لشرائك هذا الكتاب',
            'subtitle_en' => 'Thank you for purchasing this book',
            'body_ar' => [
                'أهلاً بك في Arabic for Daily Life.',
                'يسعدني جدًا أن تبدأ هذه الرحلة معي.',
                'صممت هذا الكتاب ليكون عمليًا، بسيطًا، وتفاعليًا حتى يساعدك على استخدام العربية في حياتك اليومية بثقة.',
                'أتمنى لك تعلّمًا ممتعًا وتقدّمًا واضحًا خطوة بخطوة.',
                'مع خالص التقدير،',
                'Habiba Nabil',
            ],
            'prev' => 'cover',
            'next' => 'benefit',
        ],
        'benefit' => [
            'type' => 'steps',
            'title_ar' => 'كيف تستفيد من هذا الكتاب؟',
            'subtitle_en' => 'How to benefit from this book',
            'steps' => [
                'ابدأ بالترتيب من الدرس الأول حتى الأخير.',
                'استمع إلى الصوت وكرّر الكلمات والجمل بصوت عالٍ.',
                'أكمِل الأنشطة التفاعلية بعد كل درس.',
                'سجّل مهام الـ Speaking ولا تخف من الخطأ.',
                'اكتب الإجابات بنفسك ثم راجع الفيدباك.',
                'راجع الكلمات الضعيفة باستمرار.',
                'أعد الدروس المهمة قبل الـ Final Review.',
            ],
            'highlight_ar' => 'كلما استخدمت الكتاب بانتظام، زادت ثقتك في التحدث بالعربية.',
            'prev' => 'thank-you',
            'next' => 'learn',
        ],
        'learn' => [
            'type' => 'grid',
            'title_ar' => 'ماذا ستتعلم في هذا الكتاب؟',
            'subtitle_en' => 'What will you learn in this book?',
            'items' => [
                ['icon' => 'bi-chat-dots', 'text' => 'التعارف والمعلومات الشخصية'],
                ['icon' => 'bi-123', 'text' => 'الأرقام والعمر ورقم الهاتف'],
                ['icon' => 'bi-people', 'text' => 'العائلة'],
                ['icon' => 'bi-cup-straw', 'text' => 'الطعام والمشروبات'],
                ['icon' => 'bi-bag', 'text' => 'التسوق والأسعار'],
                ['icon' => 'bi-palette', 'text' => 'الألوان والأشياء'],
                ['icon' => 'bi-house', 'text' => 'البيت والأماكن'],
                ['icon' => 'bi-clock', 'text' => 'الوقت والروتين اليومي'],
                ['icon' => 'bi-signpost', 'text' => 'الاتجاهات'],
                ['icon' => 'bi-briefcase', 'text' => 'العمل والوظائف'],
                ['icon' => 'bi-heart-pulse', 'text' => 'الصحة والجسم'],
                ['icon' => 'bi-chat-quote', 'text' => 'محادثة يومية كاملة'],
            ],
            'highlight_ar' => 'الهدف: أن تتحدث العربية في مواقف الحياة اليومية بثقة.',
            'prev' => 'benefit',
            'next' => 'works',
        ],
        'works' => [
            'type' => 'steps',
            'title_ar' => 'كيف يعمل هذا الكتاب؟',
            'subtitle_en' => 'How does this book work?',
            'steps' => [
                'تعلّم الكلمات مع الصوت',
                'اقرأ الجمل المفيدة',
                'حلّ الأنشطة التفاعلية',
                'أكمِل الـ Writing Task',
                'سجّل الـ Speaking Task',
                'استقبل الفيدباك من المدرّس',
                'راجع وتقدّم إلى الدرس التالي',
            ],
            'highlight_ar' => 'يمكنك استخدام الصوت والـ QR، وستصل إجاباتك إلى المدرّس للتصحيح والمتابعة.',
            'prev' => 'learn',
            'next' => 'contents',
        ],
        'contents' => [
            'type' => 'contents',
            'title_ar' => 'محتوى الكتاب',
            'subtitle_en' => 'Book Contents',
            'prev' => 'works',
            'next' => 'sounds',
        ],
        'sounds' => [
            'type' => 'info',
            'title_ar' => 'بداية سريعة للأصوات والحروف العربية',
            'subtitle_en' => 'Arabic Sounds & Letters Quick Start',
            'body_ar' => [
                'استمع إلى الكلمات بتركيز، ثم كرّرها بصوت واضح.',
                'لا تحتاج إلى إتقان كل شيء من أول مرة؛ الهدف هو التدرّب خطوة بخطوة.',
                'انتبه إلى الحروف التي لا توجد في لغتك، وسجّل الكلمات الصعبة في قائمة الكلمات الضعيفة.',
            ],
            'prev' => 'contents',
            'next_lesson' => true,
        ],
        'end-thank-you' => [
            'type' => 'ending',
            'title_ar' => 'أحسنت! لقد أنهيت الكتاب',
            'subtitle_en' => 'You completed the book',
            'body_ar' => [
                'شكرًا لك على إتمام Arabic for Daily Life.',
                'إكمال هذا الكتاب ليس النهاية، بل بداية جديدة لرحلتك مع العربية.',
                'استمر في المراجعة، وتكلم أكثر، واستخدم ما تعلمته كل يوم.',
                'كل خطوة صغيرة تصنع فرقًا كبيرًا.',
                'أفخر بك، وأتمنى لك مزيدًا من النجاح.',
            ],
            'next' => 'final-word',
        ],
        'final-word' => [
            'type' => 'ending',
            'title_ar' => 'كلمة أخيرة',
            'body_ar' => [
                'تذكّر: العربية لا تُتعلَّم بالحفظ فقط، بل بالاستخدام المستمر.',
                'استمر في استخدام الكلمات والجمل في حياتك اليومية، وارجع إلى الدروس كلما احتجت للمراجعة.',
            ],
            'prev' => 'end-thank-you',
            'next' => 'back-cover',
        ],
        'back-cover' => [
            'type' => 'back-cover',
            'title' => 'Arabic for Daily Life',
            'subtitle_ar' => 'العربية للحياة اليومية',
            'subtitle_en' => 'Beginner Level - A0 to A1',
            'section_title_ar' => 'عن الكتاب',
            'blurb_ar' => 'كتاب عملي وتفاعلي لمتعلمي العربية من غير الناطقين بها. يحتوي على 12 درسًا، مراجعات، صوتيات، مهام كتابة وتحدث، ونظام تعلم يساعدك على استخدام العربية في الحياة اليومية خطوة بخطوة.',
            'features' => ['12 Lessons', 'Reviews & Final Review', 'Audio & QR Support', 'Writing & Speaking Tasks', 'Teacher Feedback Ready'],
            'quote' => 'Learn Arabic for real life, one step at a time.',
            'brand' => 'Habiba Nabil Arabic Academy',
            'prev' => 'final-word',
        ],
    ];
}

function interactive_book_pages_ensure_schema(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_page_views (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            book_id INT NOT NULL,
            page_key VARCHAR(80) NOT NULL,
            viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            UNIQUE KEY uniq_book_page_view (student_id, book_id, page_key),
            KEY idx_book_page_views_student (student_id, book_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function interactive_book_mark_page_viewed(PDO $pdo, int $studentId, int $bookId, string $pageKey): void
{
    $stmt = $pdo->prepare("
        INSERT INTO book_page_views (student_id, book_id, page_key, viewed_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE updated_at = NOW()
    ");
    $stmt->execute([$studentId, $bookId, $pageKey]);
}

function interactive_book_is_completed(PDO $pdo, int $studentId, int $bookId): bool
{
    $stmt = $pdo->prepare("
        SELECT s.status
        FROM book_lesson_submissions s
        JOIN book_lessons l ON l.id = s.lesson_id
        WHERE s.student_id = ? AND s.book_id = ? AND l.slug = 'final-review-beginner'
        ORDER BY s.id DESC
        LIMIT 1
    ");
    $stmt->execute([$studentId, $bookId]);
    return in_array((string)($stmt->fetchColumn() ?: ''), ['feedback_sent', 'completed'], true);
}

function interactive_book_final_review_submission_id(PDO $pdo, int $studentId, int $bookId): int
{
    $stmt = $pdo->prepare("
        SELECT s.id
        FROM book_lesson_submissions s
        JOIN book_lessons l ON l.id = s.lesson_id
        WHERE s.student_id = ? AND s.book_id = ? AND l.slug = 'final-review-beginner'
        ORDER BY s.id DESC
        LIMIT 1
    ");
    $stmt->execute([$studentId, $bookId]);
    return (int)($stmt->fetchColumn() ?: 0);
}

function interactive_book_first_lesson_id(array $lessons): int
{
    foreach ($lessons as $lesson) {
        if ((string)($lesson['unit_type'] ?? 'lesson') === 'lesson' && (int)$lesson['lesson_number'] === 1) {
            return (int)$lesson['id'];
        }
    }
    return (int)($lessons[0]['id'] ?? 0);
}

function interactive_book_continue_lesson_id(PDO $pdo, int $studentId, array $lessons): int
{
    foreach ($lessons as $lesson) {
        $submission = interactive_books_current_submission($pdo, $studentId, (int)$lesson['id']);
        if (!$submission || !in_array((string)$submission['status'], ['submitted', 'feedback_sent', 'completed'], true)) {
            return (int)$lesson['id'];
        }
    }
    return (int)($lessons[array_key_last($lessons)]['id'] ?? 0);
}

function interactive_book_render_nav(int $bookId, array $page, array $lessons): void
{
    $firstLessonId = interactive_book_first_lesson_id($lessons);
    ?>
    <div class="book-page-nav d-flex gap-2 flex-wrap justify-content-center mt-4">
      <?php if (!empty($page['prev'])): ?>
        <a class="btn btn-ghost btn-sm" href="/student-book-view.php?book_id=<?= $bookId ?>&page=<?= h((string)$page['prev']) ?>"><i class="bi bi-arrow-left"></i> Previous</a>
      <?php endif; ?>
      <a class="btn btn-ghost btn-sm" href="/student-book-view.php?book_id=<?= $bookId ?>&page=contents"><i class="bi bi-list-ul"></i> Contents</a>
      <?php if (!empty($page['next_lesson']) && $firstLessonId): ?>
        <a class="btn btn-app btn-sm" href="/student-book-lesson.php?lesson_id=<?= $firstLessonId ?>">Start Lesson 1</a>
      <?php elseif (!empty($page['next'])): ?>
        <a class="btn btn-app btn-sm" href="/student-book-view.php?book_id=<?= $bookId ?>&page=<?= h((string)$page['next']) ?>">Next <i class="bi bi-arrow-right"></i></a>
      <?php endif; ?>
    </div>
    <?php
}

function interactive_book_render_page(PDO $pdo, int $studentId, int $bookId, array $book, array $lessons, string $pageId, bool $completed): void
{
    $pages = interactive_book_static_pages();
    $page = $pages[$pageId] ?? $pages['cover'];
    $continueLessonId = interactive_book_continue_lesson_id($pdo, $studentId, $lessons);
    $firstLessonId = interactive_book_first_lesson_id($lessons);
    $finalReviewSubmissionId = interactive_book_final_review_submission_id($pdo, $studentId, $bookId);
    ?>
    <section class="book-page-shell <?= h('book-' . (string)$page['type']) ?> <?= h('book-' . (string)$page['type'] . '-page') ?>">
      <div class="book-ornament-title text-center">
        <div class="book-logo"><i class="bi bi-book"></i></div>
        <?php if (($page['type'] ?? '') === 'cover' || ($page['type'] ?? '') === 'back-cover'): ?>
          <div class="book-brand"><?= h((string)($page['brand'] ?? 'Habiba Nabil Arabic Academy')) ?></div>
          <h1 dir="ltr"><?= h((string)$page['title']) ?></h1>
          <div class="book-ribbon" dir="rtl"><?= h((string)$page['subtitle_ar']) ?></div>
          <div class="book-level"><?= h((string)$page['subtitle_en']) ?></div>
        <?php else: ?>
          <h1 dir="rtl"><?= h((string)($page['title_ar'] ?? '')) ?></h1>
          <?php if (!empty($page['subtitle_en'])): ?><div class="book-subtitle" dir="ltr"><?= h((string)$page['subtitle_en']) ?></div><?php endif; ?>
        <?php endif; ?>
      </div>

      <?php if (($page['type'] ?? '') === 'cover'): ?>
        <div class="book-cover-visual">
          <img src="/assets/img/books/arabic-daily-life-cover.png" alt="Arabic for Daily Life book cover">
        </div>
        <div class="book-highlight-box text-center">
          <div><?= h((string)$page['feature_line']) ?></div>
          <div class="book-footer-line"><?= h((string)$page['footer']) ?></div>
        </div>
        <div class="d-flex gap-2 flex-wrap justify-content-center mt-4">
          <?php if ($firstLessonId): ?><a class="btn btn-app" href="/student-book-lesson.php?lesson_id=<?= $firstLessonId ?>">Start Book</a><?php endif; ?>
          <?php if ($continueLessonId): ?><a class="btn btn-ghost" href="/student-book-lesson.php?lesson_id=<?= $continueLessonId ?>">Continue Learning</a><?php endif; ?>
          <a class="btn btn-ghost" href="/student-book-view.php?book_id=<?= $bookId ?>&page=contents">View Contents</a>
        </div>
      <?php elseif (($page['type'] ?? '') === 'contents'): ?>
        <?php interactive_book_render_contents($pdo, $studentId, $bookId, $lessons, $completed); ?>
      <?php elseif (($page['type'] ?? '') === 'steps'): ?>
        <div class="book-step-list">
          <?php foreach ((array)$page['steps'] as $i => $step): ?>
            <div class="book-step-card" dir="rtl"><span><?= $i + 1 ?></span><p><?= h((string)$step) ?></p></div>
          <?php endforeach; ?>
        </div>
        <?php if (!empty($page['highlight_ar'])): ?><div class="book-highlight-box" dir="rtl"><?= h((string)$page['highlight_ar']) ?></div><?php endif; ?>
      <?php elseif (($page['type'] ?? '') === 'grid'): ?>
        <div class="book-feature-grid">
          <?php foreach ((array)$page['items'] as $item): ?>
            <div class="book-feature-card" dir="rtl"><i class="bi <?= h((string)$item['icon']) ?>"></i><span><?= h((string)$item['text']) ?></span></div>
          <?php endforeach; ?>
        </div>
        <?php if (!empty($page['highlight_ar'])): ?><div class="book-highlight-box" dir="rtl"><?= h((string)$page['highlight_ar']) ?></div><?php endif; ?>
      <?php elseif (($page['type'] ?? '') === 'back-cover'): ?>
        <div class="book-highlight-box" dir="rtl">
          <h2><?= h((string)$page['section_title_ar']) ?></h2>
          <p><?= h((string)$page['blurb_ar']) ?></p>
        </div>
        <div class="book-feature-grid book-feature-grid-compact">
          <?php foreach ((array)$page['features'] as $feature): ?>
            <div class="book-feature-card"><i class="bi bi-check2-circle"></i><span><?= h((string)$feature) ?></span></div>
          <?php endforeach; ?>
        </div>
        <div class="book-highlight-box text-center"><?= h((string)$page['quote']) ?></div>
      <?php else: ?>
        <div class="book-info-body" dir="rtl">
          <?php foreach ((array)($page['body_ar'] ?? []) as $line): ?><p><?= h((string)$line) ?></p><?php endforeach; ?>
        </div>
        <?php if (($page['type'] ?? '') === 'ending'): ?>
          <div class="d-flex gap-2 flex-wrap justify-content-center">
            <?php if ($finalReviewSubmissionId): ?>
              <a class="btn btn-app btn-sm" href="/student-book-feedback.php?submission_id=<?= $finalReviewSubmissionId ?>">View Final Feedback</a>
            <?php endif; ?>
            <a class="btn btn-app btn-sm" href="/student-book-view.php?book_id=<?= $bookId ?>&page=contents">Practice Again</a>
            <a class="btn btn-ghost btn-sm" href="/student/home.php#weak_words">View Weak Words</a>
          </div>
        <?php endif; ?>
      <?php endif; ?>
      <?php interactive_book_render_nav($bookId, $page, $lessons); ?>
    </section>
    <?php
}

function interactive_book_render_contents(PDO $pdo, int $studentId, int $bookId, array $lessons, bool $completed): void
{
    $staticItems = [
        ['label' => 'Welcome & How to Use This Book', 'page' => 'thank-you'],
        ['label' => 'Arabic Sounds & Letters Quick Start', 'page' => 'sounds'],
    ];
    ?>
    <div class="book-contents-list">
      <?php $n = 1; foreach ($staticItems as $item): ?>
        <a class="book-content-row" href="/student-book-view.php?book_id=<?= $bookId ?>&page=<?= h($item['page']) ?>">
          <span><?= $n++ ?></span><strong><?= h($item['label']) ?></strong>
        </a>
      <?php endforeach; ?>
      <?php foreach ($lessons as $lesson): ?>
        <?php
          $isReview = (string)($lesson['unit_type'] ?? 'lesson') === 'review';
          $submission = interactive_books_current_submission($pdo, $studentId, (int)$lesson['id']);
          $status = (string)($submission['status'] ?? 'not_started');
          $label = $isReview ? (string)$lesson['title_en'] : 'Lesson ' . (int)$lesson['lesson_number'] . ': ' . (string)$lesson['title_en'];
        ?>
        <a class="book-content-row" href="/student-book-lesson.php?lesson_id=<?= (int)$lesson['id'] ?>">
          <span><?= $n++ ?></span>
          <strong><?= h($label) ?></strong>
          <em><?= h($status) ?></em>
        </a>
      <?php endforeach; ?>
      <?php foreach (['Vocabulary List', 'Answer Key', 'Speaking Practice Cards'] as $locked): ?>
        <div class="book-content-row is-locked"><span><?= $n++ ?></span><strong><?= h($locked) ?></strong><em><i class="bi bi-lock"></i> Coming soon</em></div>
      <?php endforeach; ?>
      <?php foreach ([['End Thank You', 'end-thank-you'], ['Final Word', 'final-word'], ['Back Cover', 'back-cover']] as $ending): ?>
        <?php if ($completed): ?>
          <a class="book-content-row" href="/student-book-view.php?book_id=<?= $bookId ?>&page=<?= h($ending[1]) ?>"><span><?= $n++ ?></span><strong><?= h($ending[0]) ?></strong></a>
        <?php else: ?>
          <div class="book-content-row is-locked"><span><?= $n++ ?></span><strong><?= h($ending[0]) ?></strong><em><i class="bi bi-lock"></i> Unlocks after completion</em></div>
        <?php endif; ?>
      <?php endforeach; ?>
    </div>
    <?php
}
