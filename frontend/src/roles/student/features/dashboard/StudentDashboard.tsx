import { motion } from 'framer-motion'
import type { FC } from 'react'
import { pageTransition } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { PrimaryCard }       from './components/PrimaryCard'
import { ScoreCard }         from './components/ScoreCard'
import { WeeklySummaryStrip } from './components/WeeklySummaryStrip'
import { AchievementBadges } from './components/AchievementBadges'
import { WelcomeBanner }     from './components/WelcomeBanner'
import { BookBanner }        from './components/BookBanner'
import { useStudentDashboard } from './hooks/useStudentDashboard'

export const StudentDashboard: FC = () => {
  const {
    isLoading,
    isError,
    notifications,
    achievements,
    weeklySummary,
    primaryCard,
    scoreCard,
    isNewStudent,
  } = useStudentDashboard()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Spinner />
      </div>
    )
  }

  if (isError || !notifications) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          حدث خطأ في تحميل البيانات
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 max-w-2xl mx-auto py-6 px-4"
      dir="rtl"
    >
      {/* Book promo banner — 7-day localStorage suppression */}
      {notifications.bookBanner && (
        <BookBanner info={notifications.bookBanner} />
      )}

      {/* Welcome banner — new students (all 3 latest null) */}
      {isNewStudent && (
        <WelcomeBanner studentName={notifications.studentName} />
      )}

      {/* Two-column cards */}
      {!isNewStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PrimaryCard state={primaryCard} studentName={notifications.studentName} />
          <ScoreCard   state={scoreCard}   streak={notifications.streak} />
        </div>
      )}

      {/* Weekly summary — hidden when hwDone=0 AND scDone=0 */}
      {weeklySummary && <WeeklySummaryStrip data={weeklySummary} />}

      {/* Achievement badges — silent if empty */}
      <AchievementBadges achievements={achievements} />
    </motion.div>
  )
}
