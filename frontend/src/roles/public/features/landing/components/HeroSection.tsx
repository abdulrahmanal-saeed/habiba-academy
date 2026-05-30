import type { FC } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { stagger, fadeInUp, scaleIn } from '@/design-system/animations'
import { Button } from '@/design-system/components'

const WHATSAPP_URL = 'https://wa.me/971509298326?text=' + encodeURIComponent('مرحباً! أريد معرفة المزيد عن أكاديمية حبيبة نبيل للغة العربية.')

const TRUST_SIGNALS = [
  { icon: '✓', label: 'لا يلزم بطاقة ائتمان' },
  { icon: '✓', label: 'أول درس مجاني' },
  { icon: '✓', label: 'ضمان الرضا ٧ أيام' },
]

export const HeroSection: FC = () => {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--bg)', minHeight: '100svh' }}
      dir="rtl"
    >
      {/* Background radial gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 60% 30%, var(--accent-soft) 0%, transparent 65%)',
        }}
      />

      {/* Decorative dots pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="container relative z-10 mx-auto grid items-center gap-10 px-4 py-24 md:grid-cols-2 md:py-32">
        {/* Text column */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start gap-6"
        >
          {/* Brand chip */}
          <motion.span
            variants={fadeInUp}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            ✦ أكاديمية حبيبة نبيل للغة العربية
          </motion.span>

          {/* Heading */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
            style={{ color: 'var(--ink)' }}
          >
            أتقن اللغة العربية
            <br />
            <span style={{ color: 'var(--accent)' }}>بأسلوب ذكي ومتخصص</span>
          </motion.h1>

          {/* Sub-heading */}
          <motion.p
            variants={fadeInUp}
            className="max-w-lg text-lg leading-relaxed md:text-xl"
            style={{ color: 'var(--muted)' }}
          >
            دروس فردية مباشرة مع أستاذة حبيبة نبيل — منهج مخصص لمستواك
            ومتابعة أسبوعية حتى تصل إلى هدفك.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => { window.location.href = '/level-test' }}
            >
              ابدأ اختبار المستوى مجاناً
            </Button>
            <Button variant="secondary" size="lg" onClick={scrollToPricing}>
              عرض الباقات
            </Button>
            <motion.a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] border px-5 py-2.5 text-sm font-semibold transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--ink-soft)', background: 'transparent' }}
            >
              <MessageCircle size={16} style={{ color: '#25D366' }} />
              تواصل على واتساب
            </motion.a>
          </motion.div>

          {/* Trust signals */}
          <motion.ul
            variants={fadeInUp}
            className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm"
            style={{ color: 'var(--muted)' }}
          >
            {TRUST_SIGNALS.map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                  aria-hidden="true"
                >
                  {icon}
                </span>
                {label}
              </li>
            ))}
          </motion.ul>

          {/* Social proof row — mobile only */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center gap-3 md:hidden"
          >
            <div
              className="flex -space-x-2"
              aria-label="طلاب من أكاديمية حبيبة"
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-[color:var(--bg)]"
                  style={{
                    background: `hsl(${160 + i * 15}deg 40% ${45 + i * 5}%)`,
                  }}
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
              <strong style={{ color: 'var(--accent)' }}>+٥٠٠</strong> طالب نشط
            </p>
          </motion.div>
        </motion.div>

        {/* Image column — desktop */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="relative hidden md:block"
        >
          <div
            className="overflow-hidden rounded-[var(--radius-xl)]"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <img
              src="/assets/img/habiba.jpg"
              alt="أستاذة حبيبة نبيل"
              className="h-[560px] w-full object-cover object-top"
              loading="eager"
            />
          </div>

          {/* Floating rating card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="absolute bottom-6 start-6 rounded-[var(--radius-lg)] px-5 py-3.5"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border-soft)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              4.9 ★
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              من ٣٠٠+ تقييم موثق
            </p>
          </motion.div>

          {/* Floating "free lesson" badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 280 }}
            className="absolute -top-4 end-6 rounded-full px-4 py-2 text-xs font-bold text-white"
            style={{ background: 'var(--success)', boxShadow: 'var(--shadow-md)' }}
          >
            أول درس مجاني 🎁
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
