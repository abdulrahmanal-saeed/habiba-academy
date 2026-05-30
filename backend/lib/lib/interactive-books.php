<?php
declare(strict_types=1);

require_once __DIR__ . '/platform-notifications.php';
require_once __DIR__ . '/learning-audit.php';

if (function_exists('interactive_books_ensure_schema')) {
    return;
}

function interactive_books_ensure_schema(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title_en VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            level VARCHAR(50) NOT NULL DEFAULT '',
            description_en TEXT NULL,
            description_ar TEXT NULL,
            cover_image VARCHAR(255) NULL,
            status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_lessons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            lesson_number INT NOT NULL,
            unit_type ENUM('lesson','review') NOT NULL DEFAULT 'lesson',
            sort_order DECIMAL(5,2) NULL,
            title_en VARCHAR(255) NOT NULL,
            title_ar VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            goal_en TEXT NULL,
            goal_ar TEXT NULL,
            status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            UNIQUE KEY uniq_book_lesson_number (book_id, lesson_number),
            KEY idx_book_lessons_book (book_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM book_lessons")->fetchAll(PDO::FETCH_COLUMN) ?: [];
        if (!in_array('unit_type', $cols, true)) {
            $pdo->exec("ALTER TABLE book_lessons ADD COLUMN unit_type ENUM('lesson','review') NOT NULL DEFAULT 'lesson' AFTER lesson_number");
        }
        if (!in_array('sort_order', $cols, true)) {
            $pdo->exec("ALTER TABLE book_lessons ADD COLUMN sort_order DECIMAL(5,2) NULL AFTER unit_type");
        }
        if (!in_array('content_json', $cols, true)) {
            $pdo->exec("ALTER TABLE book_lessons ADD COLUMN content_json LONGTEXT NULL AFTER goal_ar");
        }
    } catch (Throwable) {
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_book_access (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            book_id INT NOT NULL,
            access_status ENUM('locked','active','completed','expired') NOT NULL DEFAULT 'active',
            purchase_status ENUM('free','paid','included','manual') NOT NULL DEFAULT 'manual',
            unlocked_by_teacher_id INT NULL,
            started_at DATETIME NULL,
            completed_at DATETIME NULL,
            expires_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_student_book_access (student_id, book_id),
            KEY idx_student_book_access_book (book_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_lesson_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            book_id INT NOT NULL,
            lesson_id INT NOT NULL,
            status ENUM('draft','in_progress','submitted','needs_correction','feedback_sent','completed','resubmitted') NOT NULL DEFAULT 'draft',
            answers_json LONGTEXT NULL,
            auto_score DECIMAL(5,2) NOT NULL DEFAULT 0,
            teacher_score DECIMAL(5,2) NULL,
            submitted_at DATETIME NULL,
            reviewed_at DATETIME NULL,
            reviewed_by INT NULL,
            final_feedback TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            KEY idx_book_submission_student (student_id),
            KEY idx_book_submission_status (status),
            KEY idx_book_submission_lesson (lesson_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_speaking_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            submission_id INT NULL,
            student_id INT NOT NULL,
            book_id INT NOT NULL,
            lesson_id INT NOT NULL,
            audio_url VARCHAR(500) NOT NULL,
            original_filename VARCHAR(255) NULL,
            mime_type VARCHAR(100) NULL,
            duration_seconds INT NULL,
            teacher_feedback TEXT NULL,
            pronunciation_note TEXT NULL,
            fluency_note TEXT NULL,
            correction_note TEXT NULL,
            score DECIMAL(5,2) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_book_speaking_submission (submission_id),
            KEY idx_book_speaking_student_lesson (student_id, lesson_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_audio_activity (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            book_id INT NOT NULL,
            lesson_id INT NOT NULL,
            audio_key VARCHAR(100) NOT NULL,
            play_count INT NOT NULL DEFAULT 0,
            first_played_at DATETIME NULL,
            last_played_at DATETIME NULL,
            marked_practiced TINYINT(1) NOT NULL DEFAULT 0,
            UNIQUE KEY uniq_book_audio_activity (student_id, lesson_id, audio_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS book_feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            submission_id INT NOT NULL,
            teacher_id INT NOT NULL DEFAULT 0,
            feedback_type ENUM('writing','speaking','general','correction') NOT NULL DEFAULT 'general',
            feedback_text TEXT NULL,
            audio_feedback_url VARCHAR(500) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_book_feedback_submission (submission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    interactive_books_seed_lesson_one($pdo);
    $done = true;
}

function interactive_books_seed_lesson_one(PDO $pdo): void
{
    $stmt = $pdo->prepare("SELECT id FROM books WHERE slug = ? LIMIT 1");
    $stmt->execute(['arabic-for-daily-life-beginner']);
    $bookId = (int)($stmt->fetchColumn() ?: 0);

    if (!$bookId) {
        $ins = $pdo->prepare("
            INSERT INTO books (title_en, title_ar, slug, level, description_en, description_ar, status, price)
            VALUES (?, ?, ?, ?, ?, ?, 'published', 0)
        ");
        $ins->execute([
            'Arabic for Daily Life - Beginner Level',
            'العربية للحياة اليومية - المستوى المبتدئ',
            'arabic-for-daily-life-beginner',
            'A0-A1',
            'A practical interactive Arabic workbook for daily-life communication.',
            'كتاب تفاعلي عملي لتعلم العربية في مواقف الحياة اليومية.',
        ]);
        $bookId = (int)$pdo->lastInsertId();
    } else {
        $pdo->prepare("UPDATE books SET status = 'published', updated_at = NOW() WHERE id = ?")->execute([$bookId]);
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 1 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 1, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Introduce Yourself',
            'عرّف نفسك',
            'lesson-1-introduce-yourself',
            'By the end of this lesson, the student can introduce themselves in Arabic using 3-5 simple sentences and ask another person basic personal questions.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يقدم نفسه باللغة العربية باستخدام 3-5 جمل بسيطة، ويسأل شخصًا آخر أسئلة شخصية بسيطة.',
        ]);
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 2 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 2, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Numbers, Age & Phone Number',
            'الأرقام، العمر، ورقم الهاتف',
            'lesson-2-numbers-age-phone-number',
            'By the end of this lesson, the student can say numbers from 0 to 20, say their age, ask about age, say their phone number, and ask for a phone number in simple Arabic.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يقول الأرقام من 0 إلى 20، ويقول عمره، ويسأل عن العمر، ويقول رقم هاتفه، ويسأل عن رقم هاتف شخص آخر باللغة العربية البسيطة.',
        ]);
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 3 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 3, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Family',
            'الأُسْرَة',
            'lesson-3-family',
            'By the end of this lesson, the student can name basic family members and talk about their family using simple Arabic sentences.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يسمي أفراد الأسرة الأساسيين ويتحدث عن أسرته بجمل عربية بسيطة.',
        ]);
    }
    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 4 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 4, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Food & Drinks',
            'الطَّعام وَالشَّراب',
            'lesson-4-food-drinks',
            'By the end of this lesson, the student can name basic food and drink items and make a simple order in Arabic.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يسمي بعض أنواع الطعام والشراب ويطلب طلبًا بسيطًا باللغة العربية.',
        ]);
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND slug = ? LIMIT 1");
    $stmt->execute([$bookId, 'review-1-lessons-1-to-4']);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 101, 'review', 4.50, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Review 1: Lessons 1-4',
            'مُراجَعَة ١: الدُّروس ١-٤',
            'review-1-lessons-1-to-4',
            'By the end of this review, the student can combine the language from Lessons 1-4 in speaking and writing.',
            'في نهاية هذه المراجعة، يستطيع الطالب أن يجمع اللغة التي تعلمها في الدروس ١-٤ في التحدث والكتابة.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'review', sort_order = 4.50, status = 'published' WHERE book_id = ? AND slug = ?")
                ->execute([$bookId, 'review-1-lessons-1-to-4']);
        } catch (Throwable) {
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 5 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 5, 'lesson', 5.00, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Shopping',
            'التَّسَوُّق',
            'lesson-5-shopping',
            'By the end of this lesson, the student can ask about prices and make a simple purchase in Arabic.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يسأل عن الأسعار ويقوم بعملية شراء بسيطة باللغة العربية.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'lesson', sort_order = 5.00, status = 'published', slug = 'lesson-5-shopping' WHERE book_id = ? AND lesson_number = 5")
                ->execute([$bookId]);
        } catch (Throwable) {
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 6 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 6, 'lesson', 6.00, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Colors & Objects',
            'الأَلْوان وَالأَشْياء',
            'lesson-6-colors-objects',
            'By the end of this lesson, the student can name basic colors and describe simple objects in Arabic.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يسمي الألوان الأساسية ويصف أشياء بسيطة باللغة العربية.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'lesson', sort_order = 6.00, status = 'published', slug = 'lesson-6-colors-objects' WHERE book_id = ? AND lesson_number = 6")
                ->execute([$bookId]);
        } catch (Throwable) {
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 7 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 7, 'lesson', 7.00, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Home & Places',
            'البَيْت وَالأَماكِن',
            'lesson-7-home-places',
            'By the end of this lesson, the student can name basic rooms and places and describe simple locations in Arabic.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يسمي غرفًا وأماكن أساسية ويصف أماكن بسيطة باللغة العربية.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'lesson', sort_order = 7.00, status = 'published', slug = 'lesson-7-home-places' WHERE book_id = ? AND lesson_number = 7")
                ->execute([$bookId]);
        } catch (Throwable) {
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 8 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 8, 'lesson', 8.00, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Time & Daily Routine',
            'الوَقْت وَالرُّوتين اليَوْمي',
            'lesson-8-time-daily-routine',
            'By the end of this lesson, the student can say simple times and describe a basic daily routine in Arabic.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يقول الوقت بطريقة بسيطة ويصف روتينه اليومي باللغة العربية.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'lesson', sort_order = 8.00, status = 'published', slug = 'lesson-8-time-daily-routine' WHERE book_id = ? AND lesson_number = 8")
                ->execute([$bookId]);
        } catch (Throwable) {
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND slug = ? LIMIT 1");
    $stmt->execute([$bookId, 'review-2-lessons-5-to-8']);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 102, 'review', 8.50, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Review 2: Lessons 5-8',
            'مُراجَعَة ٢: الدُّروس ٥-٨',
            'review-2-lessons-5-to-8',
            'By the end of this review, the student can combine the language from Lessons 5-8 in speaking and writing.',
            'في نهاية هذه المراجعة، يستطيع الطالب أن يجمع اللغة التي تعلمها في الدروس ٥-٨ في التحدث والكتابة.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'review', sort_order = 8.50, status = 'published' WHERE book_id = ? AND slug = ?")
                ->execute([$bookId, 'review-2-lessons-5-to-8']);
        } catch (Throwable) {
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 9 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 9, 'lesson', 9.00, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Directions',
            'الاتِّجاهات',
            'lesson-9-directions',
            'By the end of this lesson, the student can ask for directions and give very simple directions in Arabic.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يسأل عن الاتجاهات ويعطي اتجاهات بسيطة جدًا باللغة العربية.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'lesson', sort_order = 9.00, status = 'published', slug = 'lesson-9-directions' WHERE book_id = ? AND lesson_number = 9")
                ->execute([$bookId]);
        } catch (Throwable) {
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 10 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 10, 'lesson', 10.00, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Work & Jobs',
            'العَمَل وَالوَظائِف',
            'lesson-10-work-jobs',
            'By the end of this lesson, the student can name common jobs, say where they work, and describe simple work tasks in Arabic.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يسمي بعض الوظائف الشائعة، ويقول أين يعمل، ويصف مهام عمل بسيطة باللغة العربية.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'lesson', sort_order = 10.00, status = 'published', slug = 'lesson-10-work-jobs' WHERE book_id = ? AND lesson_number = 10")
                ->execute([$bookId]);
        } catch (Throwable) {
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 11 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 11, 'lesson', 11.00, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Health & Body',
            'الصِّحَّة وَالجِسْم',
            'lesson-11-health-body',
            'By the end of this lesson, the student can name basic body parts, describe simple pain, and ask for help in Arabic.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يسمي أجزاء الجسم الأساسية، ويصف ألمًا بسيطًا، ويطلب المساعدة باللغة العربية.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'lesson', sort_order = 11.00, status = 'published', slug = 'lesson-11-health-body' WHERE book_id = ? AND lesson_number = 11")
                ->execute([$bookId]);
        } catch (Throwable) {
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND lesson_number = 12 LIMIT 1");
    $stmt->execute([$bookId]);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 12, 'lesson', 12.00, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Full Daily Conversation',
            'مُحادَثَة يَوْمِيَّة كامِلَة',
            'lesson-12-full-daily-conversation',
            'By the end of this lesson, the student can combine the whole beginner book language in one simple daily Arabic conversation.',
            'في نهاية هذا الدرس، يستطيع الطالب أن يجمع لغة الكتاب كله في محادثة عربية يومية بسيطة.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'lesson', sort_order = 12.00, status = 'published', slug = 'lesson-12-full-daily-conversation' WHERE book_id = ? AND lesson_number = 12")
                ->execute([$bookId]);
        } catch (Throwable) {
        }
    }

    $stmt = $pdo->prepare("SELECT id FROM book_lessons WHERE book_id = ? AND slug = ? LIMIT 1");
    $stmt->execute([$bookId, 'final-review-beginner']);
    if ((int)($stmt->fetchColumn() ?: 0) === 0) {
        $ins = $pdo->prepare("
            INSERT INTO book_lessons (book_id, lesson_number, unit_type, sort_order, title_en, title_ar, slug, goal_en, goal_ar, status)
            VALUES (?, 103, 'review', 12.50, ?, ?, ?, ?, ?, 'published')
        ");
        $ins->execute([
            $bookId,
            'Final Review',
            'المُراجَعَة النِّهائِيَّة',
            'final-review-beginner',
            'By the end of this Final Review, the student can use beginner Arabic in practical daily-life situations across the full book.',
            'في نهاية هذه المراجعة النهائية، يستطيع الطالب استخدام العربية للمبتدئين في مواقف الحياة اليومية من الكتاب كاملًا.',
        ]);
    } else {
        try {
            $pdo->prepare("UPDATE book_lessons SET unit_type = 'review', sort_order = 12.50, status = 'published' WHERE book_id = ? AND slug = ?")
                ->execute([$bookId, 'final-review-beginner']);
        } catch (Throwable) {
        }
    }
}

