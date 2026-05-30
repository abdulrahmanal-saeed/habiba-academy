<?php
// lib/learning-guidance.php - Human-friendly guidance for weak words and common mistakes
declare(strict_types=1);

function guidance_normalize(string $value): string
{
    $value = trim(mb_strtolower($value, 'UTF-8'));
    $value = str_replace(['_', '-', '/', '  '], [' ', ' ', ' ', ' '], $value);
    return preg_replace('/\s+/u', ' ', $value) ?? $value;
}

function common_mistake_guidance(string $tag): array
{
    $key = guidance_normalize($tag);
    $items = [
        'gender agreement' => [
            'title_en' => 'Gender agreement',
            'title_ar' => 'توافق المذكر والمؤنث',
            'meaning_en' => 'Arabic words must match masculine/feminine forms.',
            'meaning_ar' => 'في العربية لازم الكلمة والصفة أو الإشارة تناسب المذكر والمؤنث.',
            'example_en' => 'Use هذا with masculine words and هذه with feminine words. Example: هذا كرسي، هذه طاولة.',
            'example_ar' => 'استخدم هذا مع المذكر وهذه مع المؤنث. مثال: هذا كرسي، هذه طاولة.',
            'student_action_en' => 'Practice 5 sentences with هذا/هذه + noun + color or adjective.',
            'student_action_ar' => 'اتدرّب على 5 جمل فيها هذا/هذه + اسم + لون أو صفة.',
            'teacher_action_en' => 'Assign a short matching or sentence-building drill for masculine/feminine nouns.',
            'teacher_action_ar' => 'اعملي تدريب قصير توصيل أو تكوين جمل على المذكر والمؤنث.',
        ],
        'word order' => [
            'title_en' => 'Word order',
            'title_ar' => 'ترتيب الكلمات',
            'meaning_en' => 'The words may be correct, but the sentence order needs fixing.',
            'meaning_ar' => 'ممكن الكلمات تكون صحيحة لكن ترتيب الجملة محتاج يتظبط.',
            'example_en' => 'Say: هذا باب أسود, not هذا أسود باب.',
            'example_ar' => 'قل: هذا باب أسود، وليس هذا أسود باب.',
            'student_action_en' => 'Copy the correct sentence pattern, then write 3 new sentences using the same order.',
            'student_action_ar' => 'انسخ شكل الجملة الصحيح، ثم اكتب 3 جمل بنفس الترتيب.',
            'teacher_action_en' => 'Give sentence-reordering practice before asking for free writing.',
            'teacher_action_ar' => 'استخدمي تدريب ترتيب كلمات قبل الكتابة الحرة.',
        ],
        'wrong vocabulary choice' => [
            'title_en' => 'Wrong vocabulary choice',
            'title_ar' => 'اختيار كلمة غير مناسبة',
            'meaning_en' => 'The student used a word that does not match the intended meaning.',
            'meaning_ar' => 'الطالب استخدم كلمة لا تناسب المعنى المطلوب.',
            'example_en' => 'Review the target word, then use it in a short sentence.',
            'example_ar' => 'راجع الكلمة المطلوبة ثم استخدمها في جملة قصيرة.',
            'student_action_en' => 'Make a mini flashcard: Arabic word, English meaning, and one example sentence.',
            'student_action_ar' => 'اعمل كارت صغير: الكلمة بالعربي، معناها، وجملة مثال.',
            'teacher_action_en' => 'Recycle this word in the next homework and speaking prompt.',
            'teacher_action_ar' => 'كرري الكلمة في الواجب القادم وفي سؤال speaking.',
        ],
        'missing required word' => [
            'title_en' => 'Missing required word',
            'title_ar' => 'كلمة ناقصة',
            'meaning_en' => 'A key word was missing from the answer.',
            'meaning_ar' => 'في كلمة مهمة ناقصة من الإجابة.',
            'example_en' => 'Example: أنا من أفغانستان needs من.',
            'example_ar' => 'مثال: أنا من أفغانستان تحتاج كلمة من.',
            'student_action_en' => 'Rewrite the answer with the missing word, then say it aloud 3 times.',
            'student_action_ar' => 'اكتب الإجابة بالكلمة الناقصة، ثم قلها بصوت عالي 3 مرات.',
            'teacher_action_en' => 'Ask for short controlled sentences using the missing word.',
            'teacher_action_ar' => 'اطلبي جمل قصيرة موجهة تستخدم الكلمة الناقصة.',
        ],
        'incomplete sentence' => [
            'title_en' => 'Incomplete sentence',
            'title_ar' => 'جملة غير مكتملة',
            'meaning_en' => 'The answer is too short or missing a complete sentence structure.',
            'meaning_ar' => 'الإجابة قصيرة جدًا أو لا تكوّن جملة كاملة.',
            'example_en' => 'Instead of only كرسي, write هذا كرسي أزرق.',
            'example_ar' => 'بدل كلمة كرسي فقط، اكتب: هذا كرسي أزرق.',
            'student_action_en' => 'Answer with a full sentence: subject + noun/verb + detail.',
            'student_action_ar' => 'جاوب بجملة كاملة: بداية الجملة + الاسم/الفعل + تفصيلة.',
            'teacher_action_en' => 'Use sentence frames and require one complete sentence per answer.',
            'teacher_action_ar' => 'استخدمي قوالب جمل واطلبي جملة كاملة في كل إجابة.',
        ],
        'pronunciation clarity' => [
            'title_en' => 'Pronunciation clarity',
            'title_ar' => 'وضوح النطق',
            'meaning_en' => 'The sound was difficult to understand or needs clearer pronunciation.',
            'meaning_ar' => 'النطق غير واضح كفاية أو محتاج تدريب أكثر.',
            'example_en' => 'Repeat slowly, then record again at normal speed.',
            'example_ar' => 'كرر ببطء، ثم سجل مرة ثانية بسرعة طبيعية.',
            'student_action_en' => 'Record the same phrase twice: slow first, then natural speed.',
            'student_action_ar' => 'سجل نفس الجملة مرتين: مرة ببطء ومرة بسرعة طبيعية.',
            'teacher_action_en' => 'Give one target sound or word per recording, not many corrections at once.',
            'teacher_action_ar' => 'ركزي على صوت أو كلمة واحدة في التسجيل بدل تصحيحات كثيرة.',
        ],
    ];

    $fallback = [
        'title_en' => $tag,
        'title_ar' => $tag,
        'meaning_en' => 'This is a repeated learning point your teacher wants you to improve.',
        'meaning_ar' => 'ده جزء متكرر المعلمة عايزاك تحسّنه.',
        'example_en' => 'Check the teacher note, then practice one correct example.',
        'example_ar' => 'راجع ملاحظة المعلمة، ثم اتدرب على مثال صحيح واحد.',
        'student_action_en' => 'Practice it once in writing and once by speaking.',
        'student_action_ar' => 'اتدرب عليه مرة كتابة ومرة نطق.',
        'teacher_action_en' => 'Add one focused exercise for this point in the next task.',
        'teacher_action_ar' => 'ضيفي تمرين مركز على النقطة دي في المهمة القادمة.',
    ];

    foreach ($items as $needle => $data) {
        if ($key === $needle || str_contains($key, $needle)) {
            return $data;
        }
    }
    return $fallback;
}

function weak_word_guidance(string $word, ?string $note = null): array
{
    return [
        'meaning_en' => 'This word or phrase needs more review until you can recognize it and use it correctly.',
        'meaning_ar' => 'الكلمة أو العبارة دي محتاجة مراجعة لحد ما تعرفها وتستخدمها صح.',
        'student_action_en' => 'Read it, say it aloud 3 times, then write one sentence using it.',
        'student_action_ar' => 'اقرأها، قلها بصوت عالي 3 مرات، ثم اكتب جملة واحدة بها.',
        'teacher_action_en' => 'Ask the student to use this word in a new speaking or writing sentence.',
        'teacher_action_ar' => 'اطلبي من الطالب يستخدم الكلمة في جملة speaking أو writing جديدة.',
        'practice_prompt_en' => 'Write one sentence with: ' . $word,
        'practice_prompt_ar' => 'اكتب جملة واحدة باستخدام: ' . $word,
        'source_note' => $note ?: '',
    ];
}
