import type { FC } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react'
import { fadeInUp, stagger } from '@/design-system/animations'
import { Spinner, Button } from '@/design-system/components'
import { getCheckoutStatus } from './api'

const WHATSAPP_URL = 'https://wa.me/971509298326'

export const CheckoutStatusPage: FC = () => {
  const [params] = useSearchParams()
  const routeStatus = params.get('status') ?? ''
  const reference   = params.get('checkout_ref') ?? params.get('reference') ?? ''

  const { data, isLoading, isError } = useQuery({
    queryKey: ['checkout-status', reference],
    queryFn:  () => getCheckoutStatus(reference),
    enabled:  reference !== '',
    retry:    1,
    staleTime: 0,
  })

  if (!reference) {
    return <StatusShell><ErrorState /></StatusShell>
  }

  if (isLoading) {
    return (
      <StatusShell>
        <div className="flex flex-col items-center gap-4 py-16">
          <Spinner size="lg" />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>جاري التحقق من حالة الدفع…</p>
        </div>
      </StatusShell>
    )
  }

  const status = data?.status ?? routeStatus
  const order  = data?.order

  if (isError || !data) {
    return (
      <StatusShell>
        <StatusCard
          icon={<Clock size={52} style={{ color: 'var(--warning)' }} />}
          title="جاري معالجة الدفع"
          subtitle="لم نتمكن من التحقق من حالة المعاملة في الوقت الفعلي. سنتواصل معك عبر البريد الإلكتروني أو واتساب."
          actions={<ContactActions />}
        />
      </StatusShell>
    )
  }

  if (status === 'paid') {
    return (
      <StatusShell>
        <StatusCard
          icon={<CheckCircle2 size={52} style={{ color: 'var(--success)' }} />}
          title="تم الدفع بنجاح 🎉"
          subtitle={`شكراً ${order?.fullName ?? ''}! تم استلام دفعتك وسنتواصل معك خلال ٢٤ ساعة لترتيب أول جلسة.`}
          badge={{ label: 'تم الدفع', color: 'var(--success)' }}
          actions={
            <div className="flex flex-col gap-3">
              <a
                href={`${WHATSAPP_URL}?text=${encodeURIComponent('مرحباً! أتممت الدفع للاشتراك في أكاديمية حبيبة نبيل.')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="lg" className="w-full">
                  تواصل معنا على واتساب
                </Button>
              </a>
              <Link to="/">
                <Button variant="ghost" size="md" className="w-full">
                  العودة للرئيسية
                </Button>
              </Link>
            </div>
          }
        />
      </StatusShell>
    )
  }

  if (status === 'failed' || routeStatus === 'cancelled' || routeStatus === 'failed') {
    return (
      <StatusShell>
        <StatusCard
          icon={<XCircle size={52} style={{ color: 'var(--danger)' }} />}
          title={routeStatus === 'cancelled' ? 'تم إلغاء الدفع' : 'فشلت عملية الدفع'}
          subtitle="لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى أو التواصل معنا."
          badge={{ label: routeStatus === 'cancelled' ? 'ملغي' : 'فشل الدفع', color: 'var(--danger)' }}
          actions={
            <div className="flex flex-col gap-3">
              <Link to="/#pricing">
                <Button variant="primary" size="lg" className="w-full">
                  حاول مرة أخرى
                </Button>
              </Link>
              <ContactActions />
            </div>
          }
        />
      </StatusShell>
    )
  }

  // pending_verification or unknown
  return (
    <StatusShell>
      <StatusCard
        icon={<Clock size={52} style={{ color: 'var(--warning)' }} />}
        title="جاري مراجعة الدفع"
        subtitle="دفعتك قيد المراجعة. سنتواصل معك خلال ساعات قليلة بعد التأكيد."
        badge={{ label: 'قيد المراجعة', color: 'var(--warning)' }}
        actions={<ContactActions />}
      />
    </StatusShell>
  )
}

/* ── helpers ── */

const StatusShell: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="flex min-h-screen flex-col items-center justify-center px-4 py-16"
    style={{ background: 'var(--bg)' }}
    dir="rtl"
  >
    <div className="w-full max-w-md">{children}</div>
  </div>
)

interface StatusCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  badge?: { label: string; color: string }
  actions?: React.ReactNode
}

const StatusCard: FC<StatusCardProps> = ({ icon, title, subtitle, badge, actions }) => (
  <motion.div
    variants={stagger}
    initial="hidden"
    animate="visible"
    className="flex flex-col items-center gap-6 rounded-[var(--radius-xl)] p-8 text-center"
    style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-lg)' }}
  >
    <motion.div variants={fadeInUp}>{icon}</motion.div>
    <motion.div variants={fadeInUp} className="flex flex-col gap-2">
      {badge && (
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: `${badge.color}22`, color: badge.color }}
        >
          {badge.label}
        </span>
      )}
      <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{title}</h1>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{subtitle}</p>
    </motion.div>
    {actions && <motion.div variants={fadeInUp} className="w-full">{actions}</motion.div>}
  </motion.div>
)

const ContactActions: FC = () => (
  <div className="flex flex-col gap-3">
    <a
      href={`${WHATSAPP_URL}?text=${encodeURIComponent('مرحباً! لدي سؤال بخصوص الاشتراك.')}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button variant="secondary" size="md" className="w-full">
        تواصل على واتساب
      </Button>
    </a>
    <Link to="/">
      <Button variant="ghost" size="sm" className="w-full" leftIcon={<ArrowRight size={14} />}>
        العودة للرئيسية
      </Button>
    </Link>
  </div>
)

const ErrorState: FC = () => (
  <StatusCard
    icon={<XCircle size={52} style={{ color: 'var(--danger)' }} />}
    title="رابط غير صحيح"
    subtitle="لم يتم العثور على معلومات الطلب. إذا كنت قد أتممت الدفع، تواصل معنا."
    actions={<ContactActions />}
  />
)

export default CheckoutStatusPage
