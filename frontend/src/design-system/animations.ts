import type { Variants, Transition, Easing } from 'framer-motion'

const ease: Easing = 'easeOut'

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease } },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease } },
}

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
}

export const cardVariant: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease },
  },
}

export const pageTransition = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
}

export const modalVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 350 },
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
}

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const drawerVariant: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', damping: 30, stiffness: 300 },
  },
  exit: { x: '100%', transition: { duration: 0.2 } },
}

export const drawerVariantRTL: Variants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', damping: 30, stiffness: 300 },
  },
  exit: { x: '-100%', transition: { duration: 0.2 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.15 } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 320 },
  },
  exit: { opacity: 0, y: '100%', transition: { duration: 0.2 } },
}

export const listItem: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease } },
}

export const cardHover = {
  whileHover: { y: -2, boxShadow: 'var(--shadow-md)' },
  transition: { type: 'spring', stiffness: 300, damping: 20 } as Transition,
}

export const buttonTap = {
  whileTap: { scale: 0.97 },
  whileHover: { y: -1 },
  transition: { type: 'spring', stiffness: 400, damping: 17 } as Transition,
}
