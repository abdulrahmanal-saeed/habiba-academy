import type { FC } from 'react'
import { MatchingBlock } from '../components/MatchingBlock'
import type { MatchSection as MatchSectionType } from './types'

interface MatchSectionProps {
  section: MatchSectionType
  answers: Record<string, string>
  onChange: (itemId: string, value: string) => void
  readonly?: boolean
}

export const MatchSection: FC<MatchSectionProps> = ({ section, answers, onChange, readonly }) => (
  <MatchingBlock
    title={section.title}
    hint={section.hint}
    questionType={section.questionType}
    items={section.items}
    options={section.options}
    answers={answers}
    onChange={onChange}
    readonly={readonly}
  />
)
