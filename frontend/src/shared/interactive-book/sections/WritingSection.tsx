import type { FC } from 'react'
import { WritingBlock } from '../components/WritingBlock'
import type { WritingSection as WritingSectionType } from './types'

interface WritingSectionProps {
  section: WritingSectionType
  value: string
  onChange: (value: string) => void
  readonly?: boolean
}

export const WritingSection: FC<WritingSectionProps> = ({ section, value, onChange, readonly }) => (
  <WritingBlock
    title={section.def.title ?? 'التعبير الكتابي'}
    instructions={section.def.instructions}
    placeholder={section.def.placeholder}
    minSentences={section.def.min_sentences}
    value={value}
    onChange={onChange}
    readonly={readonly}
  />
)
