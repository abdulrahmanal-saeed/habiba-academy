import type { FC } from 'react'
import { ExternalLink } from 'lucide-react'
import { VideoLinkViewer } from './VideoLinkViewer'
import { ArticleViewer } from './ArticleViewer'
import type { MaterialDetail } from '../types'

export interface MaterialViewerProps {
  material: MaterialDetail
}

export const MaterialViewer: FC<MaterialViewerProps> = ({ material }) => {
  const { type, href, title, description } = material

  if (type === 'article' || type === 'mixed') {
    return <ArticleViewer description={description} />
  }

  if (!href) {
    return (
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        No material source attached.
      </p>
    )
  }

  if (type === 'video') {
    return (
      <video
        controls
        preload="metadata"
        src={href}
        className="w-full rounded-xl"
        style={{ maxHeight: '60vh' }}
      />
    )
  }

  if (type === 'video_link') {
    return <VideoLinkViewer href={href} title={title} />
  }

  if (type === 'audio') {
    return <audio controls preload="metadata" src={href} className="w-full rounded-lg" />
  }

  if (type === 'pdf') {
    return (
      <iframe
        src={`${href}#toolbar=1`}
        title={title}
        className="w-full rounded-xl"
        style={{ minHeight: '72vh', border: '1px solid var(--border)' }}
      />
    )
  }

  if (type === 'image') {
    return (
      <img
        src={href}
        alt={title}
        className="max-w-full rounded-xl"
        style={{ border: '1px solid var(--border)' }}
      />
    )
  }

  if (type === 'html') {
    return (
      <iframe
        src={href}
        title={title}
        sandbox="allow-scripts allow-forms allow-popups"
        className="w-full rounded-xl"
        style={{ minHeight: '72vh', border: '1px solid var(--border)' }}
      />
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
      <ExternalLink size={15} /> Open Material
    </a>
  )
}
