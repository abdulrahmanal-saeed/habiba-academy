import { useState } from 'react'
import type { FC } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { fadeInUp, stagger } from '@/design-system/animations'
import { Spinner, Button } from '@/design-system/components'
import { toast } from '@/design-system/components'
import { getBookProduct, submitBookCheckout } from './api'
import type { BookCheckoutForm } from './types'

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'cash',          label: 'دفع نقدي' },
  { value: 'other',         label: 'طريقة أخرى' },
]

const inputClass = 'w-full rounded-[var(--radius)] border px-4 py-3 text-sm outline-none transition-colors focus:ring-2'

export const BookCheckoutPage: FC = () => {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student', 'book-product'],
    queryFn:  getBookProduct,
    retry:    false,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<BookCheckoutForm>({
    defaultValues: { paymentMethod: 'bank_transfer', paymentReference: '', studentNotes: '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (form: BookCheckoutForm) => submitBookCheckout({
      packageId:        data?.package?.id ?? 0,
      paymentMethod:    form.paymentMethod,
      paymentReference: form.paymentReference,
      studentNotes:     form.studentNotes,
    }),
    onSuccess: () => setSubmitted(true),
    onError:   (e: Error) => toast.error(e.message),
  })

  const onSubmit: SubmitHandler<BookCheckoutForm> = (form) => mutate(form)

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !data || !data.canCheckout) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center" dir="rtl">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>الطلب غير متاح حالياً</p>
        <Link to="/student/book-product">
          <Button variant="ghost" size="sm">عودة للكتاب</Button>
        </Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12" dir="rtl">
        <motion.div
          variants={stagger} initial="hidden" animate="visible"
          className="w-full max-w-sm flex flex-col items-center gap-5 text-center"
        >
          <motion.div variants={fadeInUp}>
            <CheckCircle2 size={56} style={{ color: 'var(--success)' }} />
          </motion.div>
          <motion.div variants={fadeInUp} className="flex flex-col gap-2">
            <h2 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>تم إرسال طلبك!</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              سنراجع طلبك ونتواصل معك خلال ٢٤ ساعة عبر واتساب أو البريد الإلكتروني.
            </p>
          </motion.div>
          <motion.div variants={fadeInUp} className="flex flex-col gap-2 w-full">
            <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/student')}>
              العودة للرئيسية
            </Button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  const pkg = data.package

  return (
    <motion.div
      variants={stagger} initial="hidden" animate="visible"
      className="mx-auto max-w-lg px-4 py-8"
      dir="rtl"
    >
      <motion.div variants={fadeInUp}>
        <Link to="/student/book-product" className="inline-flex items-center gap-1.5 text-sm mb-6"
          style={{ color: 'var(--muted)' }}>
          <ArrowRight size={14} /> تفاصيل الكتاب
        </Link>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--ink)' }}>تأكيد طلب الشراء</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          أرسل طلبك وسنتواصل معك لإتمام الدفع وتفعيل وصولك.
        </p>
      </motion.div>

      {/* Order summary */}
      {pkg && (
        <motion.div
          variants={fadeInUp}
          className="rounded-[var(--radius-lg)] p-4 mb-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>الباقة المختارة</p>
          <p className="font-semibold" style={{ color: 'var(--ink)' }}>{pkg.titleAr}</p>
          <p className="text-lg font-bold mt-1" style={{ color: 'var(--accent)' }}>
            {pkg.price} {pkg.currency}
          </p>
        </motion.div>
      )}

      {/* Form */}
      <motion.form
        variants={fadeInUp}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        {/* Payment method */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            طريقة الدفع <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            {...register('paymentMethod', { required: true })}
            className={inputClass}
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }}
          >
            {PAYMENT_METHODS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Payment reference */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            رقم المرجع / الإيصال
          </label>
          <input
            {...register('paymentReference')}
            placeholder="رقم التحويل أو الإيصال (اختياري)"
            className={inputClass}
            dir="ltr"
            style={{ background: 'var(--surface)', borderColor: errors.paymentReference ? 'var(--danger)' : 'var(--border)', color: 'var(--ink)' }}
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>ملاحظات إضافية</label>
          <textarea
            {...register('studentNotes')}
            rows={3}
            placeholder="أي معلومات إضافية تود مشاركتها..."
            className={inputClass}
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)', resize: 'none' }}
          />
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isPending}>
          إرسال الطلب
        </Button>
      </motion.form>
    </motion.div>
  )
}

export default BookCheckoutPage
