import { useRef } from 'react'
import type { FC } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check, Shield, RotateCcw, Headphones, MessageCircle } from 'lucide-react'
import { stagger, cardVariant, fadeInUp } from '@/design-system/animations'
import { Button } from '@/design-system/components'
import type { PricingPlan } from '../types'

const WA_URL = 'https://wa.me/971509298326?text=' + encodeURIComponent('مرحباً! لدي سؤال عن باقات الاشتراك.')

export interface PricingSectionProps {
  plans: PricingPlan[]
}

const GUARANTEES = [
  { Icon: RotateCcw, label: 'ضمان استرداد ٧ أيام' },
  { Icon: Shield,    label: 'دفع آمن ومشفر' },
  { Icon: Headphones, label: 'دعم مباشر على واتساب' },
]

const PlanCard: FC<{ plan: PricingPlan }> = ({ plan }) => {
  const popular = plan.isPopular

  return (
    <motion.div
      variants={cardVariant}
      whileHover={{ y: -6, boxShadow: 'var(--shadow-lg)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="relative flex flex-col rounded-[var(--radius-xl)] p-6"
      style={{
        background: popular ? 'var(--accent)' : 'var(--card)',
        border: popular ? '2px solid transparent' : '1px solid var(--border-soft)',
        boxShadow: popular ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        outline: popular ? '2px solid var(--accent-mint)' : 'none',
        outlineOffset: '2px',
      }}
    >
      {popular && (
        <div className="absolute -top-3.5 start-0 end-0 flex justify-center">
          <span
            className="inline-flex items-center gap-1 rounded-full px-4 py-1 text-xs font-bold"
            style={{ background: 'var(--accent-mint)', color: 'var(--accent)' }}
          >
            ✦ الأكثر شعبية
          </span>
        </div>
      )}

      <h3
        className="mb-1 text-xl font-bold mt-2"
        style={{ color: popular ? 'white' : 'var(--ink)' }}
      >
        {plan.name}
      </h3>
      <p
        className="mb-5 text-sm"
        style={{ color: popular ? 'rgba(255,255,255,0.75)' : 'var(--muted)' }}
      >
        {plan.description}
      </p>

      <div className="mb-6">
        <span
          className="text-4xl font-bold"
          style={{ color: popular ? 'white' : 'var(--ink)' }}
        >
          {Math.floor(plan.priceAed / 100).toLocaleString('en')}
        </span>
        <span
          className="ms-1 text-sm"
          style={{ color: popular ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}
        >
          د.إ / {plan.periodLabel}
        </span>
      </div>

      <ul className="mb-8 flex flex-col gap-2.5">
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2 text-sm">
            <Check
              size={15}
              className="mt-0.5 shrink-0"
              style={{ color: popular ? 'var(--accent-mint)' : 'var(--success)' }}
            />
            <span style={{ color: popular ? 'rgba(255,255,255,0.9)' : 'var(--ink-soft)' }}>
              {feat}
            </span>
          </li>
        ))}
      </ul>

      {popular ? (
        <motion.button
          type="button"
          whileHover={{ y: -1, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={() => { window.location.href = `/checkout/${plan.slug}` }}
          className="mt-auto flex h-[52px] w-full cursor-pointer items-center justify-center rounded-[var(--radius-lg)] text-base font-bold"
          style={{ background: 'white', color: 'var(--accent)' }}
        >
          {plan.ctaLabel ?? 'ابدأ الآن'}
        </motion.button>
      ) : (
        <Button
          variant="primary"
          size="lg"
          className="mt-auto w-full"
          onClick={() => { window.location.href = `/checkout/${plan.slug}` }}
        >
          {plan.ctaLabel ?? 'ابدأ الآن'}
        </Button>
      )}
    </motion.div>
  )
}

export const PricingSection: FC<PricingSectionProps> = ({ plans }) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="pricing" className="py-20" style={{ background: 'var(--surface)' }}>
      <div className="container mx-auto px-4">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mb-14 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: 'var(--ink)' }}>
            اختر باقتك
          </h2>
          <p className="text-lg" style={{ color: 'var(--muted)' }}>
            كل الباقات تشمل إمكانية الوصول الكامل للمحتوى والمنصة التعليمية
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3 mt-6"
        >
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </motion.div>

        {/* Guarantee strip */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-6 rounded-[var(--radius-xl)] px-8 py-5"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)' }}
        >
          {GUARANTEES.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>
              <Icon size={16} style={{ color: 'var(--accent)' }} />
              {label}
            </div>
          ))}
        </motion.div>

        {/* WhatsApp strip */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mx-auto mt-6 max-w-sm text-center"
        >
          <p className="mb-3 text-sm" style={{ color: 'var(--muted)' }}>
            لديك سؤال؟ نحن هنا للمساعدة
          </p>
          <motion.a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(37,211,102,0.25)' }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-shadow"
            style={{ background: '#25D366' }}
          >
            <MessageCircle size={16} />
            تواصل معنا على واتساب
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
