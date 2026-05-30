import type { FC } from 'react'
import { SpeakingBlock } from '../components/SpeakingBlock'
import type { SpeakingSection as SpeakingSectionType } from './types'

interface SpeakingSectionProps {
  section: SpeakingSectionType
  lessonId: number
  audioUrl: string
  onRecorded: (audioUrl: string, duration: number) => void
  readonly?: boolean
}

export const SpeakingSection: FC<SpeakingSectionProps> = ({ section, lessonId, audioUrl, onRecorded, readonly }) => (
  <SpeakingBlock
    lessonId={lessonId}
    speakingKey={section.taskKey}
    title={section.def.title ?? 'التعبير الشفهي'}
    instructions={section.def.instructions}
    maxDurationLabel={section.def.max_duration_label}
    audioUrl={audioUrl}
    onRecorded={onRecorded}
    readonly={readonly}
  />
)
