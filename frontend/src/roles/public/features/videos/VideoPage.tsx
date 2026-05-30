import type { FC } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar } from 'lucide-react'
import { stagger, fadeInUp } from '@/design-system/animations'
import { Button, Spinner } from '@/design-system/components'
import { STALE } from '@/core/lib/queryClient'
import { getVideo } from './api'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })
}

export const VideoPage: FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { data: video, isLoading, isError } = useQuery({
    queryKey: ['public', 'video', slug],
    queryFn: () => getVideo(slug ?? ''),
    enabled: !!slug,
    staleTime: STALE.articles,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !video) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
        <p className="text-lg font-medium" style={{ color: 'var(--ink)' }}>الفيديو غير موجود</p>
        <Button variant="ghost" onClick={() => navigate('/videos')} leftIcon={<ArrowRight size={16} />}>
          العودة للفيديوهات
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12" style={{ background: 'var(--bg)' }}>
      <div className="container mx-auto max-w-3xl px-4">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">

          <motion.div variants={fadeInUp}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/videos')}
              leftIcon={<ArrowRight size={16} />}
              className="mb-4"
            >
              العودة للفيديوهات
            </Button>

            <span
              className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {video.category}
            </span>

            <h1 className="mb-3 text-2xl font-bold md:text-3xl" style={{ color: 'var(--ink)' }}>
              {video.title}
            </h1>

            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
              <Calendar size={13} />
              {formatDate(video.publishedAt)}
            </div>
          </motion.div>

          {/* Video player */}
          <motion.div
            variants={fadeInUp}
            className="overflow-hidden rounded-[var(--radius-lg)]"
            style={{ boxShadow: 'var(--shadow-lg)', background: '#000' }}
          >
            <video
              controls
              src={video.videoUrl}
              poster={video.thumbnailUrl}
              className="aspect-video w-full"
              style={{ display: 'block' }}
            />
          </motion.div>

          {video.description && (
            <motion.p
              variants={fadeInUp}
              className="text-base leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              {video.description}
            </motion.p>
          )}

          <motion.div
            variants={fadeInUp}
            className="rounded-[var(--radius-lg)] p-6 text-center"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}
          >
            <p className="mb-4 font-semibold" style={{ color: 'var(--ink)' }}>
              أعجبك المحتوى؟ ابدأ رحلتك مع أستاذة حبيبة
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate('/level-test')}>
              اختبر مستواك مجاناً
            </Button>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}

export default VideoPage
