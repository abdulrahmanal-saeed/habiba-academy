import { useState } from 'react'
import type { FC } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, BookOpen, AlertCircle } from 'lucide-react'
import { fadeInUp } from '@/design-system/animations'
import { addWeakWord, addMistake } from '../api'

interface OverviewTabProps {
  studentId: number
}

export const OverviewTab: FC<OverviewTabProps> = ({ studentId }) => {
  const qc = useQueryClient()

  const [word, setWord] = useState('')
  const [wordNote, setWordNote] = useState('')
  const [tag, setTag] = useState('')
  const [tagNote, setTagNote] = useState('')

  const addWordMutation = useMutation({
    mutationFn: () => addWeakWord(studentId, word.trim(), wordNote.trim()),
    onSuccess: () => {
      setWord('')
      setWordNote('')
      void qc.invalidateQueries({ queryKey: ['student-weak-words', studentId] })
    },
  })

  const addMistakeMutation = useMutation({
    mutationFn: () => addMistake(studentId, tag.trim(), tagNote.trim()),
    onSuccess: () => {
      setTag('')
      setTagNote('')
      void qc.invalidateQueries({ queryKey: ['student-mistakes', studentId] })
    },
  })

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="grid gap-4">
      {/* Add Weak Word */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={15} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Add Weak Word</h3>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Word (Arabic or English)"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={wordNote}
            onChange={(e) => setWordNote(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            disabled={!word.trim() || addWordMutation.isPending}
            onClick={() => addWordMutation.mutate()}
            className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              background: word.trim() ? 'var(--accent)' : 'var(--border)',
              color: word.trim() ? '#fff' : 'var(--muted)',
              border: 'none',
              cursor: word.trim() ? 'pointer' : 'default',
            }}
          >
            <Plus size={14} />
            {addWordMutation.isPending ? 'Saving…' : 'Add Word'}
          </button>
          {addWordMutation.isError && (
            <p className="text-xs" style={{ color: 'var(--error)' }}>Failed to save. Try again.</p>
          )}
        </div>
      </div>

      {/* Add Mistake */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={15} style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Add Common Mistake</h3>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Mistake tag (e.g. verb agreement)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={tagNote}
            onChange={(e) => setTagNote(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            disabled={!tag.trim() || addMistakeMutation.isPending}
            onClick={() => addMistakeMutation.mutate()}
            className="flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              background: tag.trim() ? 'var(--accent)' : 'var(--border)',
              color: tag.trim() ? '#fff' : 'var(--muted)',
              border: 'none',
              cursor: tag.trim() ? 'pointer' : 'default',
            }}
          >
            <Plus size={14} />
            {addMistakeMutation.isPending ? 'Saving…' : 'Add Mistake'}
          </button>
          {addMistakeMutation.isError && (
            <p className="text-xs" style={{ color: 'var(--error)' }}>Failed to save. Try again.</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
