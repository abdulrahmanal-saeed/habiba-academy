<?php
// lib/leveltest_db.php — DB layer for level test question bank
declare(strict_types=1);

/* ────────────────────────────────────────────────────────────
   TABLE CREATION
──────────────────────────────────────────────────────────── */
function lt_ensure_db_tables(PDO $pdo): void
{
    static $done = false;
    if ($done) return;
    $done = true;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lt_blocks (
            id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            section     ENUM('listening','reading') NOT NULL,
            block_number TINYINT UNSIGNED NOT NULL,
            audio_path  VARCHAR(500) DEFAULT '',
            passage_ar  MEDIUMTEXT DEFAULT '',
            passage_en  MEDIUMTEXT DEFAULT '',
            cefr_level  ENUM('A1','A2','B1','B2','C1','C2') NOT NULL DEFAULT 'A2',
            sort_order  TINYINT UNSIGNED DEFAULT 0,
            is_active   TINYINT(1) DEFAULT 1,
            UNIQUE KEY uq_section_block (section, block_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lt_questions (
            id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            block_id    INT UNSIGNED NOT NULL,
            item_number TINYINT UNSIGNED NOT NULL,
            variant     TINYINT UNSIGNED NOT NULL DEFAULT 1,
            question_ar MEDIUMTEXT NOT NULL,
            question_en MEDIUMTEXT DEFAULT '',
            opt_a_ar    VARCHAR(700) NOT NULL DEFAULT '',
            opt_a_en    VARCHAR(700) DEFAULT '',
            opt_b_ar    VARCHAR(700) NOT NULL DEFAULT '',
            opt_b_en    VARCHAR(700) DEFAULT '',
            opt_c_ar    VARCHAR(700) NOT NULL DEFAULT '',
            opt_c_en    VARCHAR(700) DEFAULT '',
            opt_d_ar    VARCHAR(700) DEFAULT '',
            opt_d_en    VARCHAR(700) DEFAULT '',
            correct_opt CHAR(1) NOT NULL DEFAULT 'A',
            is_active   TINYINT(1) DEFAULT 1,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_block_item (block_id, item_number, variant)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leveltest_attempts (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id INT UNSIGNED NULL,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL DEFAULT '',
            whatsapp VARCHAR(100) NOT NULL DEFAULT '',
            age INT NULL,
            country VARCHAR(120) NULL,
            applicant_type VARCHAR(50) NOT NULL DEFAULT 'new_applicant',
            test_type VARCHAR(50) NOT NULL DEFAULT 'full',
            lead_status VARCHAR(50) NOT NULL DEFAULT 'new',
            review_status VARCHAR(50) NOT NULL DEFAULT 'pending',
            current_step VARCHAR(50) NOT NULL DEFAULT 'submitted',
            device_id_hash VARCHAR(128) NULL,
            ip_hash VARCHAR(128) NULL,
            user_agent_hash VARCHAR(128) NULL,
            listening_score INT NULL,
            listening_level VARCHAR(50) NULL,
            reading_score INT NULL,
            reading_level VARCHAR(50) NULL,
            overall_estimated_level VARCHAR(50) NULL,
            auto_score INT NULL,
            writing_score INT NULL,
            speaking_score INT NULL,
            total_score INT NULL,
            final_level VARCHAR(50) NULL,
            recommended_next_step TEXT NULL,
            teacher_notes TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            submitted_at DATETIME NULL,
            reviewed_at DATETIME NULL,
            KEY idx_lt_attempt_review (review_status),
            KEY idx_lt_attempt_lead (lead_status),
            KEY idx_lt_attempt_student (student_id),
            KEY idx_lt_attempt_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leveltest_answers (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            attempt_id INT UNSIGNED NOT NULL,
            section VARCHAR(50) NOT NULL,
            q_no INT NOT NULL,
            answer VARCHAR(20) NULL,
            is_correct TINYINT(1) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_leveltest_answers_attempt (attempt_id),
            KEY idx_leveltest_answers_section (section)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leveltest_writing_speaking (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            attempt_id INT UNSIGNED NOT NULL,
            writing_task1_text MEDIUMTEXT NULL,
            writing_task2_text MEDIUMTEXT NULL,
            speaking_audio_path JSON NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_lt_ws_attempt (attempt_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leveltest_attempt_snapshots (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            attempt_id INT UNSIGNED NOT NULL,
            section VARCHAR(50) NOT NULL,
            source_entity_type VARCHAR(50) NOT NULL,
            source_entity_id INT UNSIGNED NULL,
            display_order INT NOT NULL DEFAULT 0,
            snapshot_data JSON NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_lt_snapshot_attempt (attempt_id),
            KEY idx_lt_snapshot_section (section)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lt_writing_prompts (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            import_key VARCHAR(190) NULL,
            task_type ENUM('task1','task2') NOT NULL DEFAULT 'task1',
            cefr_level ENUM('ALL','A2','B1','B2','C1','C2') NOT NULL DEFAULT 'ALL',
            title VARCHAR(255) NOT NULL DEFAULT '',
            prompt_text MEDIUMTEXT NOT NULL,
            instructions MEDIUMTEXT NULL,
            diagnostic_notes MEDIUMTEXT NULL,
            word_range VARCHAR(80) NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_lt_writing_import_key (import_key),
            KEY idx_lt_writing_pick (task_type, cefr_level, is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lt_speaking_prompts (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            import_key VARCHAR(190) NULL,
            phase ENUM('warmup','description','discussion','abstract') NOT NULL DEFAULT 'warmup',
            target_level VARCHAR(50) NOT NULL DEFAULT '',
            title VARCHAR(255) NOT NULL DEFAULT '',
            prompt_text MEDIUMTEXT NOT NULL,
            bullets JSON NULL,
            image_path VARCHAR(500) NULL,
            evaluation_notes MEDIUMTEXT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_lt_speaking_import_key (import_key),
            KEY idx_lt_speaking_pick (phase, is_active, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    lt_add_column_if_missing($pdo, 'leveltest_attempts', 'applicant_type', "ALTER TABLE leveltest_attempts ADD COLUMN applicant_type VARCHAR(50) NOT NULL DEFAULT 'new_applicant' AFTER country");
    lt_add_column_if_missing($pdo, 'leveltest_attempts', 'test_type', "ALTER TABLE leveltest_attempts ADD COLUMN test_type VARCHAR(50) NOT NULL DEFAULT 'full' AFTER applicant_type");
    lt_add_column_if_missing($pdo, 'leveltest_attempts', 'lead_status', "ALTER TABLE leveltest_attempts ADD COLUMN lead_status VARCHAR(50) NOT NULL DEFAULT 'new' AFTER test_type");
    lt_add_column_if_missing($pdo, 'leveltest_attempts', 'current_step', "ALTER TABLE leveltest_attempts ADD COLUMN current_step VARCHAR(50) NOT NULL DEFAULT 'submitted' AFTER review_status");
    lt_add_column_if_missing($pdo, 'leveltest_attempts', 'device_id_hash', "ALTER TABLE leveltest_attempts ADD COLUMN device_id_hash VARCHAR(128) NULL AFTER current_step");
    lt_add_column_if_missing($pdo, 'leveltest_attempts', 'ip_hash', "ALTER TABLE leveltest_attempts ADD COLUMN ip_hash VARCHAR(128) NULL AFTER device_id_hash");
    lt_add_column_if_missing($pdo, 'leveltest_attempts', 'user_agent_hash', "ALTER TABLE leveltest_attempts ADD COLUMN user_agent_hash VARCHAR(128) NULL AFTER ip_hash");
    lt_add_column_if_missing($pdo, 'leveltest_attempts', 'submitted_at', "ALTER TABLE leveltest_attempts ADD COLUMN submitted_at DATETIME NULL AFTER created_at");

    // Seed only if tables are empty
    $blockCount = (int)$pdo->query("SELECT COUNT(*) FROM lt_blocks")->fetchColumn();
    if ($blockCount === 0) {
        lt_seed_default($pdo);
    }
}

function lt_column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    ");
    $stmt->execute([$table, $column]);
    return (int)$stmt->fetchColumn() > 0;
}

function lt_add_column_if_missing(PDO $pdo, string $table, string $column, string $sql): void
{
    if (!lt_column_exists($pdo, $table, $column)) {
        $pdo->exec($sql);
    }
}

/* ────────────────────────────────────────────────────────────
   SEED DEFAULT DATA (migrates from leveltest_bank.php arrays)
──────────────────────────────────────────────────────────── */
function lt_seed_default(PDO $pdo): void
{
    // ── Listening blocks ────────────────────────────────────
    $listeningBlocks = [
        1 => ['audio'=>'assets/audio/leveltest/a2_1.mp3','level'=>'A2','items'=>[
            ['q'=>'أين يعيش أحمد؟','opts'=>['A'=>'في دبي','B'=>'في الشارقة','C'=>'في أبوظبي','D'=>'في عمان'],'correct'=>'C'],
            ['q'=>'متى يبدأ عمله؟','opts'=>['A'=>'في الثامنة صباحًا','B'=>'في التاسعة صباحًا','C'=>'في العاشرة صباحًا','D'=>'في المساء'],'correct'=>'B'],
            ['q'=>'ماذا يفعل بعد انتهاء العمل أحيانًا؟','opts'=>['A'=>'يسافر','B'=>'يدرس','C'=>'يذهب إلى النادي أو يشاهد فيلمًا','D'=>'ينام مباشرة'],'correct'=>'C'],
        ]],
        2 => ['audio'=>'assets/audio/leveltest/a2_2.mp3','level'=>'A2','items'=>[
            ['q'=>'كيف يذهب المتحدث إلى العمل؟','opts'=>['A'=>'بالسيارة','B'=>'بالحافلة','C'=>'بالمترو','D'=>'سيرًا على الأقدام'],'correct'=>'B'],
            ['q'=>'أين يعمل؟','opts'=>['A'=>'في مدرسة','B'=>'في مستشفى','C'=>'في مكتب','D'=>'في مطعم'],'correct'=>'C'],
            ['q'=>'ماذا يفعل في المساء؟','opts'=>['A'=>'يذهب إلى السوق','B'=>'يمارس الرياضة','C'=>'يقضي وقتًا مع عائلته','D'=>'يسافر'],'correct'=>'C'],
        ]],
        3 => ['audio'=>'assets/audio/leveltest/b1_1.mp3','level'=>'B1','items'=>[
            ['q'=>'لماذا لم يزر المتحف؟','opts'=>['A'=>'لأنه كان مشغولًا','B'=>'لأن المتحف كان مغلقًا','C'=>'لأن الجو كان حارًا','D'=>'لأنه نسي الموعد'],'correct'=>'C'],
            ['q'=>'ماذا قرر أن يفعل؟','opts'=>['A'=>'يزور المتحف مساءً','B'=>'يؤجل الزيارة','C'=>'يذهب إلى السوق','D'=>'يسافر'],'correct'=>'B'],
            ['q'=>'ماذا تعني كلمة "أؤجل" في النص؟','opts'=>['A'=>'أُلغي','B'=>'أكرر','C'=>'أؤخر','D'=>'أبدأ'],'correct'=>'C'],
        ]],
        4 => ['audio'=>'assets/audio/leveltest/b1_2.mp3','level'=>'B1','items'=>[
            ['q'=>'لماذا لم يسافر؟','opts'=>['A'=>'لأنه مريض','B'=>'بسبب ظروف العمل','C'=>'لأن الطائرة ألغيت','D'=>'لأنه لا يريد السفر'],'correct'=>'B'],
            ['q'=>'ماذا طلب المدير؟','opts'=>['A'=>'إلغاء المشروع','B'=>'بدء مشروع جديد','C'=>'إنهاء مشروع مهم','D'=>'السفر معه'],'correct'=>'C'],
            ['q'=>'ماذا تعني كلمة "تأجيل" في السياق؟','opts'=>['A'=>'إلغاء','B'=>'تأخير','C'=>'تسريع','D'=>'تنظيم'],'correct'=>'B'],
        ]],
        5 => ['audio'=>'assets/audio/leveltest/b2_1.mp3','level'=>'B2','items'=>[
            ['q'=>'ما الفكرة الرئيسية للنص؟','opts'=>['A'=>'أهمية السفر','B'=>'فوائد التكنولوجيا فقط','C'=>'تأثير التكنولوجيا الإيجابي والسلبي','D'=>'خطورة الإنترنت فقط'],'correct'=>'C'],
            ['q'=>'ماذا قد يسبب الاستخدام المفرط للتكنولوجيا؟','opts'=>['A'=>'زيادة النشاط البدني','B'=>'تحسين العلاقات الاجتماعية','C'=>'العزلة الاجتماعية','D'=>'تقليل العمل'],'correct'=>'C'],
            ['q'=>'ماذا يقصد الكاتب بـ "التفاعل المباشر"؟','opts'=>['A'=>'التواصل عبر الإنترنت','B'=>'اللقاء وجهًا لوجه','C'=>'إرسال رسائل','D'=>'مشاهدة فيديوهات'],'correct'=>'B'],
        ]],
        6 => ['audio'=>'assets/audio/leveltest/b2_2.mp3','level'=>'B2','items'=>[
            ['q'=>'ما الفكرة الرئيسية للنص؟','opts'=>['A'=>'الإعلام غير مهم','B'=>'الإعلام ينقل الأخبار فقط','C'=>'الإعلام يؤثر في آراء الناس','D'=>'الإعلام قديم'],'correct'=>'C'],
            ['q'=>'ماذا يجب على الجمهور فعله؟','opts'=>['A'=>'تصديق كل شيء','B'=>'تجاهل الأخبار','C'=>'التفكير النقدي','D'=>'إغلاق وسائل الإعلام'],'correct'=>'C'],
            ['q'=>'ماذا يعني "تفسير الجمهور للأحداث"؟','opts'=>['A'=>'تجاهل الأحداث','B'=>'فهم الناس للأحداث','C'=>'تغيير الأحداث','D'=>'صناعة الأحداث'],'correct'=>'B'],
        ]],
        7 => ['audio'=>'assets/audio/leveltest/c1_1.mp3','level'=>'C1','items'=>[
            ['q'=>'ما التناقض الذي يشير إليه النص؟','opts'=>['A'=>'بين الحرية والرقابة','B'=>'بين الفوائد والمخاطر','C'=>'بين السرعة والبطء','D'=>'بين الإعلام التقليدي والحديث'],'correct'=>'B'],
            ['q'=>'ماذا يجب على المستخدمين فعله؟','opts'=>['A'=>'تجاهل الأخبار','B'=>'نشر كل شيء بسرعة','C'=>'التحقق من المصادر','D'=>'إغلاق الحسابات'],'correct'=>'C'],
            ['q'=>'ماذا تعني "معلومات مضللة"؟','opts'=>['A'=>'معلومات صحيحة','B'=>'معلومات غير دقيقة','C'=>'معلومات مفيدة','D'=>'معلومات علمية'],'correct'=>'B'],
        ]],
        8 => ['audio'=>'assets/audio/leveltest/c1_2.mp3','level'=>'C1','items'=>[
            ['q'=>'ما القضية التي يناقشها النص؟','opts'=>['A'=>'أهمية السفر','B'=>'العلاقة بين التكنولوجيا والقيم','C'=>'ضعف التعليم','D'=>'البطالة'],'correct'=>'B'],
            ['q'=>'ماذا يشير الكاتب ضمنيًا؟','opts'=>['A'=>'أن التكنولوجيا خطر دائم','B'=>'أن القيم غير مهمة','C'=>'ضرورة تحقيق توازن','D'=>'رفض التطور'],'correct'=>'C'],
            ['q'=>'ماذا تعني "الهوية الثقافية"؟','opts'=>['A'=>'الاقتصاد','B'=>'اللغة فقط','C'=>'العادات والقيم','D'=>'التكنولوجيا'],'correct'=>'C'],
        ]],
        9 => ['audio'=>'assets/audio/leveltest/c2_1.mp3','level'=>'C2','items'=>[
            ['q'=>'ما الفكرة الضمنية في النص؟','opts'=>['A'=>'الاقتصاد غير مهم','B'=>'الأرقام تعكس كل شيء','C'=>'التنمية أوسع من النمو الاقتصادي','D'=>'العدالة غير ضرورية'],'correct'=>'C'],
            ['q'=>'ماذا يقصد بـ "لا تُقاس بالأرقام وحدها"؟','opts'=>['A'=>'يجب تجاهل الإحصاءات','B'=>'الأرقام ليست المعيار الوحيد','C'=>'الاقتصاد فاشل','D'=>'الأرقام غير دقيقة'],'correct'=>'B'],
            ['q'=>'ما العامل الذي يعتبره الكاتب مهمًا للتنمية الحقيقية؟','opts'=>['A'=>'ارتفاع الأسعار','B'=>'زيادة الضرائب','C'=>'العدالة الاجتماعية','D'=>'كثرة الشركات'],'correct'=>'C'],
        ]],
        10 => ['audio'=>'assets/audio/leveltest/c2_2.mp3','level'=>'C2','items'=>[
            ['q'=>'ما الفكرة الضمنية للنص؟','opts'=>['A'=>'المال هو النجاح','B'=>'النجاح مفهوم أوسع من الإنجاز المادي','C'=>'القيم غير ضرورية','D'=>'النجاح سهل'],'correct'=>'B'],
            ['q'=>'ماذا يقصد بـ "يُختزل مفهوم النجاح"؟','opts'=>['A'=>'يُوسّع','B'=>'يُبسط','C'=>'يُحصر في جانب واحد','D'=>'يُلغى'],'correct'=>'C'],
            ['q'=>'ما المعيار الحقيقي للنجاح حسب النص؟','opts'=>['A'=>'الشهرة','B'=>'المال','C'=>'التأثير الإيجابي والقيم','D'=>'المنصب'],'correct'=>'C'],
        ]],
    ];

    // ── Reading blocks ──────────────────────────────────────
    $readingBlocks = [
        1 => ['level'=>'A2','passage_ar'=>'أحب العيش في المدينة لأنها توفر فرص عمل كثيرة وخدمات متنوعة. ومع ذلك، فإن الحياة في القرية أكثر هدوءًا وأقل ازدحامًا.','items'=>[
            ['q'=>'لماذا يحب الكاتب العيش في المدينة؟','opts'=>['A'=>'لأنها هادئة','B'=>'لأنها توفر فرص عمل','C'=>'لأنها صغيرة','D'=>'لأنها بعيدة'],'correct'=>'B'],
            ['q'=>'كيف يصف الحياة في القرية؟','opts'=>['A'=>'مزدحمة','B'=>'سريعة','C'=>'هادئة','D'=>'خطيرة'],'correct'=>'C'],
            ['q'=>'ما معنى كلمة "ازدحام"؟','opts'=>['A'=>'هدوء','B'=>'كثرة الناس','C'=>'سرعة','D'=>'راحة'],'correct'=>'B'],
            ['q'=>'ما المقارنة الموجودة في النص؟','opts'=>['A'=>'بين العمل والدراسة','B'=>'بين المدينة والقرية','C'=>'بين الماضي والحاضر','D'=>'بين الصيف والشتاء'],'correct'=>'B'],
            ['q'=>'اختر الصيغة الصحيحة: "القرية ___ من المدينة."','opts'=>['A'=>'أهدأ','B'=>'هادئ','C'=>'هدوء','D'=>'أهدئين'],'correct'=>'A'],
        ]],
        2 => ['level'=>'B1','passage_ar'=>'أصبح التعليم الإلكتروني أكثر انتشارًا في السنوات الأخيرة، خاصة بعد التطور التكنولوجي السريع. وقد ساعد هذا النوع من التعليم الطلاب على الوصول إلى مصادر متعددة للمعلومات بسهولة.','items'=>[
            ['q'=>'ما سبب انتشار التعليم الإلكتروني؟','opts'=>['A'=>'قلة المدارس','B'=>'التطور التكنولوجي','C'=>'انخفاض الأسعار','D'=>'قلة المعلمين'],'correct'=>'B'],
            ['q'=>'ماذا وفر التعليم الإلكتروني للطلاب؟','opts'=>['A'=>'فرص سفر','B'=>'كتب ورقية','C'=>'مصادر متعددة للمعلومات','D'=>'وظائف'],'correct'=>'C'],
            ['q'=>'ما معنى "انتشارًا"؟','opts'=>['A'=>'تقلصًا','B'=>'توسعًا','C'=>'توقفًا','D'=>'تأخيرًا'],'correct'=>'B'],
            ['q'=>'اختر الجمع الصحيح لكلمة "مصدر":','opts'=>['A'=>'مصادر','B'=>'مصدرات','C'=>'مصدرون','D'=>'مصدرين'],'correct'=>'A'],
            ['q'=>'اختر الجملة الصحيحة:','opts'=>['A'=>'الطلاب استفادوا من التعليم الإلكتروني','B'=>'الطلاب استفاد من التعليم الإلكتروني','C'=>'الطلاب استفدوا من التعليم الإلكتروني','D'=>'الطلاب يستفاد من التعليم الإلكتروني'],'correct'=>'A'],
        ]],
        3 => ['level'=>'B2','passage_ar'=>'تلعب القراءة دورًا محوريًا في تنمية التفكير النقدي، إذ تساعد الفرد على تحليل الأفكار ومقارنة الآراء المختلفة قبل تكوين موقفه الشخصي.','items'=>[
            ['q'=>'ما الدور الذي تؤديه القراءة؟','opts'=>['A'=>'التسلية فقط','B'=>'تنمية التفكير النقدي','C'=>'إضاعة الوقت','D'=>'تقليل المعرفة'],'correct'=>'B'],
            ['q'=>'ماذا تعني "تنمية" في السياق؟','opts'=>['A'=>'إلغاء','B'=>'تطوير','C'=>'تجاهل','D'=>'رفض'],'correct'=>'B'],
            ['q'=>'ما المقصود بـ "تكوين موقف شخصي"؟','opts'=>['A'=>'تقليد الآخرين','B'=>'رفض كل شيء','C'=>'اتخاذ رأي خاص','D'=>'عدم التفكير'],'correct'=>'C'],
            ['q'=>'اختر الجملة الصحيحة نحويًا:','opts'=>['A'=>'القراءة يساعد الفرد','B'=>'القراءة تساعد الفرد','C'=>'القراءة يساعدون الفرد','D'=>'القراءة تساعدون الفرد'],'correct'=>'B'],
            ['q'=>'أي عبارة تعبر عن نتيجة ضمنية للنص؟','opts'=>['A'=>'القراءة غير مهمة','B'=>'التفكير النقدي ضروري','C'=>'الآراء متشابهة دائمًا','D'=>'الفرد لا يحتاج إلى تحليل'],'correct'=>'B'],
        ]],
        4 => ['level'=>'C1','passage_ar'=>'على الرغم من التحولات الاقتصادية المتسارعة، لا تزال بعض المجتمعات تعاني فجوة واضحة بين الفئات الاجتماعية، مما يفرض ضرورة تبني سياسات تنموية أكثر عدالة واستدامة.','items'=>[
            ['q'=>'ما المشكلة التي يشير إليها النص؟','opts'=>['A'=>'ضعف التكنولوجيا','B'=>'الفجوة بين الفئات الاجتماعية','C'=>'قلة الموارد الطبيعية','D'=>'انخفاض التعليم'],'correct'=>'B'],
            ['q'=>'ماذا تعني "فجوة" في السياق؟','opts'=>['A'=>'تقارب','B'=>'توازن','C'=>'اختلاف كبير','D'=>'مساواة'],'correct'=>'C'],
            ['q'=>'ما المقصود بـ "استدامة"؟','opts'=>['A'=>'مؤقتة','B'=>'مستمرة على المدى الطويل','C'=>'سريعة','D'=>'عشوائية'],'correct'=>'B'],
            ['q'=>'اختر الاستخدام الصحيح لكلمة "رغم":','opts'=>['A'=>'رغم أنه متعب، لكنه يعمل','B'=>'رغم متعب، يعمل','C'=>'رغم هو متعب، يعمل','D'=>'رغم متعبًا يعمل'],'correct'=>'A'],
            ['q'=>'ما الفكرة الضمنية للنص؟','opts'=>['A'=>'التنمية الحالية كافية','B'=>'لا توجد مشكلات اجتماعية','C'=>'الحاجة إلى إصلاحات عادلة','D'=>'الاقتصاد غير مهم'],'correct'=>'C'],
        ]],
        5 => ['level'=>'C2','passage_ar'=>'إن اختزال مفهوم الحرية في غياب القيود القانونية فقط يُغفل أبعادًا أعمق تتعلق بالمسؤولية الأخلاقية والوعي المجتمعي، إذ لا يمكن لأي مجتمع أن يحقق توازنًا مستدامًا دون إدراك أفراده لحدود أفعالهم وتأثيرها.','items'=>[
            ['q'=>'ما الفكرة الأساسية للنص؟','opts'=>['A'=>'الحرية تعني غياب القانون','B'=>'الحرية مرتبطة بالمسؤولية','C'=>'القيود ضرورية دائمًا','D'=>'المجتمع غير مهم'],'correct'=>'B'],
            ['q'=>'ماذا يعني "اختزال مفهوم الحرية"؟','opts'=>['A'=>'توسيعه','B'=>'تبسيطه بشكل مفرط','C'=>'رفضه','D'=>'تحليله'],'correct'=>'B'],
            ['q'=>'ما العلاقة بين الحرية والمسؤولية حسب النص؟','opts'=>['A'=>'لا علاقة بينهما','B'=>'علاقة تضاد','C'=>'علاقة تكامل','D'=>'علاقة عشوائية'],'correct'=>'C'],
            ['q'=>'اختر الجملة الصحيحة:','opts'=>['A'=>'لا يمكن للمجتمع أن يحقق توازن بدون وعي','B'=>'لا يمكن المجتمع أن يحقق توازن دون وعي','C'=>'لا يمكن للمجتمع أن يحقق توازنًا دون وعي','D'=>'لا يمكن المجتمع يحقق توازن دون وعي'],'correct'=>'C'],
            ['q'=>'ما الفكرة الضمنية؟','opts'=>['A'=>'الحرية المطلقة ممكنة دائمًا','B'=>'المجتمع يحتاج وعيًا أخلاقيًا','C'=>'القوانين غير مهمة','D'=>'المسؤولية تعيق الحرية'],'correct'=>'B'],
        ]],
    ];

    $blockStmt = $pdo->prepare("
        INSERT IGNORE INTO lt_blocks (section, block_number, audio_path, cefr_level, sort_order)
        VALUES ('listening', ?, ?, ?, ?)
    ");
    $readBlockStmt = $pdo->prepare("
        INSERT IGNORE INTO lt_blocks (section, block_number, passage_ar, cefr_level, sort_order)
        VALUES ('reading', ?, ?, ?, ?)
    ");
    $qStmt = $pdo->prepare("
        INSERT INTO lt_questions
          (block_id, item_number, variant, question_ar, opt_a_ar, opt_b_ar, opt_c_ar, opt_d_ar, correct_opt)
        VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($listeningBlocks as $bn => $bl) {
        $blockStmt->execute([$bn, $bl['audio'], $bl['level'], $bn]);
        $bid = (int)$pdo->lastInsertId();
        foreach ($bl['items'] as $i => $it) {
            $qStmt->execute([
                $bid, $i+1, $it['q'],
                $it['opts']['A'], $it['opts']['B'], $it['opts']['C'], $it['opts']['D'],
                $it['correct']
            ]);
        }
    }

    foreach ($readingBlocks as $bn => $bl) {
        $readBlockStmt->execute([$bn, $bl['passage_ar'], $bl['level'], $bn]);
        $bid = (int)$pdo->lastInsertId();
        foreach ($bl['items'] as $i => $it) {
            $qStmt->execute([
                $bid, $i+1, $it['q'],
                $it['opts']['A'], $it['opts']['B'], $it['opts']['C'], $it['opts']['D'],
                $it['correct']
            ]);
        }
    }
}

/* ────────────────────────────────────────────────────────────
   LOAD QUESTIONS FOR TEST (with random variant selection)
──────────────────────────────────────────────────────────── */

/**
 * Returns test-ready blocks plus the question-ID map used for scoring.
 *
 * $result['blocks'] matches the format of $listeningBlocks / $readingBlocks
 *   but each item also has 'id', 'q_en', 'opts_en'
 *
 * $result['question_ids'] = [slot_number => question_id]
 *   where slot_number is 1-based and sequential across all blocks
 */
function lt_build_test_section(PDO $pdo, string $section): array
{
    lt_ensure_db_tables($pdo);

    $levels = ['A2', 'B1', 'B2', 'C1', 'C2'];
    $perLevel = $section === 'listening'
        ? lt_setting_int('lt_random_listening_blocks_per_level', 2)
        : lt_setting_int('lt_random_reading_blocks_per_level', 1);
    $randomize = lt_setting_bool('lt_randomization_enabled', true);

    $blockRows = [];
    if ($randomize) {
        $importOnly = false;
        if (lt_column_exists($pdo, 'lt_blocks', 'import_key')) {
            $stmtImported = $pdo->prepare("
                SELECT COUNT(*)
                FROM lt_blocks
                WHERE section = ?
                  AND is_active = 1
                  AND import_key IS NOT NULL
                  AND import_key <> ''
            ");
            $stmtImported->execute([$section]);
            $importOnly = (int)$stmtImported->fetchColumn() > 0;
        }
        foreach ($levels as $level) {
            $importFilter = $importOnly ? "AND b.import_key IS NOT NULL AND b.import_key <> ''" : "";
            $stmt = $pdo->prepare("
                SELECT b.*
                FROM lt_blocks b
                WHERE b.section = ?
                  AND b.cefr_level = ?
                  AND b.is_active = 1
                  $importFilter
                  AND EXISTS (
                      SELECT 1
                      FROM lt_questions q
                      WHERE q.block_id = b.id
                        AND q.is_active = 1
                  )
                ORDER BY RAND()
                LIMIT " . max(1, $perLevel)
            );
            $stmt->execute([$section, $level]);
            foreach ($stmt->fetchAll() as $row) {
                $blockRows[] = $row;
            }
        }
    }

    if (!$blockRows) {
        $blocks = $pdo->prepare("
            SELECT * FROM lt_blocks
            WHERE section = ? AND is_active = 1
            ORDER BY block_number ASC
        ");
        $blocks->execute([$section]);
        $blockRows = $blocks->fetchAll();
    }

    $result     = [];
    $questionIds = [];
    $slotSeq    = 1;

    foreach ($blockRows as $blk) {
        $bid = (int)$blk['id'];

        // Find all item slots for this block
        $slots = $pdo->prepare("
            SELECT DISTINCT item_number FROM lt_questions
            WHERE block_id = ? AND is_active = 1
            ORDER BY item_number ASC
        ");
        $slots->execute([$bid]);
        $slotNums = $slots->fetchAll(PDO::FETCH_COLUMN);

        $items = [];
        foreach ($slotNums as $itemNum) {
            // Pick a random active variant
            $variants = $pdo->prepare("
                SELECT * FROM lt_questions
                WHERE block_id = ? AND item_number = ? AND is_active = 1
                ORDER BY variant ASC
            ");
            $variants->execute([$bid, $itemNum]);
            $vRows = $variants->fetchAll();
            if (empty($vRows)) continue;

            $chosen = $vRows[array_rand($vRows)];

            $opts = [
                'A' => (string)$chosen['opt_a_ar'],
                'B' => (string)$chosen['opt_b_ar'],
                'C' => (string)$chosen['opt_c_ar'],
            ];
            $optsEn = [
                'A' => (string)$chosen['opt_a_en'],
                'B' => (string)$chosen['opt_b_en'],
                'C' => (string)$chosen['opt_c_en'],
            ];
            if (!empty($chosen['opt_d_ar'])) {
                $opts['D']   = (string)$chosen['opt_d_ar'];
                $optsEn['D'] = (string)$chosen['opt_d_en'];
            }

            $items[] = [
                'id'      => (int)$chosen['id'],
                'q'       => (string)$chosen['question_ar'],
                'q_en'    => (string)$chosen['question_en'],
                'opts'    => $opts,
                'opts_en' => $optsEn,
            ];
            $questionIds[$slotSeq] = (int)$chosen['id'];
            $slotSeq++;
        }

        if ($section === 'listening') {
            $result[] = ['audio' => (string)$blk['audio_path'], 'items' => $items, 'block_id' => $bid];
        } else {
            $result[] = [
                'passage'    => (string)$blk['passage_ar'],
                'passage_en' => (string)$blk['passage_en'],
                'items'      => $items,
                'block_id'   => $bid,
            ];
        }
    }

    return ['blocks' => $result, 'question_ids' => $questionIds];
}

function lt_setting_int(string $key, int $default): int
{
    if (function_exists('get_setting')) {
        $value = (string)get_setting($key, (string)$default);
        if (preg_match('/^\d+$/', $value)) {
            return max(1, (int)$value);
        }
    }
    return max(1, $default);
}

function lt_setting_bool(string $key, bool $default): bool
{
    if (function_exists('get_setting')) {
        $value = strtolower(trim((string)get_setting($key, $default ? '1' : '0')));
        if (in_array($value, ['1', 'true', 'yes', 'on'], true)) return true;
        if (in_array($value, ['0', 'false', 'no', 'off'], true)) return false;
    }
    return $default;
}

function lt_normalize_level(string $level): string
{
    $level = strtoupper(trim($level));
    return in_array($level, ['A2', 'B1', 'B2', 'C1', 'C2'], true) ? $level : 'B1';
}

function lt_random_row(PDO $pdo, string $sql, array $params): ?array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    if (!$rows) {
        return null;
    }
    return $rows[array_rand($rows)];
}

function lt_build_writing_prompts(PDO $pdo, string $estimatedLevel): array
{
    lt_ensure_db_tables($pdo);
    $level = lt_normalize_level($estimatedLevel);

    $task1 = lt_random_row($pdo, "
        SELECT *
        FROM lt_writing_prompts
        WHERE task_type = 'task1'
          AND is_active = 1
        ORDER BY RAND()
        LIMIT 20
    ", []);

    $task2 = lt_random_row($pdo, "
        SELECT *
        FROM lt_writing_prompts
        WHERE task_type = 'task2'
          AND cefr_level = ?
          AND is_active = 1
        ORDER BY RAND()
        LIMIT 20
    ", [$level]);

    if (!$task2) {
        $task2 = lt_random_row($pdo, "
            SELECT *
            FROM lt_writing_prompts
            WHERE task_type = 'task2'
              AND is_active = 1
            ORDER BY RAND()
            LIMIT 20
        ", []);
    }

    $prompts = [];
    $ids = [];
    if ($task1) {
        $prompts['task1'] = lt_format_writing_prompt($task1);
        $ids['task1'] = (int)$task1['id'];
    }
    if ($task2) {
        $prompts['task2'] = lt_format_writing_prompt($task2);
        $ids['task2'] = (int)$task2['id'];
    }

    return ['prompts' => $prompts, 'prompt_ids' => $ids];
}

function lt_restore_writing_prompts(PDO $pdo, array $promptIds): array
{
    lt_ensure_db_tables($pdo);
    $result = [];
    $ids = array_values(array_filter(array_map('intval', $promptIds)));
    if (!$ids) {
        return $result;
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT * FROM lt_writing_prompts WHERE id IN ($placeholders)");
    $stmt->execute($ids);
    $rowsById = [];
    foreach ($stmt->fetchAll() as $row) {
        $rowsById[(int)$row['id']] = $row;
    }

    foreach (['task1', 'task2'] as $key) {
        $id = (int)($promptIds[$key] ?? 0);
        if ($id > 0 && isset($rowsById[$id])) {
            $result[$key] = lt_format_writing_prompt($rowsById[$id]);
        }
    }
    return $result;
}

function lt_format_writing_prompt(array $row): array
{
    return [
        'id' => (int)($row['id'] ?? 0),
        'task_type' => (string)($row['task_type'] ?? ''),
        'cefr_level' => (string)($row['cefr_level'] ?? ''),
        'title' => (string)($row['title'] ?? ''),
        'prompt_text' => (string)($row['prompt_text'] ?? ''),
        'instructions' => (string)($row['instructions'] ?? ''),
        'diagnostic_notes' => (string)($row['diagnostic_notes'] ?? ''),
        'word_range' => (string)($row['word_range'] ?? ''),
        'import_key' => (string)($row['import_key'] ?? ''),
    ];
}

function lt_build_speaking_prompts(PDO $pdo): array
{
    lt_ensure_db_tables($pdo);
    $phases = [
        'speaking_1' => 'warmup',
        'speaking_2' => 'description',
        'speaking_3' => 'discussion',
        'speaking_4' => 'abstract',
    ];

    $prompts = [];
    $ids = [];
    foreach ($phases as $slot => $phase) {
        $row = lt_random_row($pdo, "
            SELECT *
            FROM lt_speaking_prompts
            WHERE phase = ?
              AND is_active = 1
            ORDER BY RAND()
            LIMIT 20
        ", [$phase]);
        if ($row) {
            $prompts[$slot] = lt_format_speaking_prompt($row);
            $ids[$slot] = (int)$row['id'];
        }
    }

    return ['prompts' => $prompts, 'prompt_ids' => $ids];
}

function lt_restore_speaking_prompts(PDO $pdo, array $promptIds): array
{
    lt_ensure_db_tables($pdo);
    $result = [];
    $ids = array_values(array_filter(array_map('intval', $promptIds)));
    if (!$ids) {
        return $result;
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT * FROM lt_speaking_prompts WHERE id IN ($placeholders)");
    $stmt->execute($ids);
    $rowsById = [];
    foreach ($stmt->fetchAll() as $row) {
        $rowsById[(int)$row['id']] = $row;
    }

    foreach (['speaking_1', 'speaking_2', 'speaking_3', 'speaking_4'] as $slot) {
        $id = (int)($promptIds[$slot] ?? 0);
        if ($id > 0 && isset($rowsById[$id])) {
            $result[$slot] = lt_format_speaking_prompt($rowsById[$id]);
        }
    }
    return $result;
}

function lt_format_speaking_prompt(array $row): array
{
    $bullets = [];
    $rawBullets = $row['bullets'] ?? null;
    if (is_string($rawBullets) && $rawBullets !== '') {
        $decoded = json_decode($rawBullets, true);
        if (is_array($decoded)) {
            $bullets = array_values(array_filter(array_map('strval', $decoded), 'strlen'));
        }
    }
    if (!$bullets && !empty($row['prompt_text'])) {
        $bullets = array_values(array_filter(array_map('trim', preg_split('/\R/u', (string)$row['prompt_text'])), 'strlen'));
    }

    return [
        'id' => (int)($row['id'] ?? 0),
        'phase' => (string)($row['phase'] ?? ''),
        'target_level' => (string)($row['target_level'] ?? ''),
        'title' => (string)($row['title'] ?? ''),
        'prompt_text' => (string)($row['prompt_text'] ?? ''),
        'bullets' => $bullets,
        'image' => (string)($row['image_path'] ?? ''),
        'evaluation_notes' => (string)($row['evaluation_notes'] ?? ''),
        'import_key' => (string)($row['import_key'] ?? ''),
    ];
}

/* ────────────────────────────────────────────────────────────
   SCORING BY QUESTION IDs
──────────────────────────────────────────────────────────── */

/**
 * Score a section based on the question IDs that were shown.
 *
 * @param PDO   $pdo
 * @param array $answers     [slot => 'A'|'B'|'C'|'D'|'X']
 * @param array $questionIds [slot => question_id]
 */
function lt_score_by_ids(PDO $pdo, array $answers, array $questionIds): int
{
    if (empty($questionIds)) return 0;

    $ids = array_values($questionIds);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT id, correct_opt FROM lt_questions WHERE id IN ($placeholders)");
    $stmt->execute($ids);
    $correctMap = [];
    foreach ($stmt->fetchAll() as $row) {
        $correctMap[(int)$row['id']] = strtoupper((string)$row['correct_opt']);
    }

    $score = 0;
    foreach ($questionIds as $slot => $qid) {
        $answer  = strtoupper((string)($answers[$slot] ?? 'X'));
        $correct = $correctMap[$qid] ?? null;
        if ($correct && $answer === $correct) {
            $score++;
        }
    }
    return $score;
}

/* ────────────────────────────────────────────────────────────
   TEACHER CRUD HELPERS
──────────────────────────────────────────────────────────── */

function lt_get_all_for_teacher(PDO $pdo): array
{
    lt_ensure_db_tables($pdo);

    $blocks = $pdo->query("
        SELECT * FROM lt_blocks ORDER BY section ASC, block_number ASC
    ")->fetchAll();

    $result = [];
    foreach ($blocks as $blk) {
        $bid = (int)$blk['id'];
        $questions = $pdo->prepare("
            SELECT * FROM lt_questions
            WHERE block_id = ?
            ORDER BY item_number ASC, variant ASC
        ");
        $questions->execute([$bid]);
        $qRows = $questions->fetchAll();

        // Group by item_number
        $slots = [];
        foreach ($qRows as $q) {
            $slots[(int)$q['item_number']][] = $q;
        }
        ksort($slots);

        $blk['slots'] = $slots;
        $result[] = $blk;
    }
    return $result;
}

function lt_get_question(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM lt_questions WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function lt_get_block(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM lt_blocks WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/** Count how many active variants exist for a slot (used to prevent deleting the last one) */
function lt_count_active_variants(PDO $pdo, int $blockId, int $itemNumber): int
{
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM lt_questions
        WHERE block_id = ? AND item_number = ? AND is_active = 1
    ");
    $stmt->execute([$blockId, $itemNumber]);
    return (int)$stmt->fetchColumn();
}

/** Get next variant number for a slot */
function lt_next_variant(PDO $pdo, int $blockId, int $itemNumber): int
{
    $stmt = $pdo->prepare("
        SELECT COALESCE(MAX(variant), 0) + 1 FROM lt_questions
        WHERE block_id = ? AND item_number = ?
    ");
    $stmt->execute([$blockId, $itemNumber]);
    return (int)$stmt->fetchColumn();
}

/** Get next item_number (new question slot) for a block */
function lt_next_item_number(PDO $pdo, int $blockId): int
{
    $stmt = $pdo->prepare("
        SELECT COALESCE(MAX(item_number), 0) + 1 FROM lt_questions
        WHERE block_id = ?
    ");
    $stmt->execute([$blockId]);
    return (int)$stmt->fetchColumn();
}

/**
 * Restore block structures from stored question IDs (for re-displaying same variants).
 * Used by start.php to show the same questions the student was already given.
 *
 * @param PDO    $pdo
 * @param string $section       'listening' | 'reading'
 * @param array  $questionIds   [slot => question_id]
 */
function lt_restore_blocks(PDO $pdo, string $section, array $questionIds): array
{
    if (empty($questionIds)) return [];

    $ids          = array_values($questionIds);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    $stmt = $pdo->prepare("
        SELECT q.*,
               b.audio_path, b.passage_ar, b.passage_en,
               b.block_number, b.id AS bid
        FROM lt_questions q
        JOIN lt_blocks b ON b.id = q.block_id
        WHERE q.id IN ($placeholders)
        ORDER BY b.block_number ASC, q.item_number ASC
    ");
    $stmt->execute($ids);
    $rows = $stmt->fetchAll();

    // Build slot → qid index for ordering
    $slotToQid = $questionIds;         // [slot => qid]
    $qidToSlot = array_flip($questionIds); // [qid => slot] (assuming unique qids)

    $rowsById = [];
    foreach ($rows as $row) {
        $rowsById[(int)$row['id']] = $row;
    }

    $byBlock = [];
    foreach ($questionIds as $qid) {
        $qid = (int)$qid;
        if (!isset($rowsById[$qid])) {
            continue;
        }
        $row = $rowsById[$qid];
        $bn = (int)$row['block_number'];
        $key = (int)$row['bid'];
        if (!isset($byBlock[$key])) {
            $byBlock[$key] = [
                'block_id'   => (int)$row['bid'],
                'audio'      => (string)$row['audio_path'],
                'passage'    => (string)$row['passage_ar'],
                'passage_en' => (string)$row['passage_en'],
                'items'      => [],
            ];
        }
        $opts   = [
            'A' => (string)$row['opt_a_ar'],
            'B' => (string)$row['opt_b_ar'],
            'C' => (string)$row['opt_c_ar'],
        ];
        $optsEn = [
            'A' => (string)$row['opt_a_en'],
            'B' => (string)$row['opt_b_en'],
            'C' => (string)$row['opt_c_en'],
        ];
        if (!empty($row['opt_d_ar'])) {
            $opts['D']   = (string)$row['opt_d_ar'];
            $optsEn['D'] = (string)$row['opt_d_en'];
        }
        $byBlock[$key]['items'][] = [
            'id'      => $qid,
            'q'       => (string)$row['question_ar'],
            'q_en'    => (string)$row['question_en'],
            'opts'    => $opts,
            'opts_en' => $optsEn,
        ];
    }
    return array_values($byBlock);
}

function lt_save_attempt_snapshot(PDO $pdo, int $attemptId, string $section, array $questionIds): void
{
    lt_ensure_db_tables($pdo);
    if ($attemptId <= 0 || empty($questionIds)) {
        return;
    }

    $ids = array_values(array_filter(array_map('intval', $questionIds)));
    if (!$ids) {
        return;
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("
        SELECT q.*,
               b.section,
               b.block_number,
               b.audio_path,
               b.passage_ar,
               b.passage_en,
               b.cefr_level
        FROM lt_questions q
        JOIN lt_blocks b ON b.id = q.block_id
        WHERE q.id IN ($placeholders)
    ");
    $stmt->execute($ids);

    $rowsById = [];
    foreach ($stmt->fetchAll() as $row) {
        $rowsById[(int)$row['id']] = $row;
    }

    $insert = $pdo->prepare("
        INSERT INTO leveltest_attempt_snapshots
            (attempt_id, section, source_entity_type, source_entity_id, display_order, snapshot_data)
        VALUES (?, ?, 'lt_question', ?, ?, ?)
    ");

    foreach ($questionIds as $displayOrder => $questionId) {
        $questionId = (int)$questionId;
        if (!isset($rowsById[$questionId])) {
            continue;
        }
        $row = $rowsById[$questionId];
        $snapshot = [
            'question_id' => $questionId,
            'block_id' => (int)$row['block_id'],
            'block_number' => (int)$row['block_number'],
            'item_number' => (int)$row['item_number'],
            'variant' => (int)$row['variant'],
            'cefr_level' => (string)$row['cefr_level'],
            'audio_path' => (string)$row['audio_path'],
            'passage_ar' => (string)$row['passage_ar'],
            'passage_en' => (string)$row['passage_en'],
            'question_ar' => (string)$row['question_ar'],
            'question_en' => (string)$row['question_en'],
            'options' => [
                'A' => (string)$row['opt_a_ar'],
                'B' => (string)$row['opt_b_ar'],
                'C' => (string)$row['opt_c_ar'],
                'D' => (string)$row['opt_d_ar'],
            ],
            'correct_opt' => (string)$row['correct_opt'],
        ];
        $insert->execute([
            $attemptId,
            $section,
            $questionId,
            (int)$displayOrder,
            json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    }
}

function lt_save_prompt_snapshot(PDO $pdo, int $attemptId, string $section, array $promptIds): void
{
    lt_ensure_db_tables($pdo);
    if ($attemptId <= 0 || empty($promptIds)) {
        return;
    }

    $section = $section === 'speaking' ? 'speaking' : 'writing';
    $table = $section === 'speaking' ? 'lt_speaking_prompts' : 'lt_writing_prompts';
    $sourceType = $section === 'speaking' ? 'lt_speaking_prompt' : 'lt_writing_prompt';
    $ids = array_values(array_filter(array_map('intval', $promptIds)));
    if (!$ids) {
        return;
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT * FROM $table WHERE id IN ($placeholders)");
    $stmt->execute($ids);
    $rowsById = [];
    foreach ($stmt->fetchAll() as $row) {
        $rowsById[(int)$row['id']] = $row;
    }

    $insert = $pdo->prepare("
        INSERT INTO leveltest_attempt_snapshots
            (attempt_id, section, source_entity_type, source_entity_id, display_order, snapshot_data)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $order = 1;
    foreach ($promptIds as $slot => $promptId) {
        $promptId = (int)$promptId;
        if ($promptId <= 0 || !isset($rowsById[$promptId])) {
            continue;
        }
        $row = $rowsById[$promptId];
        $snapshot = $section === 'speaking'
            ? lt_format_speaking_prompt($row)
            : lt_format_writing_prompt($row);
        $snapshot['slot'] = (string)$slot;

        $insert->execute([
            $attemptId,
            $section,
            $sourceType,
            $promptId,
            $order++,
            json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    }
}
