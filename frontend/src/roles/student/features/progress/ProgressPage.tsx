import { useQuery } from '@tanstack/react-query'
import type { FC } from 'react'
import { Spinner } from '@/design-system/components'
import { getProgress } from './api'
import { LevelHero } from './components/LevelHero'
import { CefrBar } from './components/CefrBar'
import { StatsRow } from './components/StatsRow'
import { ScoreChart } from './components/ScoreChart'
import { AchievementGrid } from './components/AchievementGrid'

export const ProgressPage: FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student-progress'],
    queryFn: getProgress,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          Failed to load progress. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

        <h1 className="font-extrabold text-2xl" style={{ color: 'var(--fg)' }}>
          My Progress
        </h1>

        <LevelHero
          level={data.level}
          fullName={data.full_name}
          sessCount={data.sess_count}
        />

        <CefrBar currentLevel={data.level} />

        <StatsRow
          hwCount={data.hw_count}
          avgPct={data.avg_pct}
          scCount={data.sc_count}
          streak={data.streak}
          sessCount={data.sess_count}
        />

        <ScoreChart history={data.score_history} />

        <AchievementGrid earned={data.achievements} all={data.all_achievements} />

      </div>
    </div>
  )
}
