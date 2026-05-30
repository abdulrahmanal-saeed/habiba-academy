import type { LessonContent } from '../types'
import type { LessonSection, MCQSection, MatchSection } from './types'

interface ChoiceConfig {
  title: string
  hint?: string
  isWarmup?: boolean
}

interface MatchConfig {
  title: string
  hint?: string
  optionsKey: keyof LessonContent
}

const CHOICE_CONFIG: Partial<Record<keyof LessonContent, ChoiceConfig>> = {
  mcq: { title: 'أسئلة الاختيار من متعدد' },
  number_recognition: { title: 'تعرف على الأرقام' },
  listening_numbers: { title: 'الاستماع للأرقام' },
  listening_review: { title: 'مراجعة الاستماع' },
  color_recognition: { title: 'تعرف على الألوان' },
  time_recognition: { title: 'تعرف على الوقت' },
  direction_recognition: { title: 'تعرف على الاتجاهات' },
  work_sentence_practice: { title: 'تدريب جمل العمل' },
  pain_sentence_practice: { title: 'تدريب جمل الألم' },
  topic_recognition: { title: 'تعرف على الموضوع' },
  topic_category: { title: 'تصنيف الموضوع' },
  category_practice: { title: 'تدريب التصنيف' },
  price_recognition: { title: 'تعرف على الأسعار' },
  reading_comprehension: { title: 'فهم المقروء' },
}

const MATCH_CONFIG: Partial<Record<keyof LessonContent, MatchConfig>> = {
  matching: { title: 'المطابقة', optionsKey: 'matching_options' },
  description_matching: { title: 'مطابقة الوصف', optionsKey: 'description_matching_options' },
  daily_action_matching: { title: 'مطابقة الأنشطة اليومية', optionsKey: 'daily_action_matching_options' },
  direction_matching: { title: 'مطابقة الاتجاهات', optionsKey: 'direction_matching_options' },
  job_matching: { title: 'مطابقة الوظائف', optionsKey: 'job_matching_options' },
  workplace_matching: { title: 'مطابقة بيئة العمل', optionsKey: 'workplace_matching_options' },
  body_matching: { title: 'مطابقة أجزاء الجسم', optionsKey: 'body_matching_options' },
  health_phrase_matching: { title: 'مطابقة عبارات الصحة', optionsKey: 'health_phrase_matching_options' },
  conversation_phrase_matching: { title: 'مطابقة عبارات المحادثة', optionsKey: 'conversation_phrase_matching_options' },
  vocabulary_matching: { title: 'مطابقة المفردات', optionsKey: 'vocabulary_matching_options' },
}

export function contentToSections(content: LessonContent): LessonSection[] {
  const sections: LessonSection[] = []

  sections.push({
    type: 'title',
    unitType: content.unit_type,
    unitNumber: 1,
    lessonNumber: content.lesson_number,
    lessonTitle: content.display_label ?? `Lesson ${content.lesson_number}`,
    description: content.goal_ar,
  })

  if (content.goal_ar || content.situation_ar) {
    sections.push({
      type: 'intro',
      goalText: content.goal_ar,
      situationText: content.situation_ar,
    })
  }

  if (content.conversation_chunks?.length) {
    sections.push({ type: 'dialogue', chunks: content.conversation_chunks })
  }

  if (content.vocabulary?.length) {
    sections.push({
      type: 'vocab',
      cards: content.vocabulary,
      lessonNumber: content.lesson_number,
    })
  }

  if (content.audio_blocks?.length) {
    sections.push({ type: 'audio', audioBlocks: content.audio_blocks })
  }

  if (content.sentences?.length) {
    sections.push({ type: 'passage', sentences: content.sentences })
  }

  if (content.grammar_tip) {
    sections.push({ type: 'grammar', tips: [content.grammar_tip] })
  }

  if (content.warmup_questions?.length && content.warmup_title) {
    const warmupQ = content.warmup_questions.map((q, i) => ({
      id: `warmup_${i}`,
      question: q,
      options: { yes: 'نعم', no: 'لا' },
    }))
    sections.push({
      type: 'mcq',
      questionType: 'warmup',
      title: content.warmup_title,
      questions: warmupQ,
      isWarmup: true,
    } as MCQSection)
  }

  for (const [key, cfg] of Object.entries(CHOICE_CONFIG)) {
    const questions = content[key as keyof LessonContent] as typeof content.mcq
    if (questions?.length) {
      sections.push({
        type: 'mcq',
        questionType: key,
        title: cfg.title,
        hint: cfg.hint,
        questions,
        isWarmup: false,
      } as MCQSection)
    }
  }

  for (const [key, cfg] of Object.entries(MATCH_CONFIG)) {
    const items = content[key as keyof LessonContent] as typeof content.matching
    const options = content[cfg.optionsKey] as string[] | undefined
    if (items?.length && options?.length) {
      sections.push({
        type: 'match',
        questionType: key,
        title: cfg.title,
        hint: cfg.hint,
        items,
        options,
      } as MatchSection)
    }
  }

  if (content.sequence_practice?.length) {
    sections.push({
      type: 'order',
      title: 'رتب الجمل',
      items: content.sequence_practice,
    })
  }

  if (content.complete_sentence?.length) {
    sections.push({
      type: 'complete',
      questionType: 'complete_sentence',
      title: 'أكمل الجملة',
      items: content.complete_sentence,
    })
  }

  if (content.complete_conversation?.length) {
    sections.push({
      type: 'complete',
      questionType: 'complete_conversation',
      title: 'أكمل المحادثة',
      items: content.complete_conversation,
    })
  }

  if (content.arrange_words?.length) {
    sections.push({
      type: 'arrange',
      title: 'رتب الكلمات',
      items: content.arrange_words,
    })
  }

  if (content.writing_tasks?.length) {
    for (const def of content.writing_tasks) {
      sections.push({ type: 'writing', taskKey: def.key, def })
    }
  } else if (content.writing_title) {
    sections.push({
      type: 'writing',
      def: {
        key: 'writing_task',
        title: content.writing_title,
        instructions: content.writing_instructions,
        placeholder: content.writing_placeholder,
        min_sentences: content.min_sentences,
      },
    })
  }

  if (content.speaking_tasks?.length) {
    for (const def of content.speaking_tasks) {
      sections.push({ type: 'speaking', taskKey: def.key, def })
    }
  } else if (content.speaking_title) {
    sections.push({
      type: 'speaking',
      def: {
        key: 'speaking_task',
        title: content.speaking_title,
        instructions: content.speaking_instructions,
      },
    })
  }

  return sections
}
