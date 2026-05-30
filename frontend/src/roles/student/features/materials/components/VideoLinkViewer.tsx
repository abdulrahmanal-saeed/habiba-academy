import type { FC } from 'react'
import { ExternalLink } from 'lucide-react'
import { extractEmbedUrl } from '../utils'

export interface VideoLinkViewerProps {
  href: string
  title: string
}

export const VideoLinkViewer: FC<VideoLinkViewerProps> = ({ href, title }) => {
  const embedUrl = extractEmbedUrl(href)

  if (embedUrl) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={embedUrl}
          title={title}
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
        />
      </div>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
      style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
    >
      <ExternalLink size={15} /> Open Video
    </a>
  )
}
