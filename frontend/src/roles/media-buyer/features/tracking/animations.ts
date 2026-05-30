import type { Variants } from 'framer-motion'

export const pageVariant: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const rowStagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}

export const rowItem: Variants = {
  hidden:  { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22 } },
}
