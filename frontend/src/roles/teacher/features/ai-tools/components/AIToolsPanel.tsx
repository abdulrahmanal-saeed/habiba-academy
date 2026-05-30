import { useState, type FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeInUp } from '@/design-system/animations'
import { AnalysisTab } from './AnalysisTab'
import { HomeworkGeneratorTab } from './HomeworkGeneratorTab'
import { ScenarioGeneratorTab } from './ScenarioGeneratorTab'
import { LessonPlannerTab } from './LessonPlannerTab'
import { ArticleGeneratorTab } from './ArticleGeneratorTab'
import type { AIAnalysis } from '../types'

type PanelTab = 'analysis' | 'homework' | 'scenario' | 'lesson' | 'article'

interface Props {
  studentId: number | null
}

const STUDENT_TABS: Array<{ key: PanelTab; label: string }> = [
  { key: 'analysis', label: 'Analysis' },
  { key: 'homework', label: 'Homework' },
  { key: 'scenario', label: 'Scenario' },
  { key: 'lesson',   label: 'Lesson' },
]

export const AIToolsPanel: FC<Props> = ({ studentId }) => {
  const [activeTab, setActiveTab] = useState<PanelTab>(studentId ? 'analysis' : 'article')
  const [analysis, setAnalysis]   = useState<AIAnalysis | null>(null)

  const tabs: Array<{ key: PanelTab; label: string }> = studentId
    ? [...STUDENT_TABS, { key: 'article', label: 'Article' }]
    : [{ key: 'article', label: 'Article' }]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
            style={{
              background: activeTab === tab.key ? 'var(--accent)' : 'var(--surface)',
              color: activeTab === tab.key ? '#fff' : 'var(--muted)',
              border: `1px solid ${activeTab === tab.key ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} variants={fadeInUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
          {activeTab === 'analysis' && studentId && (
            <AnalysisTab studentId={studentId} onAnalysisDone={setAnalysis} />
          )}
          {activeTab === 'homework' && studentId && (
            <HomeworkGeneratorTab studentId={studentId} analysis={analysis} />
          )}
          {activeTab === 'scenario' && studentId && (
            <ScenarioGeneratorTab studentId={studentId} analysis={analysis} />
          )}
          {activeTab === 'lesson' && studentId && (
            <LessonPlannerTab studentId={studentId} analysis={analysis} />
          )}
          {activeTab === 'article' && <ArticleGeneratorTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
