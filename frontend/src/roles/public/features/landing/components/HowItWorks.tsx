import { useRef } from 'react'
import type { FC } from 'react'
import { motion, useInView } from 'framer-motion'
import { stagger, fadeInUp } from '@/design-system/animations'

const STEPS = [
  {
    number: '٠١',
    title: 'اختبر مستواك',
    description:
      'أجرِ اختبار مستوى مجاني يساعد الأستاذة على فهم نقطة انطلاقك تماماً.',
  },
  {
    number: '٠٢',
    title: 'احجز أول درس',
    description: 'اختر باقتك وحدّد موعدك المناسب. أول درس مجاني بلا التزام.',
  },
  {
    number: '٠٣',
    title: 'ابدأ رحلتك',
    description: 'تقدّم خطوة بخطوة مع متابعة مستمرة ومحتوى مخصص لك.',
  },
]

export const HowItWorks: FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-20" style={{ background: 'var(--surface)' }}>
      <div className="container mx-auto px-4">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: 'var(--ink)' }}>
            كيف تبدأ؟
          </h2>
          <p className="text-lg" style={{ color: 'var(--muted)' }}>
            ثلاث خطوات بسيطة للبدء في رحلتك مع العربية
          </p>
        </div>

        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="relative mx-auto grid max-w-3xl gap-12 md:grid-cols-3"
        >
          {/* Decorative line between circles (desktop) */}
          <div
            className="absolute inset-x-[18%] top-8 hidden h-0.5 md:block"
            style={{ background: 'var(--border)' }}
          />

          {STEPS.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeInUp}
              className="relative flex flex-col items-center gap-4 text-center"
            >
              <div
                className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
                style={{ background: 'var(--accent)', color: 'white', boxShadow: 'var(--shadow-md)' }}
              >
                {step.number}
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
