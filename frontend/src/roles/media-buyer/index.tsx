import { Routes, Route } from 'react-router-dom'
import { MediaBuyerLayout } from './components/MediaBuyerLayout'
import { MediaBuyerDashboardPage } from './features/dashboard'
import { TrackingPage } from './features/tracking'
import { CampaignsPage } from './features/campaigns'
import { CommissionsPage } from './features/commissions'
import { MediaBuyerNotificationsPage } from './features/notifications'
import { AgreementPage } from './features/agreement'

const MediaBuyerApp = () => (
  <Routes>
    {/* Agreement has no layout nav */}
    <Route path="agreement" element={<AgreementPage />} />

    {/* All other routes use the layout */}
    <Route
      path="*"
      element={
        <MediaBuyerLayout>
          <Routes>
            <Route index              element={<MediaBuyerDashboardPage />} />
            <Route path="tracking"    element={<TrackingPage />} />
            <Route path="campaigns"   element={<CampaignsPage />} />
            <Route path="commissions" element={<CommissionsPage />} />
            <Route path="notifications" element={<MediaBuyerNotificationsPage />} />
          </Routes>
        </MediaBuyerLayout>
      }
    />
  </Routes>
)

export default MediaBuyerApp
