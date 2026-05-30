// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  LessonStatus,
  UnitType,
  RecordingState,
  Book,
  BookLesson,
  BookLessonMeta,
  VocabCard,
  Sentence,
  AudioBlockContent,
  GrammarTip,
  ReviewGroup,
  ConversationChunk,
  ChoiceQuestion,
  MatchingItem,
  SequenceItem,
  CompleteItem,
  ArrangeWordsItem,
  SpeakingTask,
  WritingTaskDef,
  LessonContent,
  AnswerRow,
  ParsedAnswers,
  LessonSubmission,
  SpeakingSubmissionData,
  TeacherFeedback,
  BookListItem,
  BookListData,
  BookViewData,
  BookLessonData,
  FeedbackSubmission,
  FeedbackPageData,
  SubmissionRow,
  SubmissionsListData,
  SubmissionDetailData,
  DraftResult,
  SubmitResult,
  SpeakingUploadResult,
} from './types'

// ── Section system ────────────────────────────────────────────────────────────
export type { LessonSection } from './sections/types'
export { contentToSections } from './sections/contentToSections'
export { SectionRenderer } from './SectionRenderer'

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useMediaRecorder } from './hooks/useMediaRecorder'
export { useBookAnswers } from './hooks/useBookAnswers'
export type { BookAnswers } from './hooks/useBookAnswers'

// ── Components ────────────────────────────────────────────────────────────────
export { ChoiceBlock } from './components/ChoiceBlock'
export type { ChoiceBlockProps } from './components/ChoiceBlock'

export { MatchingBlock } from './components/MatchingBlock'
export type { MatchingBlockProps } from './components/MatchingBlock'

export { WritingBlock } from './components/WritingBlock'
export type { WritingBlockProps } from './components/WritingBlock'

export { SpeakingBlock } from './components/SpeakingBlock'
export type { SpeakingBlockProps } from './components/SpeakingBlock'

export { MediaPlayer } from './components/MediaPlayer'
export type { MediaPlayerProps } from './components/MediaPlayer'
