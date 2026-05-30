import { useRef } from 'react'
import type { FC } from 'react'
import { motion, useInView } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { BookOpen, Video, MessageCircle, Award, Clock, Users } from 'lucide-react'
import { stagger, cardVariant } from '@/design-system/animations'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: BookOpen,
    title: 'منهج مخصص',
    description: 'خطة دراسية مصممة لمستواك وأهدافك، تتطور معك أسبوعاً بأسبوع.',
  },
  {
    icon: Video,
    title: 'دروس مباشرة',
    description: 'جلسات فردية مباشرة عبر الإنترنت، بجودة تعليمية عالية.',
  },
  {
    icon: MessageCircle,
    title: 'تغذية راجعة فورية',
    description: 'تصحيح الواجبات وملاحظات تفصيلية بعد كل درس.',
  },
  {
    icon: Award,
    title: 'شهادة إتمام',
    description: 'احصل على شهادة معتمدة عند إتمام كل مستوى.',
  },
  {
    icon: Clock,
    title: 'مرونة في المواعيد',
    description: 'اختر الوقت المناسب لك من جدول مرن يناسب روتينك.',
  },
  {
    icon: Users,
    title: 'مجتمع الطلاب',
    description: 'انضم إلى مجتمع من المتعلمين ودعم متواصل بين الدروس.',
  },
]

export const FeaturesGrid: FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="py-20" style={{ background: 'var(--bg)' }}>
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: 'var(--ink)' }}>
            لماذا أكاديمية حبيبة؟
          </h2>
          <p className="mx-auto max-w-xl text-lg" style={{ color: 'var(--muted)' }}>
            تجربة تعليمية متكاملة تجمع بين الاحترافية والمرونة.
          </p>
        </div>

        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={cardVariant}
              whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col gap-4 rounded-[var(--radius-lg)] p-6"
              style={{ background: 'var(--card)', border: '1px solid var(--border-soft)' }}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)]"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <Icon size={22} />
              </span>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
