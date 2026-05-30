import type { FC } from 'react'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { motion } from 'framer-motion'
import { stagger, fadeInUp } from '@/design-system/animations'
import { Button } from '@/design-system/components'
import type { RegistrationData } from '../types'

interface RegistrationStepProps {
  onSubmit: (data: RegistrationData) => void
  isLoading: boolean
}

const inputClass =
  'w-full rounded-[var(--radius)] border px-4 py-3 text-sm outline-none transition-colors focus:ring-2'

export const RegistrationStep: FC<RegistrationStepProps> = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationData>()

  const submit: SubmitHandler<RegistrationData> = (data) => onSubmit(data)

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeInUp} className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold md:text-3xl" style={{ color: 'var(--ink)' }}>
          اختبار تحديد المستوى
        </h1>
        <p className="text-base" style={{ color: 'var(--muted)' }}>
          اختبار مجاني يستغرق ٢٠–٣٠ دقيقة. أدخل بياناتك للبدء.
        </p>
      </motion.div>

      <motion.form
        variants={fadeInUp}
        onSubmit={handleSubmit(submit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            الاسم الكامل <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            {...register('fullName', { required: 'الاسم الكامل مطلوب' })}
            placeholder="مثال: أحمد محمد"
            className={inputClass}
            style={{
              background: 'var(--surface)',
              borderColor: errors.fullName ? 'var(--danger)' : 'var(--border)',
              color: 'var(--ink)',
            }}
          />
          {errors.fullName && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.fullName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            رقم واتساب <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            {...register('whatsapp', {
              required: 'رقم واتساب مطلوب',
              pattern: { value: /^[0-9]{7,15}$/, message: 'رقم غير صحيح (أرقام فقط، بدون صفر أول)' },
            })}
            type="tel"
            placeholder="971501234567"
            dir="ltr"
            className={inputClass}
            style={{
              background: 'var(--surface)',
              borderColor: errors.whatsapp ? 'var(--danger)' : 'var(--border)',
              color: 'var(--ink)',
            }}
          />
          {errors.whatsapp && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.whatsapp.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            البريد الإلكتروني <span style={{ color: 'var(--muted)' }}>(اختياري)</span>
          </label>
          <input
            {...register('email', {
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'بريد إلكتروني غير صحيح' },
            })}
            type="email"
            placeholder="example@email.com"
            dir="ltr"
            className={inputClass}
            style={{
              background: 'var(--surface)',
              borderColor: errors.email ? 'var(--danger)' : 'var(--border)',
              color: 'var(--ink)',
            }}
          />
          {errors.email && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>العمر</label>
            <input
              {...register('age', {
                min: { value: 5, message: 'عمر غير صحيح' },
                max: { value: 99, message: 'عمر غير صحيح' },
              })}
              type="number"
              placeholder="٢٥"
              className={inputClass}
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--ink)',
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>الدولة</label>
            <input
              {...register('country')}
              placeholder="الإمارات"
              className={inputClass}
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--ink)',
              }}
            />
          </div>
        </div>

        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" isLoading={isLoading}>
          ابدأ الاختبار
        </Button>
      </motion.form>
    </motion.div>
  )
}
