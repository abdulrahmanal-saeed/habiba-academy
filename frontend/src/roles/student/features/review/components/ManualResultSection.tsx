import { motion } from 'framer-motion'
import type { FC } from 'react'
import { cardVariant, stagger } from '@/design-system/animations'
import type {
  WritingSection,
  SpeakingSection,
  ScenarioSection,
  AnswersMap,
  ManualScoreEntry,
} from '../types'

export interface ManualResultSectionProps {
  section: WritingSection | SpeakingSection | ScenarioSection
  answers: AnswersMap
  manualScores: Record<string, ManualScoreEntry>
}

function normalizePath(p: string): string {
  return p.startsWith('/') ? p : `/${p}`
}

export const ManualResultSection: FC<ManualResultSectionProps> = ({ section, answers, manualScores }) => {
  const sid = section.section_id

  return (
    <motion.div
      variants={cardVariant}
      className="rounded-[var(--radius-lg)] p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-bold mb-3" style={{ color: 'var(--fg)' }}>
        {section.title ?? (sid === 'writing' ? 'التعبير الكتابي' : sid === 'speaking' ? 'التعبير الشفهي' : 'السيناريو')}
      </h2>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        {sid === 'writing' &&
          (section as WritingSection).questions.map((q) => {
            const saved    = manualScores[`writing::${q.id}`] ?? null
            const answer   = answers.writing[q.id] ?? ''
            return (
              <WritingItem
                key={q.id}
                prompt={q.prompt}
                answer={answer}
                score={saved?.score ?? 0}
                maxPoints={saved?.max_points ?? (q.points ?? 0)}
                feedback={saved?.feedback ?? null}
              />
            )
          })}

        {sid === 'speaking' &&
          (section as SpeakingSection).questions.map((q) => {
            const saved   = manualScores[`speaking::${q.id}`] ?? null
            const srcPath = answers.speaking[q.id] ?? ''
            return (
              <AudioItem
                key={q.id}
                prompt={q.prompt}
                srcPath={srcPath}
                score={saved?.score ?? 0}
                maxPoints={saved?.max_points ?? (q.points ?? 0)}
                feedback={saved?.feedback ?? null}
              />
            )
          })}

        {sid === 'scenario' &&
          (section as ScenarioSection).scenarios.map((sc) => {
            const saved   = manualScores[`scenario::${sc.id}`] ?? null
            const srcPath = answers.scenario[sc.id] ?? ''
            return (
              <AudioItem
                key={sc.id}
                prompt={sc.title}
                context={sc.context}
                srcPath={srcPath}
                score={saved?.score ?? 0}
                maxPoints={saved?.max_points ?? (sc.points ?? 0)}
                feedback={saved?.feedback ?? null}
              />
            )
          })}
      </motion.div>
    </motion.div>
  )
}

interface WritingItemProps {
  prompt: string
  answer: string
  score: number
  maxPoints: number
  feedback: string | null
}

const WritingItem: FC<WritingItemProps> = ({ prompt, answer, score, maxPoints, feedback }) => (
  <motion.div variants={cardVariant} className="flex flex-col gap-2">
    <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{prompt}</p>
    <div
      className="rounded-[var(--radius-sm)] p-3 text-sm"
      style={{ background: 'var(--surface2)', whiteSpace: 'pre-wrap', color: 'var(--fg)' }}
    >
      {answer || '—'}
    </div>
    <ScoreBadge score={score} maxPoints={maxPoints} />
    {feedback && <FeedbackBox text={feedback} />}
  </motion.div>
)

interface AudioItemProps {
  prompt: string
  context?: string
  srcPath: string
  score: number
  maxPoints: number
  feedback: string | null
}

const AudioItem: FC<AudioItemProps> = ({ prompt, context, srcPath, score, maxPoints, feedback }) => (
  <motion.div variants={cardVariant} className="flex flex-col gap-2">
    <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{prompt}</p>
    {context && <p className="text-xs" style={{ color: 'var(--muted)' }}>{context}</p>}
    {srcPath && (
      <audio controls src={normalizePath(srcPath)} className="w-full" style={{ maxHeight: '40px' }} />
    )}
    <ScoreBadge score={score} maxPoints={maxPoints} />
    {feedback && <FeedbackBox text={feedback} />}
  </motion.div>
)

const ScoreBadge: FC<{ score: number; maxPoints: number }> = ({ score, maxPoints }) => (
  <span
    className="self-start text-xs font-medium px-2.5 py-1 rounded-full"
    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
  >
    {score}/{maxPoints} نقطة
  </span>
)

const FeedbackBox: FC<{ text: string }> = ({ text }) => (
  <div
    className="rounded-[var(--radius-sm)] p-2.5 text-sm"
    style={{ background: 'var(--accent-soft)', color: 'var(--fg)' }}
  >
    {text}
  </div>
)
