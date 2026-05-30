import type { FC } from 'react'
import type { BookAnswers } from './hooks/useBookAnswers'
import type { LessonSection } from './sections/types'
import { TitleSection } from './sections/TitleSection'
import { IntroSection } from './sections/IntroSection'
import { PassageSection } from './sections/PassageSection'
import { AudioSection } from './sections/AudioSection'
import { VideoSection } from './sections/VideoSection'
import { ImageSection } from './sections/ImageSection'
import { VocabSection } from './sections/VocabSection'
import { GrammarSection } from './sections/GrammarSection'
import { DialogueSection } from './sections/DialogueSection'
import { MCQSection } from './sections/MCQSection'
import { MatchSection } from './sections/MatchSection'
import { OrderSection } from './sections/OrderSection'
import { CompleteSection } from './sections/CompleteSection'
import { ArrangeSection } from './sections/ArrangeSection'
import { WritingSection } from './sections/WritingSection'
import { SpeakingSection } from './sections/SpeakingSection'

interface SectionRendererProps {
  section: LessonSection
  lessonId: number
  answers: BookAnswers
  readonly?: boolean
  onWeakWord?: (word: string) => void
  onAudioPlay?: (key: string) => void
}

export const SectionRenderer: FC<SectionRendererProps> = ({ section, lessonId, answers, readonly, onWeakWord, onAudioPlay }) => {
  switch (section.type) {
    case 'title':
      return <TitleSection section={section} />
    case 'intro':
      return <IntroSection section={section} />
    case 'passage':
      return <PassageSection section={section} />
    case 'audio':
      return <AudioSection section={section} onPlay={onAudioPlay} />
    case 'video':
      return <VideoSection section={section} />
    case 'image':
      return <ImageSection section={section} />
    case 'vocab':
      return <VocabSection section={section} onWeakWord={onWeakWord} onAudioPlay={onAudioPlay} />
    case 'grammar':
      return <GrammarSection section={section} />
    case 'dialogue':
      return <DialogueSection section={section} />
    case 'mcq': {
      const qAnswers = section.isWarmup
        ? (answers.warmup ?? {})
        : (answers.exercises[section.questionType] ?? {})
      const handleChange = section.isWarmup ? answers.setWarmup : (id: string, val: string) => answers.setExercise(section.questionType, id, val)
      return <MCQSection section={section} answers={qAnswers} onChange={handleChange} readonly={readonly} />
    }
    case 'match': {
      const mAnswers = answers.exercises[section.questionType] ?? {}
      return <MatchSection section={section} answers={mAnswers} onChange={(id, val) => answers.setExercise(section.questionType, id, val)} readonly={readonly} />
    }
    case 'order': {
      const oAnswers = answers.exercises['sequence_practice'] ?? {}
      return <OrderSection section={section} answers={oAnswers} onChange={(id, val) => answers.setExercise('sequence_practice', id, val)} readonly={readonly} />
    }
    case 'complete': {
      const cAnswers = answers.exercises[section.questionType] ?? {}
      return <CompleteSection section={section} answers={cAnswers} onChange={(id, val) => answers.setExercise(section.questionType, id, val)} readonly={readonly} />
    }
    case 'arrange': {
      const aAnswers = answers.exercises['arrange_words'] ?? {}
      return <ArrangeSection section={section} answers={aAnswers} onChange={(id, val) => answers.setExercise('arrange_words', id, val)} readonly={readonly} />
    }
    case 'writing': {
      const wValue = section.taskKey ? (answers.writingTasks[section.taskKey] ?? '') : answers.writingTask
      const wChange = section.taskKey ? (val: string) => answers.setWritingTaskKey(section.taskKey!, val) : answers.setWritingTask
      return <WritingSection section={section} value={wValue} onChange={wChange} readonly={readonly} />
    }
    case 'speaking': {
      const sUrl = section.taskKey ? (answers.speakingTasks[section.taskKey]?.audioUrl ?? '') : answers.speakingAudioUrl
      const sRecorded = section.taskKey
        ? (url: string, dur: number) => answers.setSpeakingTask(section.taskKey!, url, dur)
        : answers.setSpeakingAudioUrl
      return <SpeakingSection section={section} lessonId={lessonId} audioUrl={sUrl} onRecorded={sRecorded} readonly={readonly} />
    }
    default:
      return null
  }
}
