import type { Variants } from 'framer-motion'

export const pageVariant: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const kpiStagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export const kpiItem: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
}
