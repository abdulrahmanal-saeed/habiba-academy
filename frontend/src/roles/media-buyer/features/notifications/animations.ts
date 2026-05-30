import type { Variants } from 'framer-motion'

export const pageVariant: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const cardStagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export const cardItem: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
}
