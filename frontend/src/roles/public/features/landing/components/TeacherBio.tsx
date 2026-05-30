import { useRef } from 'react'
import type { FC } from 'react'
import { motion, useInView } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Award, BookOpen, Users } from 'lucide-react'
import { fadeInLeft, fadeInRight } from '@/design-system/animations'

interface Credential {
  icon: LucideIcon
  text: string
}

const CREDENTIALS: Credential[] = [
  { icon: Award,    text: 'بكالوريوس تربية — تخصص لغة عربية' },
  { icon: BookOpen, text: 'خبرة أكثر من ٧ سنوات في التدريس الفردي' },
  { icon: Users,    text: 'أكثر من ٥٠٠ طالب من ٣٠+ دولة' },
]

export const TeacherBio: FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-20" style={{ background: 'var(--bg)' }}>
      <div
        ref={ref}
        className="container mx-auto grid items-center gap-12 px-4 md:grid-cols-2"
      >
        <motion.div
          variants={fadeInLeft}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="relative"
        >
          <div
            className="overflow-hidden rounded-[var(--radius-lg)]"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <img
              src="/assets/img/habiba.jpg"
              alt="أستاذة حبيبة نبيل"
              className="h-[480px] w-full object-cover object-top"
            />
          </div>
          <div
            className="absolute -bottom-4 -start-4 -z-10 h-full w-full rounded-[var(--radius-lg)]"
            style={{ background: 'var(--accent-soft)' }}
          />
        </motion.div>

        <motion.div
          variants={fadeInRight}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="flex flex-col gap-6"
        >
          <div>
            <p
              className="mb-2 text-sm font-medium uppercase tracking-widest"
              style={{ color: 'var(--accent)' }}
            >
              تعرّف على معلمتك
            </p>
            <h2 className="text-3xl font-bold md:text-4xl" style={{ color: 'var(--ink)' }}>
              أستاذة حبيبة نبيل
            </h2>
          </div>

          <p className="text-lg leading-relaxed" style={{ color: 'var(--muted)' }}>
            معلمة متخصصة في تعليم اللغة العربية للناطقين بغيرها. تؤمن بأن كل
            طالب يستحق أسلوباً مخصصاً يناسب أهدافه وإيقاعه. حققت مع طلابها
            نتائج استثنائية من المستوى الصفري حتى الاحترافي.
          </p>

          <ul className="flex flex-col gap-4">
            {CREDENTIALS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)]"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  <Icon size={18} />
                </span>
                <p className="text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
