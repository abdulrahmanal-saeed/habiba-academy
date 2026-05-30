import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import { Button } from '@/design-system/components'

export interface AlreadySubmittedProps {
  homeworkId: number
}

export const AlreadySubmitted: FC<AlreadySubmittedProps> = ({ homeworkId }) => (
  <div className="flex items-center justify-center min-h-screen px-4" style={{ background: 'var(--bg)' }}>
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="text-center flex flex-col items-center gap-4 max-w-sm"
    >
      <span className="text-5xl">✅</span>
      <h2 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>
        تم تسليم الواجب
      </h2>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        لا يمكن إعادة تسليم الواجب مرة أخرى.
      </p>
      <div className="flex flex-col gap-2 w-full">
        <Button as="a" href={`/student/homework/${homeworkId}/result`}>
          عرض النتيجة
        </Button>
        <Button as="a" href="/student" variant="secondary">
          العودة للرئيسية
        </Button>
      </div>
    </motion.div>
  </div>
)
