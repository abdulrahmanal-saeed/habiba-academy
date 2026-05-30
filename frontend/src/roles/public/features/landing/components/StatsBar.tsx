import { useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
import { motion, useInView } from 'framer-motion'
import { stagger, fadeInUp } from '@/design-system/animations'

interface Stat {
  value: number
  suffix: string
  label: string
  decimals: number
}

const STATS: Stat[] = [
  { value: 500,  suffix: '+', label: 'طالب نشط',       decimals: 0 },
  { value: 5000, suffix: '+', label: 'درس مكتمل',      decimals: 0 },
  { value: 4.9,  suffix: '★', label: 'متوسط التقييم', decimals: 1 },
  { value: 7,    suffix: '+', label: 'سنوات خبرة',     decimals: 0 },
]

function useCountUp(target: number, decimals: number, inView: boolean): string {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1400
    const startTime = performance.now()

    const rafId = requestAnimationFrame(function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Number((eased * target).toFixed(decimals)))
      if (progress < 1) requestAnimationFrame(tick)
    })

    return () => cancelAnimationFrame(rafId)
  }, [inView, target, decimals])

  return decimals > 0 ? count.toFixed(decimals) : String(Math.round(count))
}

const StatCounter: FC<{ stat: Stat; inView: boolean }> = ({ stat, inView }) => {
  const display = useCountUp(stat.value, stat.decimals, inView)

  return (
    <motion.div variants={fadeInUp} className="flex flex-col items-center gap-1 text-center">
      <p className="text-4xl font-bold md:text-5xl" style={{ color: 'var(--accent)' }}>
        {display}
        <span className="text-3xl">{stat.suffix}</span>
      </p>
      <p className="text-sm font-medium md:text-base" style={{ color: 'var(--muted)' }}>
        {stat.label}
      </p>
    </motion.div>
  )
}

export const StatsBar: FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      ref={ref}
      className="py-16"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border-soft)',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="container mx-auto grid grid-cols-2 gap-8 px-4 md:grid-cols-4"
      >
        {STATS.map((stat) => (
          <StatCounter key={stat.label} stat={stat} inView={inView} />
        ))}
      </motion.div>
    </section>
  )
}
