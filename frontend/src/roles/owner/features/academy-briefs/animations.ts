import type { Variants } from 'framer-motion'

export const cardVariant: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

export const drawerVariant: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
  exit: { opacity: 0, y: 16, transition: { duration: 0.18 } },
}
