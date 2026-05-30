import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp } from '@/design-system/animations'
import { MediaPlayer } from '../components/MediaPlayer'
import type { VideoSection as VideoSectionType } from './types'

export const VideoSection: FC<{ section: VideoSectionType }> = ({ section }) => (
  <motion.section variants={fadeInUp} initial="hidden" animate="visible" style={{ marginBottom: '1rem' }}>
    {section.videoTitle && (
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>{section.videoTitle}</h2>
    )}
    <MediaPlayer src={section.videoUrl} type="auto" title={section.videoTitle} />
  </motion.section>
)
