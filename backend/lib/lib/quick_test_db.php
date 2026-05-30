<?php
// lib/quick_test_db.php — DB layer for quick/mini level test
declare(strict_types=1);

function qt_ensure_tables(PDO $pdo): void
{
    static $done = false;
    if ($done) return;
    $done = true;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lt_quick_blocks (
            id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            block_number TINYINT UNSIGNED NOT NULL,
            passage_ar   MEDIUMTEXT NOT NULL,
            sort_order   TINYINT DEFAULT 0,
            is_active    TINYINT(1) DEFAULT 1,
            created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_block_num (block_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lt_quick_questions (
            id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            block_id    INT UNSIGNED NOT NULL,
            q_order     TINYINT UNSIGNED NOT NULL,
            question_ar TEXT NOT NULL,
            opt_a       VARCHAR(700) NOT NULL DEFAULT '',
            opt_b       VARCHAR(700) NOT NULL DEFAULT '',
            opt_c       VARCHAR(700) DEFAULT NULL,
            opt_d       VARCHAR(700) DEFAULT NULL,
            correct_opt CHAR(1) NOT NULL DEFAULT 'A',
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_block (block_id, q_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $blockCount = (int)$pdo->query("SELECT COUNT(*) FROM lt_quick_blocks")->fetchColumn();
    if ($blockCount === 0) {
        qt_seed_defaults($pdo);
    }
}

function qt_seed_defaults(PDO $pdo): void
{
    $blocks = [
        [
            'passage' => 'أحب العيش في المدينة لأنها توفر فرص عمل كثيرة وخدمات متنوعة. ومع ذلك، فإن الحياة في القرية أكثر هدوءًا وأقل ازدحامًا.',
            'questions' => [
                ['q'=>'لماذا يحب الكاتب العيش في المدينة؟','a'=>'لأنها هادئة','b'=>'لأنها توفر فرص عمل','c'=>'لأنها صغيرة','d'=>'لأنها بعيدة','correct'=>'B'],
                ['q'=>'كيف يصف الحياة في القرية؟','a'=>'مزدحمة','b'=>'سريعة','c'=>'هادئة','d'=>'خطيرة','correct'=>'C'],
                ['q'=>'ما معنى كلمة "ازدحام"؟','a'=>'هدوء','b'=>'كثرة الناس','c'=>'سرعة','d'=>'راحة','correct'=>'B'],
                ['q'=>'ما المقارنة الموجودة في النص؟','a'=>'بين العمل والدراسة','b'=>'بين المدينة والقرية','c'=>'بين الماضي والحاضر','d'=>'بين الصيف والشتاء','correct'=>'B'],
                ['q'=>'اختر الصيغة الصحيحة: "القرية ___ من المدينة."','a'=>'أهدأ','b'=>'هادئ','c'=>'هدوء','d'=>'أهدئين','correct'=>'A'],
            ],
        ],
        [
            'passage' => 'أصبح التعليم الإلكتروني أكثر انتشارًا في السنوات الأخيرة، خاصة بعد التطور التكنولوجي السريع. وقد ساعد هذا النوع من التعليم الطلاب على الوصول إلى مصادر متعددة للمعلومات بسهولة.',
            'questions' => [
                ['q'=>'ما سبب انتشار التعليم الإلكتروني؟','a'=>'قلة المدارس','b'=>'التطور التكنولوجي','c'=>'انخفاض الأسعار','d'=>'قلة المعلمين','correct'=>'B'],
                ['q'=>'ماذا وفر التعليم الإلكتروني للطلاب؟','a'=>'فرص سفر','b'=>'كتب ورقية','c'=>'مصادر متعددة للمعلومات','d'=>'وظائف','correct'=>'C'],
                ['q'=>'ما معنى "انتشارًا"؟','a'=>'تقلصًا','b'=>'توسعًا','c'=>'توقفًا','d'=>'تأخيرًا','correct'=>'B'],
                ['q'=>'اختر الجمع الصحيح لكلمة "مصدر":','a'=>'مصادر','b'=>'مصدرات','c'=>'مصدرون','d'=>'مصدرين','correct'=>'A'],
                ['q'=>'اختر الجملة الصحيحة:','a'=>'الطلاب استفادوا من التعليم الإلكتروني','b'=>'الطلاب استفاد من التعليم الإلكتروني','c'=>'الطلاب استفدوا من التعليم الإلكتروني','d'=>'الطلاب يستفاد من التعليم الإلكتروني','correct'=>'A'],
            ],
        ],
        [
            'passage' => 'تلعب القراءة دورًا محوريًا في تنمية التفكير النقدي، إذ تساعد الفرد على تحليل الأفكار ومقارنة الآراء المختلفة قبل تكوين موقفه الشخصي.',
            'questions' => [
                ['q'=>'ما الدور الذي تؤديه القراءة؟','a'=>'التسلية فقط','b'=>'تنمية التفكير النقدي','c'=>'إضاعة الوقت','d'=>'تقليل المعرفة','correct'=>'B'],
                ['q'=>'ماذا تعني "تنمية" في السياق؟','a'=>'إلغاء','b'=>'تطوير','c'=>'تجاهل','d'=>'رفض','correct'=>'B'],
                ['q'=>'ما المقصود بـ "تكوين موقف شخصي"؟','a'=>'تقليد الآخرين','b'=>'رفض كل شيء','c'=>'اتخاذ رأي خاص','d'=>'عدم التفكير','correct'=>'C'],
                ['q'=>'اختر الجملة الصحيحة نحويًا:','a'=>'القراءة يساعد الفرد','b'=>'القراءة تساعد الفرد','c'=>'القراءة يساعدون الفرد','d'=>'القراءة تساعدون الفرد','correct'=>'B'],
                ['q'=>'أي عبارة تعبر عن نتيجة ضمنية للنص؟','a'=>'القراءة غير مهمة','b'=>'التفكير النقدي ضروري','c'=>'الآراء متشابهة دائمًا','d'=>'الفرد لا يحتاج إلى تحليل','correct'=>'B'],
            ],
        ],
        [
            'passage' => 'على الرغم من التحولات الاقتصادية المتسارعة، لا تزال بعض المجتمعات تعاني فجوة واضحة بين الفئات الاجتماعية، مما يفرض ضرورة تبني سياسات تنموية أكثر عدالة واستدامة.',
            'questions' => [
                ['q'=>'ما المشكلة التي يشير إليها النص؟','a'=>'ضعف التكنولوجيا','b'=>'الفجوة بين الفئات الاجتماعية','c'=>'قلة الموارد الطبيعية','d'=>'انخفاض التعليم','correct'=>'B'],
                ['q'=>'ماذا تعني "فجوة" في السياق؟','a'=>'تقارب','b'=>'توازن','c'=>'اختلاف كبير','d'=>'مساواة','correct'=>'C'],
                ['q'=>'ما المقصود بـ "استدامة"؟','a'=>'مؤقتة','b'=>'مستمرة على المدى الطويل','c'=>'سريعة','d'=>'عشوائية','correct'=>'B'],
                ['q'=>'اختر الاستخدام الصحيح لكلمة "رغم":','a'=>'رغم أنه متعب، لكنه يعمل','b'=>'رغم متعب، يعمل','c'=>'رغم هو متعب، يعمل','d'=>'رغم متعبًا يعمل','correct'=>'A'],
                ['q'=>'ما الفكرة الضمنية للنص؟','a'=>'التنمية الحالية كافية','b'=>'لا توجد مشكلات اجتماعية','c'=>'الحاجة إلى إصلاحات عادلة','d'=>'الاقتصاد غير مهم','correct'=>'C'],
            ],
        ],
        [
            'passage' => 'إن اختزال مفهوم الحرية في غياب القيود القانونية فقط يُغفل أبعادًا أعمق تتعلق بالمسؤولية الأخلاقية والوعي المجتمعي، إذ لا يمكن لأي مجتمع أن يحقق توازنًا مستدامًا دون إدراك أفراده لحدود أفعالهم وتأثيرها.',
            'questions' => [
                ['q'=>'ما الفكرة الأساسية للنص؟','a'=>'الحرية تعني غياب القانون','b'=>'الحرية مرتبطة بالمسؤولية','c'=>'القيود ضرورية دائمًا','d'=>'المجتمع غير مهم','correct'=>'B'],
                ['q'=>'ماذا يعني "اختزال مفهوم الحرية"؟','a'=>'توسيعه','b'=>'تبسيطه بشكل مفرط','c'=>'رفضه','d'=>'تحليله','correct'=>'B'],
                ['q'=>'ما العلاقة بين الحرية والمسؤولية حسب النص؟','a'=>'لا علاقة بينهما','b'=>'علاقة تضاد','c'=>'علاقة تكامل','d'=>'علاقة عشوائية','correct'=>'C'],
                ['q'=>'اختر الجملة الصحيحة:','a'=>'لا يمكن للمجتمع أن يحقق توازن بدون وعي','b'=>'لا يمكن المجتمع أن يحقق توازن دون وعي','c'=>'لا يمكن للمجتمع أن يحقق توازنًا دون وعي','d'=>'لا يمكن المجتمع يحقق توازن دون وعي','correct'=>'C'],
                ['q'=>'ما الفكرة الضمنية؟','a'=>'الحرية المطلقة ممكنة دائمًا','b'=>'المجتمع يحتاج وعيًا أخلاقيًا','c'=>'القوانين غير مهمة','d'=>'المسؤولية تعيق الحرية','correct'=>'B'],
            ],
        ],
    ];

    $insBlock = $pdo->prepare("INSERT INTO lt_quick_blocks (block_number, passage_ar, sort_order) VALUES (?, ?, ?)");
    $insQ     = $pdo->prepare("INSERT INTO lt_quick_questions (block_id, q_order, question_ar, opt_a, opt_b, opt_c, opt_d, correct_opt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    foreach ($blocks as $i => $blk) {
        $insBlock->execute([$i + 1, $blk['passage'], $i]);
        $blockId = (int)$pdo->lastInsertId();
        foreach ($blk['questions'] as $qi => $q) {
            $insQ->execute([
                $blockId, $qi + 1,
                $q['q'], $q['a'], $q['b'],
                $q['c'] ?? null, $q['d'] ?? null,
                strtoupper($q['correct']),
            ]);
        }
    }
}

/**
 * Returns active blocks with their questions, ordered for the test.
 * Each block: [id, block_number, passage_ar, questions[]]
 * Each question: [id, q_order, question_ar, opt_a, opt_b, opt_c, opt_d, correct_opt]
 */
function qt_get_blocks(PDO $pdo): array
{
    $blocks = $pdo->query("
        SELECT id, block_number, passage_ar, sort_order
        FROM lt_quick_blocks
        WHERE is_active = 1
        ORDER BY sort_order ASC, block_number ASC
    ")->fetchAll();

    if (!$blocks) return [];

    $ids = array_column($blocks, 'id');
    $in  = implode(',', array_map('intval', $ids));

    $qRows = $pdo->query("
        SELECT id, block_id, q_order, question_ar, opt_a, opt_b, opt_c, opt_d, correct_opt
        FROM lt_quick_questions
        WHERE block_id IN ($in)
        ORDER BY block_id ASC, q_order ASC
    ")->fetchAll();

    $qByBlock = [];
    foreach ($qRows as $q) {
        $qByBlock[(int)$q['block_id']][] = $q;
    }

    $result = [];
    foreach ($blocks as $blk) {
        $blk['questions'] = $qByBlock[(int)$blk['id']] ?? [];
        $result[] = $blk;
    }
    return $result;
}

/**
 * Returns all blocks (including inactive) with questions for admin.
 */
function qt_get_all_blocks(PDO $pdo): array
{
    $blocks = $pdo->query("
        SELECT id, block_number, passage_ar, sort_order, is_active
        FROM lt_quick_blocks
        ORDER BY sort_order ASC, block_number ASC
    ")->fetchAll();

    if (!$blocks) return [];

    $ids = array_column($blocks, 'id');
    $in  = implode(',', array_map('intval', $ids));

    $qRows = $pdo->query("
        SELECT id, block_id, q_order, question_ar, opt_a, opt_b, opt_c, opt_d, correct_opt
        FROM lt_quick_questions
        WHERE block_id IN ($in)
        ORDER BY block_id ASC, q_order ASC
    ")->fetchAll();

    $qByBlock = [];
    foreach ($qRows as $q) {
        $qByBlock[(int)$q['block_id']][] = $q;
    }

    $result = [];
    foreach ($blocks as $blk) {
        $blk['questions'] = $qByBlock[(int)$blk['id']] ?? [];
        $result[] = $blk;
    }
    return $result;
}

/**
 * Build the answer key from DB questions.
 * Returns [questionNumber => 'A'|'B'|'C'|'D', ...]
 */
function qt_answer_key(PDO $pdo): array
{
    $blocks = qt_get_blocks($pdo);
    $key = [];
    $n = 1;
    foreach ($blocks as $blk) {
        foreach ($blk['questions'] as $q) {
            $key[$n++] = strtoupper($q['correct_opt']);
        }
    }
    return $key;
}
