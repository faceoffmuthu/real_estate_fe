import { Route, Routes } from 'react-router-dom'
import { AdminDashboard } from '../pages/admin/AdminDashboard'
import { ApprovalsPage } from '../pages/approvals/ApprovalsPage'
import { AccountAccessPage } from '../pages/auth/AccountAccessPage'
import { FollowUpsPage } from '../pages/records/FollowUpsPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { PartiesPage } from '../pages/parties/PartiesPage'
import { PartyDetailPage } from '../pages/parties/PartyDetailPage'
import { RecordDetailPage } from '../pages/records/RecordDetailPage'
import { RecordFormPage } from '../pages/records/RecordFormPage'
import { RecordsPage } from '../pages/records/RecordsPage'
import { AccountsPage } from '../pages/shared/AccountsPage'
import { ActivityPage } from '../pages/shared/ActivityPage'
import { AccountSettingsPage } from '../pages/shared/AccountSettingsPage'
import { ProfilePage } from '../pages/shared/ProfilePage'
import { ReportsPage } from '../pages/shared/ReportsPage'
import { NotFoundPage } from '../pages/shared/StatusPages'
import { PropertyTypesPage } from '../pages/super-admin/PropertyTypesPage'
import { SettingsPage } from '../pages/super-admin/SettingsPage'
import { SuperAdminDashboard } from '../pages/super-admin/SuperAdminDashboard'
import { UserDashboard } from '../pages/user/UserDashboard'
import { GuestRoute, HomeRedirect, ProtectedRoute } from './guards'

/** Records + parties routes shared by every role area. Super Admin gets no create/edit routes (view-only). */
function recordRoutes(canEdit: boolean) {
  return (
    <>
      <Route path="follow-ups" element={<FollowUpsPage />} />
      <Route path="records" element={<RecordsPage />} />
      {canEdit && <Route path="records/new" element={<RecordFormPage key="new" />} />}
      <Route path="records/:id" element={<RecordDetailPage />} />
      {canEdit && <Route path="records/:id/edit" element={<RecordFormPage key="edit" />} />}
      <Route path="parties" element={<PartiesPage />} />
      <Route path="parties/:id" element={<PartyDetailPage />} />
    </>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/forgot-password" element={<AccountAccessPage key="forgot" mode="forgot" />} />
      <Route path="/reset-password" element={<AccountAccessPage key="reset" mode="reset" />} />
      <Route path="/settings" element={<ProtectedRoute roles={['super_admin', 'admin', 'user']} />}>
        <Route index element={<AccountSettingsPage />} />
      </Route>
      <Route path="/profile" element={<ProtectedRoute roles={['super_admin', 'admin', 'user']} />}>
        <Route index element={<ProfilePage />} />
      </Route>
      <Route path="/account-recovery" element={<ProtectedRoute roles={['super_admin', 'admin', 'user']} />}>
        <Route index element={<AccountAccessPage key="self-forgot" mode="self-forgot" />} />
      </Route>
      <Route path="/reports" element={<ProtectedRoute roles={['super_admin', 'admin', 'user']} />}>
        <Route index element={<ReportsPage />} />
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      <Route path="/super-admin" element={<ProtectedRoute roles={['super_admin']} />}>
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        {recordRoutes(false)}
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="property-types" element={<PropertyTypesPage />} />
        <Route path="admins" element={<AccountsPage key="admins" role="admin" title="Admins" description="Create and manage Admin accounts." />} />
        <Route path="users" element={<AccountsPage key="users" role="user" title="Users" description="All User accounts across every Admin." />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        {recordRoutes(true)}
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="users" element={<AccountsPage role="user" title="Users" description="Create and manage the users on your team." />} />
        <Route path="activity" element={<ActivityPage />} />
      </Route>

      <Route path="/user" element={<ProtectedRoute roles={['user']} />}>
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<UserDashboard />} />
        {recordRoutes(true)}
        <Route path="activity" element={<ActivityPage title="My Activity" />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
