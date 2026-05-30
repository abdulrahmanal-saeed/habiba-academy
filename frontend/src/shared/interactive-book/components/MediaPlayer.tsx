import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'

export interface MediaPlayerProps {
  src: string
  type?: 'audio' | 'video' | 'auto'
  title?: string
}

function extractYouTubeId(url: string): string | null {
  const match = /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/.exec(url)
  return match ? match[1] : null
}

function isYouTube(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function resolveType(src: string, hint: 'audio' | 'video' | 'auto'): 'audio' | 'video' | 'youtube' {
  if (isYouTube(src)) return 'youtube'
  if (hint !== 'auto') return hint
  const ext = src.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video'
  return 'audio'
}

export const MediaPlayer: FC<MediaPlayerProps> = ({ src, type = 'auto', title }) => {
  if (!src) return null

  const resolved = resolveType(src, type)

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      style={{ width: '100%' }}
    >
      {title && (
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--ink-soft)',
            marginBottom: '0.5rem',
          }}
        >
          {title}
        </p>
      )}

      {resolved === 'youtube' && (
        <div
          style={{
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            background: 'var(--bg-alt)',
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${extractYouTubeId(src) ?? ''}`}
            title={title ?? 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              insetInlineStart: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      )}

      {resolved === 'video' && (
        <video
          controls
          src={src}
          style={{
            width: '100%',
            borderRadius: 'var(--radius)',
            background: '#000',
            maxHeight: 400,
          }}
        />
      )}

      {resolved === 'audio' && (
        <audio
          controls
          src={src}
          style={{ width: '100%' }}
        />
      )}
    </motion.div>
  )
}
