import { motion } from 'framer-motion'
import type { FC } from 'react'
import { fadeInUp, stagger } from '@/design-system/animations'
import { Spinner } from '@/design-system/components'
import { useOwnerSettings, useUpdateFlags, useUpdateProfile } from './hooks/useOwnerSettings'
import { ContentFlagsSection } from './components/ContentFlagsSection'
import { ProfileSection } from './components/ProfileSection'
import { SocialLinksSection } from './components/SocialLinksSection'
import type { FlagKey } from './types'

export const OwnerSettingsPage: FC = () => {
  const { data, isLoading, isError } = useOwnerSettings()
  const updateFlags   = useUpdateFlags()
  const updateProfile = useUpdateProfile()

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner /></div>
  }
  if (isError || !data) {
    return <p className="text-sm text-center py-10" style={{ color: 'var(--danger)' }}>Failed to load settings.</p>
  }

  function handleFlagToggle(key: FlagKey, val: boolean): void {
    updateFlags.mutate({ [key]: val })
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 max-w-2xl mx-auto flex flex-col gap-5"
    >
      <div>
        <h1 className="text-xl font-black" style={{ color: 'var(--fg)' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Manage content visibility, profile, and social links.</p>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        <ContentFlagsSection
          flags={data.flags}
          onToggle={handleFlagToggle}
          isUpdating={updateFlags.isPending}
        />
        <ProfileSection
          profile={data.profile}
          onSave={async (fd) => { await updateProfile.mutateAsync(fd) }}
          isSaving={updateProfile.isPending}
        />
        <SocialLinksSection
          profile={data.profile}
          onSave={async (fd) => { await updateProfile.mutateAsync(fd) }}
          isSaving={updateProfile.isPending}
        />
      </motion.div>
    </motion.div>
  )
}
