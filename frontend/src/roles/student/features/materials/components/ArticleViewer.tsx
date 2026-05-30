import type { FC } from 'react'

export interface ArticleViewerProps {
  description: string | null
}

export const ArticleViewer: FC<ArticleViewerProps> = ({ description }) => {
  if (!description) {
    return (
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        No content available.
      </p>
    )
  }

  return (
    <article
      className="text-sm leading-loose"
      style={{ color: 'var(--fg)', whiteSpace: 'pre-wrap' }}
    >
      {description}
    </article>
  )
}
