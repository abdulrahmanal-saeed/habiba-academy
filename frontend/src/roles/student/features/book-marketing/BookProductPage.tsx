import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, BookOpen, Star, ArrowRight } from 'lucide-react'
import { fadeInUp, stagger, cardVariant } from '@/design-system/animations'
import { Spinner, Button } from '@/design-system/components'
import { getBookProduct } from './api'

const FEATURES_AR = [
  '٢٦ نوعاً من التمارين التفاعلية',
  'تصحيح مخصص من الأستاذة حبيبة',
  'تسجيل صوتي لتحسين النطق',
  'تتبع تقدمك في كل درس',
  'حصة مراجعة إضافية مع الأستاذة',
]

export const BookProductPage: FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student', 'book-product'],
    queryFn:  getBookProduct,
    retry:    false,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center" dir="rtl">
        <BookOpen size={48} style={{ color: 'var(--muted)' }} />
        <p className="text-sm" style={{ color: 'var(--muted)' }}>الكتاب غير متاح حالياً</p>
        <Link to="/student"><Button variant="ghost" size="sm">العودة</Button></Link>
      </div>
    )
  }

  const { book, pkg, hasAccess, requestStatus, canCheckout, canPreview } =
    { ...data, pkg: data.package }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-2xl px-4 py-8"
      dir="rtl"
    >
      {/* Back */}
      <motion.div variants={fadeInUp}>
        <Link to="/student" className="inline-flex items-center gap-1.5 text-sm mb-6"
          style={{ color: 'var(--muted)' }}>
          <ArrowRight size={14} /> الرئيسية
        </Link>
      </motion.div>

      {/* Hero card */}
      <motion.div
        variants={cardVariant}
        className="rounded-[var(--radius-xl)] p-6 mb-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-md)' }}
      >
        <span className="inline-block rounded-full px-3 py-1 text-xs font-bold mb-3"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          الكتاب التفاعلي الجديد ✦
        </span>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
          {book.titleAr}
        </h1>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          {pkg?.descriptionAr ?? 'تجربة تعلّم تفاعلية كاملة مع تصحيح مخصص من الأستاذة حبيبة.'}
        </p>

        {/* Price */}
        {pkg && (
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
              {pkg.price.toLocaleString('ar-AE')} {pkg.currency}
            </span>
            {pkg.originalPrice > pkg.price && (
              <span className="text-sm line-through" style={{ color: 'var(--muted)' }}>
                {pkg.originalPrice.toLocaleString('ar-AE')}
              </span>
            )}
          </div>
        )}

        {/* Features */}
        <ul className="flex flex-col gap-2 mb-6">
          {FEATURES_AR.map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-sm">
              <Check size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span style={{ color: 'var(--ink-soft)' }}>{feat}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <AccessCTA
          hasAccess={hasAccess}
          requestStatus={requestStatus}
          canCheckout={canCheckout}
          canPreview={canPreview}
        />
      </motion.div>

      {/* Ratings strip */}
      <motion.div
        variants={fadeInUp}
        className="flex items-center justify-center gap-2 text-sm py-3"
        style={{ color: 'var(--muted)' }}
      >
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill="currentColor" style={{ color: 'var(--warning)' }} />
        ))}
        <span>تقييم الطلاب: ٤.٩ / ٥</span>
      </motion.div>
    </motion.div>
  )
}

interface AccessCTAProps {
  hasAccess: boolean
  requestStatus: string | null
  canCheckout: boolean
  canPreview: boolean
}

const AccessCTA: FC<AccessCTAProps> = ({ hasAccess, requestStatus, canCheckout, canPreview }) => {
  if (hasAccess) {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-lg px-4 py-2 text-sm font-medium text-center"
          style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
          ✓ لديك وصول كامل للكتاب
        </div>
        <Link to={`/student/book`}>
          <Button variant="primary" size="lg" className="w-full">افتح الكتاب الآن</Button>
        </Link>
      </div>
    )
  }

  if (requestStatus === 'pending') {
    return (
      <div className="rounded-lg px-4 py-3 text-sm text-center"
        style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
        ⏳ طلبك قيد المراجعة — سنتواصل معك قريباً
      </div>
    )
  }

  if (requestStatus === 'needs_more_info') {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-lg px-4 py-2 text-xs text-center"
          style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
          يحتاج طلبك لمعلومات إضافية — يرجى التواصل معنا
        </div>
        {canCheckout && (
          <Link to="/student/book-checkout">
            <Button variant="primary" size="lg" className="w-full">تقديم طلب جديد</Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {canCheckout && (
        <Link to="/student/book-checkout">
          <Button variant="primary" size="lg" className="w-full">احجز نسختك الآن</Button>
        </Link>
      )}
      {canPreview && (
        <Link to={`/student/book`}>
          <Button variant="secondary" size="md" className="w-full">معاينة الكتاب</Button>
        </Link>
      )}
      {!canCheckout && !canPreview && (
        <div className="rounded-lg px-4 py-2 text-sm text-center"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          قريباً — سيتوفر الكتاب للشراء
        </div>
      )}
    </div>
  )
}

export default BookProductPage
