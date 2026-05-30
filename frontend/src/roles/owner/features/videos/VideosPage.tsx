import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FC } from 'react'
import { Plus } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useVideos, useSaveVideo, useDeleteVideo, useToggleVideo } from './hooks/useVideos'
import { VideosTable } from './components/VideosTable'
import { VideoEditorDrawer } from './components/VideoEditorDrawer'
import type { Video } from './types'

export const VideosPage: FC = () => {
  const [selected, setSelected] = useState<Video | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, isLoading, isError } = useVideos()
  const save   = useSaveVideo()
  const del    = useDeleteVideo()
  const toggle = useToggleVideo()

  function openNew(): void {
    setSelected(null)
    setDrawerOpen(true)
  }

  function openEdit(video: Video): void {
    setSelected(video)
    setDrawerOpen(true)
  }

  function handleDelete(id: number): void {
    if (!window.confirm('Delete this video? This cannot be undone.')) return
    del.mutate(id)
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 flex flex-col gap-5 max-w-[960px] mx-auto"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--fg)' }}>Videos</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Manage YouTube videos published on the site.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={14} /> New Video
        </button>
      </div>

      {isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
      {isError && <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>Failed to load videos.</p>}
      {data && (
        <VideosTable
          videos={data}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggle={(id) => toggle.mutate(id)}
          isToggling={toggle.isPending}
          isDeleting={del.isPending}
        />
      )}

      <VideoEditorDrawer
        video={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={async (fd) => { await save.mutateAsync(fd) }}
        isSaving={save.isPending}
      />
    </motion.div>
  )
}
