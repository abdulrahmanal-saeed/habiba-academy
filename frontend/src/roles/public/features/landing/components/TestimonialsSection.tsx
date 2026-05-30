import { useRef } from 'react'
import type { FC } from 'react'
import { motion, useInView } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import type { Testimonial } from '../types'

export interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

const StarRating: FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={13}
        fill={i < rating ? 'var(--warning)' : 'none'}
        style={{ color: 'var(--warning)' }}
      />
    ))}
  </div>
)

const TestimonialCard: FC<{ t: Testimonial }> = ({ t }) => (
  <div
    className="w-72 shrink-0 rounded-[var(--radius-lg)] p-5 md:w-80"
    style={{
      background: 'var(--card)',
      border: '1px solid var(--border-soft)',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <div className="flex items-start justify-between gap-2 mb-3">
      <StarRating rating={t.rating} />
      <Quote size={16} style={{ color: 'var(--accent-soft-strong)', flexShrink: 0 }} />
    </div>
    <p
      className="line-clamp-4 text-sm leading-relaxed mb-4"
      style={{ color: 'var(--ink-soft)' }}
      dir="rtl"
    >
      {t.body}
    </p>
    <div className="flex items-center gap-3">
      {t.avatar ? (
        <img src={t.avatar} alt={t.name} className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: 'var(--accent)' }}
          aria-hidden="true"
        >
          {t.name[0]}
        </span>
      )}
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{t.name}</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{t.country}</p>
      </div>
    </div>
  </div>
)

/* Infinite marquee row — duplicates cards so it loops seamlessly */
const MarqueeRow: FC<{ items: Testimonial[]; reverse?: boolean }> = ({ items, reverse }) => {
  const doubled = [...items, ...items]

  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        animate={{ x: reverse ? ['0%', '50%'] : ['0%', '-50%'] }}
        transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
        className="flex gap-5 will-change-transform"
        style={{ width: 'max-content' }}
        whileHover={{ animationPlayState: 'paused' }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.id}-${i}`} t={t} />
        ))}
      </motion.div>
    </div>
  )
}

export const TestimonialsSection: FC<TestimonialsSectionProps> = ({ testimonials }) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  if (testimonials.length === 0) return null

  const half = Math.ceil(testimonials.length / 2)
  const row1 = testimonials.slice(0, half)
  const row2 = testimonials.slice(half)

  return (
    <section className="overflow-hidden py-20" style={{ background: 'var(--bg)' }}>
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          variants={fadeInUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mb-12 text-center"
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium mb-4"
            style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}
          >
            {'★ ★ ★ ★ ★'} &nbsp; ٤.٩ متوسط التقييم
          </span>
          <h2 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: 'var(--ink)' }}>
            ماذا يقول طلابنا؟
          </h2>
          <p className="text-lg" style={{ color: 'var(--muted)' }}>
            أكثر من ٣٠٠ تقييم من طلاب حول العالم
          </p>
        </motion.div>
      </div>

      <div className="flex flex-col gap-5">
        <MarqueeRow items={row1.length >= 3 ? row1 : testimonials} />
        {row2.length >= 2 && <MarqueeRow items={row2} reverse />}
      </div>
    </section>
  )
}
