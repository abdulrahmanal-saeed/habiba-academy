import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Headphones } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'

export interface ListeningStepProps {
  mediaUrl: string
  instructions: string | null
}

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] ?? null
}

function isAudioFile(url: string): boolean {
  return /\.(mp3|ogg|wav|m4a)$/i.test(url)
}

export const ListeningStep: FC<ListeningStepProps> = ({ mediaUrl, instructions }) => {
  const ytId = extractYoutubeId(mediaUrl)

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <Headphones size={20} color="var(--accent)" />
        <h2 className="font-bold text-base" style={{ color: 'var(--fg)' }}>
          قسم الاستماع
        </h2>
      </div>

      {instructions && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {instructions}
        </p>
      )}

      {ytId ? (
        <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            allowFullScreen
            title="Listening"
            className="absolute inset-0 w-full h-full"
          />
        </div>
      ) : isAudioFile(mediaUrl) ? (
        <audio controls className="w-full rounded-lg">
          <source src={mediaUrl} />
        </audio>
      ) : (
        <video controls className="w-full rounded-xl">
          <source src={mediaUrl} />
        </video>
      )}
    </motion.div>
  )
}
