import { Link } from 'react-router-dom'
import { ArrowRight, UserRound } from 'lucide-react'
import { ChangePasswordCard } from '../../components/account/ChangePasswordCard'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../hooks/useAuth'

/** Personal account settings. System-wide configuration remains Super Admin only. */
export function AccountSettingsPage() {
  const { user } = useAuth()
  return <>
    <PageHeader title="Settings" description="Manage your own account access and security." />
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Account" subtitle="Your account details are managed by your administrator.">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-500"><UserRound className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">Account information</p>
            <p className="mt-1 truncate text-sm text-muted">{user?.name} · {user?.email}</p>
            <Link to="/profile" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:underline">View My Profile <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </Card>
      <ChangePasswordCard />
    </div>
  </>
}
