import type {
  ChoiceQuestion,
  MatchingItem,
  SequenceItem,
  CompleteItem,
  ArrangeWordsItem,
  VocabCard,
  Sentence,
  AudioBlockContent,
  GrammarTip,
  ConversationChunk,
  SpeakingTask,
  WritingTaskDef,
} from '../types'

export interface TitleSection {
  type: 'title'
  unitType: string
  unitNumber: number
  lessonNumber: number
  lessonTitle: string
  description?: string
}

export interface IntroSection {
  type: 'intro'
  goalText: string
  situationText?: string
}

export interface PassageSection {
  type: 'passage'
  sentences: Sentence[]
}

export interface AudioSection {
  type: 'audio'
  audioBlocks: AudioBlockContent[]
}

export interface VideoSection {
  type: 'video'
  videoUrl: string
  videoTitle?: string
}

export interface ImageSection {
  type: 'image'
  imageUrl: string
  caption?: string
}

export interface VocabSection {
  type: 'vocab'
  cards: VocabCard[]
  lessonNumber: number
}

export interface GrammarSection {
  type: 'grammar'
  tips: GrammarTip[]
}

export interface DialogueSection {
  type: 'dialogue'
  chunks: ConversationChunk[]
}

export interface MCQSection {
  type: 'mcq'
  questionType: string
  title: string
  hint?: string
  questions: ChoiceQuestion[]
  isWarmup?: boolean
}

export interface TrueFalseSection {
  type: 'truefalse'
  questionType: string
  title: string
  hint?: string
  questions: ChoiceQuestion[]
}

export interface FillBlankSection {
  type: 'fillblank'
  questionType: string
  title: string
  hint?: string
  questions: ChoiceQuestion[]
}

export interface MatchSection {
  type: 'match'
  questionType: string
  title: string
  hint?: string
  items: MatchingItem[]
  options: string[]
}

export interface OrderSection {
  type: 'order'
  title: string
  hint?: string
  items: SequenceItem[]
}

export interface CompleteSection {
  type: 'complete'
  questionType: string
  title: string
  hint?: string
  items: CompleteItem[]
}

export interface ArrangeSection {
  type: 'arrange'
  title: string
  hint?: string
  items: ArrangeWordsItem[]
}

export interface WritingSection {
  type: 'writing'
  taskKey?: string
  def: WritingTaskDef
}

export interface SpeakingSection {
  type: 'speaking'
  taskKey?: string
  def: SpeakingTask
}

export type LessonSection =
  | TitleSection
  | IntroSection
  | PassageSection
  | AudioSection
  | VideoSection
  | ImageSection
  | VocabSection
  | GrammarSection
  | DialogueSection
  | MCQSection
  | TrueFalseSection
  | FillBlankSection
  | MatchSection
  | OrderSection
  | CompleteSection
  | ArrangeSection
  | WritingSection
  | SpeakingSection
