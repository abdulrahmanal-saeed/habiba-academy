import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInDown } from '@/design-system/animations'
import { Button } from '@/design-system/components'

export interface WelcomeBannerProps {
  studentName: string
}

const WHATSAPP_URL = 'https://wa.me/971XXXXXXXXX'

export const WelcomeBanner: FC<WelcomeBannerProps> = ({ studentName }) => (
  <motion.div
    variants={fadeInDown}
    initial="hidden"
    animate="visible"
    className="rounded-2xl p-6 text-center flex flex-col items-center gap-4"
    style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
  >
    <span className="text-4xl">👋</span>
    <div>
      <h2 className="text-lg font-bold mb-1">أهلاً بك، {studentName}!</h2>
      <p className="text-sm opacity-80">
        لم يُسند إليكِ أي واجب بعد. تواصلي مع المعلمة لبدء رحلتك.
      </p>
    </div>
    <Button as="a" href={WHATSAPP_URL} variant="secondary" size="sm">
      تواصل عبر واتساب
    </Button>
  </motion.div>
)
