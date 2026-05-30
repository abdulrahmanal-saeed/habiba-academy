import type { Variants } from 'framer-motion'

export const cardVariant: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

export const itemVariant: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

export const drawerVariant: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exit: { opacity: 0, x: 48, transition: { duration: 0.18 } },
}

export const rowVariant: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
}

export const toggleVariant: Variants = {
  off: { x: 0 },
  on: { x: 20, transition: { type: 'spring', stiffness: 500, damping: 30 } },
}
