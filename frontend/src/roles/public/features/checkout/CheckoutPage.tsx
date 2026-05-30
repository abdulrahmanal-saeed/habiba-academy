import type { FC } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Check, ShieldCheck, Lock } from 'lucide-react'
import { stagger, fadeInUp, cardVariant } from '@/design-system/animations'
import { Button, Spinner } from '@/design-system/components'
import { toast } from '@/design-system/components'
import { STALE } from '@/core/lib/queryClient'
import { getPricingPlans, initiateCheckout } from './api'
import type { CheckoutContactForm } from './types'

const inputClass =
  'w-full rounded-[var(--radius)] border px-4 py-3 text-sm outline-none transition-colors focus:ring-2'

export const CheckoutPage: FC = () => {
  const { planSlug } = useParams<{ planSlug: string }>()

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['public', 'pricing'],
    queryFn: getPricingPlans,
    staleTime: STALE.settings,
  })

  const plan = plans.find((p) => p.slug === planSlug)

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutContactForm>()

  const { mutate: checkout, isPending } = useMutation({
    mutationFn: ({ contact }: { contact: CheckoutContactForm }) =>
      initiateCheckout(planSlug ?? '', contact),
    onSuccess: (url) => { window.location.href = url },
    onError: (e: Error) => toast.error(e.message),
  })

  const onSubmit: SubmitHandler<CheckoutContactForm> = (data) => checkout({ contact: data })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!planSlug || (!isLoading && !plan)) {
    return <Navigate to="/#pricing" replace />
  }

  return (
    <div className="min-h-screen py-16" style={{ background: 'var(--bg)' }}>
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-8 md:grid-cols-[1fr,380px]">

          {/* Contact form */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-6">
            <div>
              <h1 className="mb-1 text-2xl font-bold" style={{ color: 'var(--ink)' }}>
                أكمل بيانات الاشتراك
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                ستُوجَّه بعد ذلك إلى صفحة الدفع الآمنة
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  الاسم الكامل <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  {...register('name', { required: 'الاسم مطلوب' })}
                  placeholder="اسمك الكامل"
                  className={inputClass}
                  style={{ background: 'var(--surface)', borderColor: errors.name ? 'var(--danger)' : 'var(--border)', color: 'var(--ink)' }}
                />
                {errors.name && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.name.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  البريد الإلكتروني <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  {...register('email', {
                    required: 'البريد الإلكتروني مطلوب',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'بريد غير صحيح' },
                  })}
                  type="email"
                  placeholder="example@email.com"
                  dir="ltr"
                  className={inputClass}
                  style={{ background: 'var(--surface)', borderColor: errors.email ? 'var(--danger)' : 'var(--border)', color: 'var(--ink)' }}
                />
                {errors.email && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  رقم الهاتف (واتساب) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  {...register('phone', { required: 'رقم الهاتف مطلوب' })}
                  type="tel"
                  placeholder="971501234567"
                  dir="ltr"
                  className={inputClass}
                  style={{ background: 'var(--surface)', borderColor: errors.phone ? 'var(--danger)' : 'var(--border)', color: 'var(--ink)' }}
                />
                {errors.phone && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.phone.message}</p>}
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isPending}
                leftIcon={<Lock size={16} />}>
                الدفع الآمن عبر Ziina
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                <span className="flex items-center gap-1"><ShieldCheck size={13} /> دفع آمن ومشفر</span>
                <span>•</span>
                <span className="flex items-center gap-1"><ShieldCheck size={13} /> ضمان استرداد ٧ أيام</span>
              </div>
            </form>
          </motion.div>

          {/* Plan summary */}
          {plan && (
            <motion.div
              variants={cardVariant}
              className="flex flex-col gap-4 self-start rounded-[var(--radius-lg)] p-6"
              style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-md)' }}
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                  الباقة المختارة
                </p>
                <h2 className="mt-1 text-xl font-bold" style={{ color: 'var(--ink)' }}>{plan.name}</h2>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{plan.description}</p>
              </div>

              <div className="py-3" style={{ borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)' }}>
                <span className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
                  {Math.floor(plan.priceAed / 100).toLocaleString('en')}
                </span>
                <span className="ms-1 text-sm" style={{ color: 'var(--muted)' }}>
                  د.إ / {plan.periodLabel}
                </span>
              </div>

              <ul className="flex flex-col gap-2">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm">
                    <Check size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
                    <span style={{ color: 'var(--ink-soft)' }}>{feat}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default CheckoutPage
