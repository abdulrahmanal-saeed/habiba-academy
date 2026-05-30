import type { FC } from 'react'
import { Video } from 'lucide-react'

interface YoutubePreviewProps {
  url: string
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split(/[?&]/)[0] ?? null
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1]?.split(/[?&/]/)[0] ?? null
      return u.searchParams.get('v')
    }
  } catch {
    // invalid URL
  }
  return null
}

export const YoutubePreview: FC<YoutubePreviewProps> = ({ url }) => {
  const id = extractYoutubeId(url)

  if (!id) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-1 rounded-xl"
        style={{ height: 80, background: 'var(--surface)', border: '1px dashed var(--border)' }}
      >
        <Video size={20} style={{ color: 'var(--muted)' }} />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>Enter a YouTube URL to preview</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl p-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <img
        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
        alt="YouTube thumbnail"
        className="rounded-lg object-cover flex-shrink-0"
        style={{ width: 80, height: 56 }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold" style={{ color: 'var(--fg)' }}>Video ID: {id}</div>
        <div className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>
          youtube.com/embed/{id}
        </div>
      </div>
    </div>
  )
}

