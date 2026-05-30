import type { FC } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock } from 'lucide-react'
import { stagger, fadeInUp, scaleIn } from '@/design-system/animations'
import { Button } from '@/design-system/components'
import type { LevelTestResult } from '../types'

interface ResultStepProps {
  result: LevelTestResult
}

const LEVEL_LABELS: Record<string, string> = {
  A1: 'مبتدئ',
  A2: 'مبتدئ متقدم',
  B1: 'متوسط',
  B2: 'متوسط متقدم',
  C1: 'متقدم',
  C2: 'احترافي',
}

export const ResultStep: FC<ResultStepProps> = ({ result }) => {
  const label = LEVEL_LABELS[result.estimatedLevel] ?? result.estimatedLevel

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-8 py-8 text-center"
    >
      <motion.div variants={scaleIn}>
        <CheckCircle size={64} style={{ color: 'var(--success)' }} />
      </motion.div>

      <motion.div variants={fadeInUp} className="flex flex-col gap-2">
        <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
          تم إرسال اختبارك بنجاح!
        </p>
        <h2 className="text-2xl font-bold md:text-3xl" style={{ color: 'var(--ink)' }}>
          مستواك المبدئي
        </h2>
      </motion.div>

      <motion.div
        variants={scaleIn}
        className="flex flex-col items-center gap-1 rounded-[var(--radius-lg)] px-12 py-8"
        style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-lg)' }}
      >
        <p className="text-6xl font-bold text-white">{result.estimatedLevel}</p>
        <p className="text-lg font-medium text-white/80">{label}</p>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        className="flex max-w-sm flex-col gap-4 rounded-[var(--radius-lg)] p-5 text-start"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
      >
        <div className="flex items-start gap-3">
          <Clock size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              في انتظار مراجعة المعلمة
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              ستراجع الأستاذة حبيبة إجابات الكتابة والمحادثة خلال ٢٤ ساعة، وستصلك
              النتيجة النهائية والتوصيات عبر واتساب أو البريد الإلكتروني.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex flex-col gap-3 w-full max-w-sm">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => (window.location.href = '/#pricing')}
        >
          اكتشف الباقات المناسبة لمستواك
        </Button>
        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onClick={() => (window.location.href = '/')}
        >
          العودة للرئيسية
        </Button>
      </motion.div>
    </motion.div>
  )
}
