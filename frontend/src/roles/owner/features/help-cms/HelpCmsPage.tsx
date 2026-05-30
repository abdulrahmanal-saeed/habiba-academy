import type { FC } from 'react'
import { HelpCenterCmsPage } from '@/roles/teacher/features/help-center-cms'

/**
 * Owner Help Center CMS.
 * Owner shares the teacher session, so the same CMS backend + UI apply.
 * Per RULE 4 (no duplication) we reuse the teacher page rather than fork it.
 */
export const HelpCmsPage: FC = () => <HelpCenterCmsPage />
