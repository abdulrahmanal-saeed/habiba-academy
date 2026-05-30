import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { stagger, cardVariant } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { STALE } from '@/core/lib/queryClient'
import { getVideos } from './api'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export const VideosListPage: FC = () => {
  const navigate = useNavigate()

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['public', 'videos'],
    queryFn: getVideos,
    staleTime: STALE.articles,
  })

  return (
    <div className="min-h-screen py-16" style={{ background: 'var(--bg)' }}>
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: 'var(--ink)' }}>
            الفيديوهات التعليمية
          </h1>
          <p className="text-lg" style={{ color: 'var(--muted)' }}>
            شاهد دروساً مجانية في اللغة العربية مع أستاذة حبيبة
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {videos.map((video) => (
              <motion.div
                key={video.id}
                variants={cardVariant}
                whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => navigate(`/videos/${video.slug}`)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-[var(--radius-lg)]"
                style={{ background: 'var(--card)', border: '1px solid var(--border-soft)', boxShadow: 'var(--shadow-sm)' }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--surface)' }}>
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Play size={40} style={{ color: 'var(--muted-light)' }} />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: 'rgba(0,0,0,0.35)' }}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ background: 'var(--accent)' }}
                    >
                      <Play size={20} className="ms-0.5" style={{ color: 'white' }} />
                    </div>
                  </div>
                  <span
                    className="absolute bottom-2 end-2 rounded px-1.5 py-0.5 text-xs font-medium text-white"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    {formatDuration(video.durationSeconds)}
                  </span>
                </div>

                <div className="flex flex-col gap-2 p-4">
                  <span
                    className="w-fit rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    {video.category}
                  </span>
                  <h2 className="text-sm font-semibold leading-snug" style={{ color: 'var(--ink)' }}>
                    {video.title}
                  </h2>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default VideosListPage
