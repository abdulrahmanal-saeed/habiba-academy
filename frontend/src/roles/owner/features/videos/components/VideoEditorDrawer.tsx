import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC } from 'react'
import { X, Save } from 'lucide-react'
import { drawerVariant, modalBackdrop } from '@/design-system/animations'
import { VideoForm } from './VideoForm'
import type { Video, VideoSavePayload } from '../types'

interface VideoEditorDrawerProps {
  video: Video | null
  open: boolean
  onClose: () => void
  onSave: (form: FormData) => Promise<void>
  isSaving: boolean
}

const Inner: FC<VideoEditorDrawerProps> = ({ video, onClose, onSave, isSaving }) => {
  const payloadRef = useRef<VideoSavePayload | null>(null)

  async function handleSave(): Promise<void> {
    const p = payloadRef.current
    if (!p || !p.title.trim() || !p.youtube_url.trim()) return

    const fd = new FormData()
    fd.append('action', 'save')
    fd.append('id', String(p.id ?? 0))
    fd.append('title', p.title)
    fd.append('slug', p.slug)
    fd.append('youtube_url', p.youtube_url)
    fd.append('short_description', p.short_description)
    fd.append('status', p.status)
    fd.append('show_on_homepage', p.show_on_homepage ? '1' : '0')
    fd.append('sort_order', String(p.sort_order))

    await onSave(fd)
    onClose()
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
          {video ? 'Edit Video' : 'New Video'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}
          >
            <Save size={12} />
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <VideoForm video={video} onChange={(p) => { payloadRef.current = p }} />
      </div>
    </>
  )
}

export const VideoEditorDrawer: FC<VideoEditorDrawerProps> = (props) => (
  <AnimatePresence>
    {props.open && (
      <>
        <motion.div key="bd" variants={modalBackdrop} initial="hidden" animate="visible" exit="hidden"
          onClick={props.onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300 }}
        />
        <motion.aside key="drawer" variants={drawerVariant} initial="hidden" animate="visible" exit="hidden"
          style={{
            position: 'fixed', insetBlockStart: 0, insetInlineEnd: 0,
            width: 480, height: '100dvh',
            background: 'var(--bg)', borderInlineStart: '1px solid var(--border)',
            zIndex: 301, display: 'flex', flexDirection: 'column',
          }}
        >
          <Inner key={props.video?.id ?? 'new'} {...props} />
        </motion.aside>
      </>
    )}
  </AnimatePresence>
)
