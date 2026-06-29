import { AdminTabBar } from '@/components/admin/AdminTabBar'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type AdminDashboardData, type WhatsAppLogData } from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Activity, CheckCircle, ClipboardList, Loader2, MessageCircle, Settings, Users, Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STAT_CARDS = [
  { key: 'total_requests', label: 'Total Requests', icon: ClipboardList, iconBg: 'bg-blue-100 text-ips-blue' },
  { key: 'pending_review', label: 'Pending Review', icon: Wrench, iconBg: 'bg-yellow-100 text-yellow-700' },
  { key: 'in_progress', label: 'In Progress', icon: Users, iconBg: 'bg-indigo-100 text-indigo-600' },
  { key: 'completed', label: 'Completed', icon: CheckCircle, iconBg: 'bg-green-100 text-green-600' },
] as const

export function AdminDashboard() {
  const { user, token } = useAuth()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewsEnabled, setReviewsEnabled] = useState(true)
  const [savingReviews, setSavingReviews] = useState(false)
  const [whatsapp, setWhatsapp] = useState<WhatsAppLogData | null>(null)
  const [testingWa, setTestingWa] = useState(false)
  const [waMessage, setWaMessage] = useState('')

  useEffect(() => {
    if (!token) return
    api.getAdminDashboard(token).then((d) => {
      if (d) setData(d)
      setLoading(false)
    })
    api.getWhatsAppLogs(token).then((w) => {
      if (w) setWhatsapp(w)
    })
  }, [token])

  const toggleReviews = async () => {
    if (!token) return
    setSavingReviews(true)
    const next = !reviewsEnabled
    const res = await api.updateReviewsEnabled(token, next)
    if (res.success) setReviewsEnabled(next)
    setSavingReviews(false)
  }

  const testWhatsApp = async () => {
    if (!token) return
    setTestingWa(true)
    setWaMessage('')
    const res = await api.testWhatsApp(token)
    setWaMessage(res.message || (res.success ? 'Test message sent!' : 'Send failed'))
    setTestingWa(false)
    api.getWhatsAppLogs(token).then((w) => { if (w) setWhatsapp(w) })
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
  }

  if (!data) {
    return <p className="text-center text-slate-500">Failed to load dashboard.</p>
  }

  return (
    <>
      <Seo title="Admin Dashboard" path="/admin" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ips-blue">Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Welcome back, <span className="font-medium">{user?.email || user?.name}</span>
            </p>
            <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-ips-gold/20 text-ips-blue capitalize">
              {user?.roles?.[0]?.replace(/_/g, ' ') || 'admin'}
            </span>
          </div>
          <Button variant="outline" size="sm" className="gap-2 border-slate-200">
            <Settings size={16} /> Settings
          </Button>
        </div>

        <AdminTabBar
          section="Quick Access"
          tabs={[
            { label: 'Dashboard', href: '/admin', active: true, color: 'blue' },
            { label: 'Requests', href: '/admin/requests', color: 'gold' },
            { label: 'Tasks', href: '/admin/tasks', color: 'purple' },
            { label: 'Manage Users', href: '/admin/users', color: 'green' },
          ]}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="admin-card p-5"
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.iconBg)}>
                <card.icon size={20} />
              </div>
              <p className="text-3xl font-bold text-slate-900">{data.stats[card.key]}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 admin-card p-6">
            <h2 className="font-bold text-ips-blue mb-4">Recent Requests</h2>
            <div className="space-y-2">
              {data.recent_requests.map((req) => (
                <Link
                  key={req.id}
                  to={`/admin/requests/${req.id}`}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-ips-blue">{req.reference_number}</p>
                    <p className="text-sm text-slate-600">{req.client_name} — {req.event_title}</p>
                  </div>
                  <span className="text-xs capitalize px-3 py-1 rounded-full bg-slate-100 font-medium">
                    {req.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
            <Link to="/admin/requests" className="inline-block text-sm font-semibold text-ips-blue mt-4 hover:underline">
              View all requests →
            </Link>
          </div>

          <div className="space-y-6">
            <div className="admin-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-green-600" />
                <h2 className="font-bold text-ips-blue">System Status</h2>
              </div>
              <div className="space-y-3 text-sm">
                <StatusRow label="Database Connection" status="Active" variant="green" />
                <StatusRow
                  label="WhatsApp (WasenderAPI)"
                  status={whatsapp?.stats.configured ? 'Configured' : 'Not configured'}
                  variant={whatsapp?.stats.configured ? 'green' : 'blue'}
                />
                {whatsapp && (
                  <StatusRow
                    label="Messages sent"
                    status={`${whatsapp.stats.sent} sent / ${whatsapp.stats.failed} failed`}
                    variant="blue"
                  />
                )}
                <StatusRow label="Security" status="Enabled" variant="blue" />
              </div>
              <Button className="w-full mt-5 gap-2" size="sm" onClick={testWhatsApp} disabled={testingWa}>
                {testingWa ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                Test WhatsApp
              </Button>
              {waMessage && <p className="text-xs text-slate-500 mt-2 text-center">{waMessage}</p>}
            </div>

            {whatsapp && whatsapp.logs.length > 0 && (
              <div className="admin-card p-6">
                <h2 className="font-bold text-ips-blue mb-3">Recent WhatsApp</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {whatsapp.logs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate max-w-[140px]">{log.message_type}</span>
                      <span className={cn(
                        'font-bold px-2 py-0.5 rounded-full',
                        log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      )}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-card p-6">
              <h2 className="font-bold text-ips-blue mb-3">Public Reviews</h2>
              <p className="text-xs text-slate-500 mb-4">Show or hide client reviews on the website</p>
              <Button size="sm" variant={reviewsEnabled ? 'secondary' : 'outline'} onClick={toggleReviews} disabled={savingReviews} className="w-full">
                {reviewsEnabled ? 'Reviews Enabled' : 'Reviews Disabled'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function StatusRow({ label, status, variant }: { label: string; status: string; variant: 'green' | 'blue' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={cn(
        'text-xs font-bold px-2.5 py-1 rounded-full',
        variant === 'green' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-ips-blue'
      )}>
        {status}
      </span>
    </div>
  )
}