function interactive_books_beginner_book(PDO $pdo): ?array
{
    interactive_books_ensure_schema($pdo);
    $stmt = $pdo->prepare("SELECT * FROM books WHERE slug = ? AND status = 'published' LIMIT 1");
    $stmt->execute(['arabic-for-daily-life-beginner']);
    $book = $stmt->fetch(PDO::FETCH_ASSOC);
    return $book ?: null;
}

function interactive_books_lesson(PDO $pdo, int $lessonId): ?array
{
    interactive_books_ensure_schema($pdo);
    $stmt = $pdo->prepare("
        SELECT bl.*, b.title_en AS book_title_en, b.title_ar AS book_title_ar, b.level AS book_level
        FROM book_lessons bl
        JOIN books b ON b.id = bl.book_id
        WHERE bl.id = ? AND bl.status = 'published' AND b.status = 'published'
        LIMIT 1
    ");
    $stmt->execute([$lessonId]);
    $lesson = $stmt->fetch(PDO::FETCH_ASSOC);
    return $lesson ?: null;
}

/**
 * All published lessons for a book, ordered the way students progress through them.
 * Used by book-view (lesson list) and book-lesson (prev/next navigation).
 *
 * @return array<int, array<string, mixed>>
 */
function interactive_books_published_lessons(PDO $pdo, int $bookId): array
{
    $stmt = $pdo->prepare("
        SELECT id, lesson_number, unit_type, title_en, title_ar, slug
        FROM book_lessons
        WHERE book_id = ? AND status = 'published'
        ORDER BY COALESCE(sort_order, lesson_number) ASC, lesson_number ASC, id ASC
    ");
    $stmt->execute([$bookId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function interactive_books_student_can_access(PDO $pdo, int $studentId, int $bookId): bool
{
    $requiresPackageAccess = false;
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'book_packages'");
        $stmt->execute();
        if ((int)$stmt->fetchColumn() > 0) {
            $pkg = $pdo->prepare("SELECT COUNT(*) FROM book_packages WHERE book_id = ? AND status = 'active'");
            $pkg->execute([$bookId]);
            $requiresPackageAccess = (int)$pkg->fetchColumn() > 0;
        }
    } catch (Throwable) {
        $requiresPackageAccess = false;
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM student_book_access WHERE book_id = ?");
    $stmt->execute([$bookId]);
    $hasAccessSystemRows = (int)$stmt->fetchColumn() > 0;

    if (!$hasAccessSystemRows && !$requiresPackageAccess) {
        return true;
    }

    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM student_book_access
        WHERE student_id = ? AND book_id = ? AND access_status = 'active'
          AND (expires_at IS NULL OR expires_at >= NOW())
    ");
    $stmt->execute([$studentId, $bookId]);
    return (int)$stmt->fetchColumn() > 0;
}

function interactive_books_touch_access(PDO $pdo, int $studentId, int $bookId): void
{
    try {
        if (!interactive_books_student_can_access($pdo, $studentId, $bookId)) {
            return;
        }
        $stmt = $pdo->prepare("
            INSERT INTO student_book_access (student_id, book_id, access_status, purchase_status, started_at)
            VALUES (?, ?, 'active', 'manual', NOW())
            ON DUPLICATE KEY UPDATE
                started_at = COALESCE(started_at, NOW()),
                access_status = access_status
        ");
        $stmt->execute([$studentId, $bookId]);
    } catch (Throwable) {
    }
}

function interactive_books_current_submission(PDO $pdo, int $studentId, int $lessonId): ?array
{
    $stmt = $pdo->prepare("
        SELECT *
        FROM book_lesson_submissions
        WHERE student_id = ? AND lesson_id = ?
        ORDER BY id DESC
        LIMIT 1
    ");
    $stmt->execute([$studentId, $lessonId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function interactive_books_get_or_create_submission(PDO $pdo, int $studentId, int $bookId, int $lessonId): int
{
    $existing = interactive_books_current_submission($pdo, $studentId, $lessonId);
    if ($existing && in_array((string)$existing['status'], ['draft', 'in_progress'], true)) {
        return (int)$existing['id'];
    }

    $stmt = $pdo->prepare("
        INSERT INTO book_lesson_submissions (student_id, book_id, lesson_id, status, created_at)
        VALUES (?, ?, ?, 'in_progress', NOW())
    ");
    $stmt->execute([$studentId, $bookId, $lessonId]);
    return (int)$pdo->lastInsertId();
}

function interactive_books_lesson_one_content(): array
{
    return interactive_books_lesson_content(1);
}

function interactive_books_lesson_two_content(): array
{
    return interactive_books_lesson_content(2);
}

function interactive_books_lesson_content(int $lessonNumber, string $slug = ''): array
{
    $base = __DIR__ . '/../interactive-books/arabic-for-daily-life-beginner/lessons/';
    $path = $slug !== '' ? $base . $slug . '.php' : '';
    if ($path === '' || !is_file($path)) {
        $path = $base . 'lesson-' . $lessonNumber . '.php';
    }
    if (!is_file($path)) {
        $path = $base . 'lesson-1.php';
    }
    $content = require $path;
    return is_array($content) ? $content : [];
}

function interactive_books_normalize_arabic_answer(string $value): string
{
    $value = trim($value);
    $value = str_replace(['.', '،', ',', '؟', '?', 'ـ'], '', $value);
    $value = preg_replace('/\s+/u', ' ', $value) ?: '';
    return trim($value);
}

function interactive_books_score_answers(array $answers, int $lessonNumber = 1, string $slug = ''): array
{
    $content = interactive_books_lesson_content($lessonNumber, $slug);
    $score = 0;
    $total = count($content['mcq'] ?? []) + count($content['arrange_words'] ?? []) + count($content['number_recognition'] ?? []) + count($content['listening_numbers'] ?? []) + count($content['matching'] ?? []) + count($content['category_practice'] ?? []) + count($content['listening_review'] ?? []) + count($content['price_recognition'] ?? []) + count($content['color_recognition'] ?? []) + count($content['description_matching'] ?? []) + count($content['time_recognition'] ?? []) + count($content['daily_action_matching'] ?? []) + count($content['sequence_practice'] ?? []) + count($content['direction_matching'] ?? []) + count($content['direction_recognition'] ?? []) + count($content['job_matching'] ?? []) + count($content['workplace_matching'] ?? []) + count($content['work_sentence_practice'] ?? []) + count($content['body_matching'] ?? []) + count($content['health_phrase_matching'] ?? []) + count($content['pain_sentence_practice'] ?? []) + count($content['conversation_phrase_matching'] ?? []) + count($content['topic_recognition'] ?? []) + count($content['reading_comprehension'] ?? []) + count($content['vocabulary_matching'] ?? []) + count($content['topic_category'] ?? []);

    $mcqRows = [];
    foreach (($content['mcq'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['mcq'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $mcqRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $arrangeRows = [];
    foreach (($content['arrange_words'] ?? []) as $q) {
        $answer = trim((string)($answers['arrange_words'][$q['id']] ?? ''));
        $correct = interactive_books_normalize_arabic_answer($answer) === interactive_books_normalize_arabic_answer($q['correct']);
        if ($correct) {
            $score++;
        }
        $arrangeRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $numberRows = [];
    foreach (($content['number_recognition'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['number_recognition'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $numberRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $listeningRows = [];
    foreach (($content['listening_numbers'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['listening_numbers'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $listeningRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $listeningReviewRows = [];
    foreach (($content['listening_review'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['listening_review'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $listeningReviewRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $matchingRows = [];
    foreach (($content['matching'] ?? []) as $q) {
        $answer = trim((string)($answers['matching'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $matchingRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $categoryRows = [];
    foreach (($content['category_practice'] ?? []) as $q) {
        $answer = trim((string)($answers['category_practice'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $categoryRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $priceRows = [];
    foreach (($content['price_recognition'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['price_recognition'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $priceRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $colorRows = [];
    foreach (($content['color_recognition'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['color_recognition'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $colorRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $descriptionRows = [];
    foreach (($content['description_matching'] ?? []) as $q) {
        $answer = trim((string)($answers['description_matching'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $descriptionRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $timeRows = [];
    foreach (($content['time_recognition'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['time_recognition'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $timeRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $dailyActionRows = [];
    foreach (($content['daily_action_matching'] ?? []) as $q) {
        $answer = trim((string)($answers['daily_action_matching'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $dailyActionRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $sequenceRows = [];
    foreach (($content['sequence_practice'] ?? []) as $q) {
        $answer = (int)($answers['sequence_practice'][$q['id']] ?? 0);
        $correct = $answer > 0 && $answer === (int)($q['correct_order'] ?? 0);
        if ($correct) {
            $score++;
        }
        $sequenceRows[] = [
            'question_id' => $q['id'],
            'answer' => $answer,
            'sentence' => (string)($q['sentence'] ?? ''),
            'is_correct' => $correct,
        ];
    }

    $directionMatchingRows = [];
    foreach (($content['direction_matching'] ?? []) as $q) {
        $answer = trim((string)($answers['direction_matching'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $directionMatchingRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $directionRecognitionRows = [];
    foreach (($content['direction_recognition'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['direction_recognition'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $directionRecognitionRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $jobMatchingRows = [];
    foreach (($content['job_matching'] ?? []) as $q) {
        $answer = trim((string)($answers['job_matching'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $jobMatchingRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $workplaceMatchingRows = [];
    foreach (($content['workplace_matching'] ?? []) as $q) {
        $answer = trim((string)($answers['workplace_matching'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $workplaceMatchingRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $workSentenceRows = [];
    foreach (($content['work_sentence_practice'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['work_sentence_practice'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $workSentenceRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $bodyMatchingRows = [];
    foreach (($content['body_matching'] ?? []) as $q) {
        $answer = trim((string)($answers['body_matching'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $bodyMatchingRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $healthPhraseMatchingRows = [];
    foreach (($content['health_phrase_matching'] ?? []) as $q) {
        $answer = trim((string)($answers['health_phrase_matching'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $healthPhraseMatchingRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $painSentenceRows = [];
    foreach (($content['pain_sentence_practice'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['pain_sentence_practice'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $painSentenceRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $conversationPhraseRows = [];
    foreach (($content['conversation_phrase_matching'] ?? []) as $q) {
        $answer = trim((string)($answers['conversation_phrase_matching'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $conversationPhraseRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $topicRecognitionRows = [];
    foreach (($content['topic_recognition'] ?? []) as $q) {
        $answer = trim((string)($answers['topic_recognition'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $topicRecognitionRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $readingRows = [];
    foreach (($content['reading_comprehension'] ?? []) as $q) {
        $answer = strtoupper(trim((string)($answers['reading_comprehension'][$q['id']] ?? '')));
        $correct = $answer !== '' && $answer === $q['correct'];
        if ($correct) {
            $score++;
        }
        $readingRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $vocabularyMatchingRows = [];
    foreach (($content['vocabulary_matching'] ?? []) as $q) {
        $answer = trim((string)($answers['vocabulary_matching'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $vocabularyMatchingRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $topicCategoryRows = [];
    foreach (($content['topic_category'] ?? []) as $q) {
        $answer = trim((string)($answers['topic_category'][$q['id']] ?? ''));
        $correct = $answer !== '' && mb_strtolower($answer) === mb_strtolower((string)$q['correct']);
        if ($correct) {
            $score++;
        }
        $topicCategoryRows[] = ['question_id' => $q['id'], 'answer' => $answer, 'is_correct' => $correct];
    }

    $autoPercent = $total > 0 ? round(($score / $total) * 100, 2) : 0.0;
    return [$score, $total, $autoPercent, $mcqRows, $arrangeRows, $numberRows, $listeningRows, $matchingRows, $categoryRows, $listeningReviewRows, $priceRows, $colorRows, $descriptionRows, $timeRows, $dailyActionRows, $sequenceRows, $directionMatchingRows, $directionRecognitionRows, $jobMatchingRows, $workplaceMatchingRows, $workSentenceRows, $bodyMatchingRows, $healthPhraseMatchingRows, $painSentenceRows, $conversationPhraseRows, $topicRecognitionRows, $readingRows, $vocabularyMatchingRows, $topicCategoryRows];
}

function interactive_books_build_answers_json(array $input, int $lessonNumber = 1, string $slug = ''): array
{
    [, , $autoPercent, $mcqRows, $arrangeRows, $numberRows, $listeningRows, $matchingRows, $categoryRows, $listeningReviewRows, $priceRows, $colorRows, $descriptionRows, $timeRows, $dailyActionRows, $sequenceRows, $directionMatchingRows, $directionRecognitionRows, $jobMatchingRows, $workplaceMatchingRows, $workSentenceRows, $bodyMatchingRows, $healthPhraseMatchingRows, $painSentenceRows, $conversationPhraseRows, $topicRecognitionRows, $readingRows, $vocabularyMatchingRows, $topicCategoryRows] = interactive_books_score_answers($input, $lessonNumber, $slug);
    $content = interactive_books_lesson_content($lessonNumber, $slug);

    $complete = [];
    foreach (($content['complete_sentence'] ?? []) as $q) {
        $complete[] = ['question_id' => $q['id'], 'answer' => trim((string)($input['complete_sentence'][$q['id']] ?? ''))];
    }

    $completeConversation = [];
    foreach (($content['complete_conversation'] ?? []) as $q) {
        $completeConversation[] = ['question_id' => $q['id'], 'answer' => trim((string)($input['complete_conversation'][$q['id']] ?? ''))];
    }

    $writingTasks = [];
    foreach (($content['writing_tasks'] ?? []) as $task) {
        $key = (string)($task['key'] ?? '');
        if ($key !== '') {
            $writingTasks[$key] = ['answer' => trim((string)($input['writing_tasks'][$key] ?? ''))];
        }
    }

    return [
        'answers' => [
            'warmup' => $input['warmup'] ?? [],
            'mcq' => $mcqRows,
            'number_recognition' => $numberRows,
            'category_practice' => $categoryRows,
            'listening_review' => $listeningReviewRows,
            'price_recognition' => $priceRows,
            'color_recognition' => $colorRows,
            'description_matching' => $descriptionRows,
            'time_recognition' => $timeRows,
            'daily_action_matching' => $dailyActionRows,
            'sequence_practice' => $sequenceRows,
            'direction_matching' => $directionMatchingRows,
            'direction_recognition' => $directionRecognitionRows,
            'job_matching' => $jobMatchingRows,
            'workplace_matching' => $workplaceMatchingRows,
            'work_sentence_practice' => $workSentenceRows,
            'body_matching' => $bodyMatchingRows,
            'health_phrase_matching' => $healthPhraseMatchingRows,
            'pain_sentence_practice' => $painSentenceRows,
            'conversation_phrase_matching' => $conversationPhraseRows,
            'topic_recognition' => $topicRecognitionRows,
            'reading_comprehension' => $readingRows,
            'vocabulary_matching' => $vocabularyMatchingRows,
            'topic_category' => $topicCategoryRows,
            'matching' => $matchingRows,
            'complete_sentence' => $complete,
            'complete_conversation' => $completeConversation,
            'arrange_words' => $arrangeRows,
            'listening_numbers' => $listeningRows,
            'writing_task' => ['answer' => trim((string)($input['writing_task'] ?? ''))],
            'writing_tasks' => $writingTasks,
            'speaking_task' => [
                'audio_url' => trim((string)($input['speaking_audio_url'] ?? '')),
                'duration_seconds' => (int)($input['speaking_duration_seconds'] ?? 0),
            ],
            'speaking_tasks' => (function () use ($input, $content): array {
                $rows = [];
                foreach (($content['speaking_tasks'] ?? []) as $task) {
                    $key = (string)($task['key'] ?? '');
                    if ($key === '') {
                        continue;
                    }
                    $rows[$key] = [
                        'audio_url' => trim((string)($input['speaking_tasks'][$key]['audio_url'] ?? '')),
                        'duration_seconds' => (int)($input['speaking_tasks'][$key]['duration_seconds'] ?? 0),
                    ];
                }
                return $rows;
            })(),
            'self_check' => array_values(array_filter((array)($input['self_check'] ?? []), 'is_string')),
        ],
        'auto_score' => $autoPercent,
    ];
}

function interactive_books_submission_answers(?array $submission): array
{
    if (!$submission || empty($submission['answers_json'])) {
        return [];
    }
    $decoded = json_decode((string)$submission['answers_json'], true);
    if (!is_array($decoded)) {
        return [];
    }
    return isset($decoded['answers']) && is_array($decoded['answers'])
        ? $decoded
        : ['answers' => $decoded];
}

function interactive_books_teacher_id(): int
{
    return (int)($_SESSION['teacher_id'] ?? $_SESSION['admin_id'] ?? 1);
}

function interactive_books_notify_teacher(PDO $pdo, int $submissionId, string $studentName): void
{
    $label = 'Lesson submission';
    try {
        $stmt = $pdo->prepare("
            SELECT l.lesson_number, l.title_en, l.unit_type, b.title_en AS book_title
            FROM book_lesson_submissions s
            JOIN book_lessons l ON l.id = s.lesson_id
            JOIN books b ON b.id = s.book_id
            WHERE s.id = ?
            LIMIT 1
        ");
        $stmt->execute([$submissionId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $unitLabel = (string)($row['unit_type'] ?? 'lesson') === 'review'
                ? (string)$row['title_en']
                : 'Lesson ' . (int)$row['lesson_number'] . ': ' . (string)$row['title_en'];
            $label = $unitLabel . ' from ' . (string)$row['book_title'];
        }
    } catch (Throwable) {
    }

    platform_notify($pdo, [
        'target_role' => 'teacher',
        'user_id' => 0,
        'title' => str_contains($label, 'Review') ? 'New Interactive Book Review Submission' : 'New Interactive Book Submission',
        'message' => $studentName . ' submitted ' . $label . '.',
        'action_url' => '/teacher-book-submission-review.php?submission_id=' . $submissionId,
        'action_label' => 'Review Submission',
        'related_entity_type' => 'book_lesson_submission',
        'related_entity_id' => $submissionId,
        'priority' => 'normal',
    ]);
}

function interactive_books_notify_student_feedback(PDO $pdo, int $studentId, int $submissionId): void
{
    $label = 'your interactive book lesson';
    try {
        $stmt = $pdo->prepare("
            SELECT l.lesson_number, l.title_en, l.unit_type
            FROM book_lesson_submissions s
            JOIN book_lessons l ON l.id = s.lesson_id
            WHERE s.id = ?
            LIMIT 1
        ");
        $stmt->execute([$submissionId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $label = (string)($row['unit_type'] ?? 'lesson') === 'review'
                ? (string)$row['title_en']
                : 'Lesson ' . (int)$row['lesson_number'] . ': ' . (string)$row['title_en'];
        }
    } catch (Throwable) {
    }

    platform_notify($pdo, [
        'target_role' => 'student',
        'user_id' => $studentId,
        'title' => str_contains($label, 'Review') ? 'New Review Feedback Available' : 'New Feedback Available',
        'message' => 'Your teacher reviewed ' . $label . '. Open your feedback now.',
        'action_url' => '/student-book-feedback.php?submission_id=' . $submissionId,
        'action_label' => 'View Feedback',
        'related_entity_type' => 'book_lesson_submission',
        'related_entity_id' => $submissionId,
        'priority' => 'normal',
    ]);
}

function interactive_books_student_name(PDO $pdo, int $studentId): string
{
    $stmt = $pdo->prepare("SELECT full_name FROM students WHERE id = ? LIMIT 1");
    $stmt->execute([$studentId]);
    return (string)($stmt->fetchColumn() ?: 'Student #' . $studentId);
}
