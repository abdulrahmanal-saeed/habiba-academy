import type { FC } from 'react'
import { ChoiceBlock } from '../components/ChoiceBlock'
import type { MCQSection as MCQSectionType } from './types'

interface MCQSectionProps {
  section: MCQSectionType
  answers: Record<string, string>
  onChange: (questionId: string, value: string) => void
  readonly?: boolean
}

export const MCQSection: FC<MCQSectionProps> = ({ section, answers, onChange, readonly }) => (
  <ChoiceBlock
    title={section.title}
    hint={section.hint}
    questionType={section.questionType}
    questions={section.questions}
    answers={answers}
    onChange={onChange}
    readonly={readonly}
  />
)
