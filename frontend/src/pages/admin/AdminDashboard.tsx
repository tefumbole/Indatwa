import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type AdminDashboardData } from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CheckCircle, ClipboardList, Loader2, Users, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STAT_CARDS = [
  { key: 'total_requests', label: 'Total Requests', icon: ClipboardList, color: 'text-ips-blue' },
  { key: 'pending_review', label: 'Pending Review', icon: Wrench, color: 'text-yellow-600' },
  { key: 'in_progress', label: 'In Progress', icon: Users, color: 'text-indigo-600' },
  { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
] as const

export function AdminDashboard() {
  const { token } = useAuth()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewsEnabled, setReviewsEnabled] = useState(true)
  const [savingReviews, setSavingReviews] = useState(false)

  useEffect(() => {
    if (!token) return
    api.getAdminDashboard(token).then((d) => {
      if (d) setData(d)
      setLoading(false)
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

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
  }

  if (!data) {
    return <p className="text-center text-slate-500">Failed to load dashboard.</p>
  }

  return (
    <>
      <Seo title="Admin Dashboard" path="/admin" />
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-ips-blue dark:text-white mb-6">Dashboard</h1>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-sm">Public client reviews</p>
            <p className="text-xs text-slate-500">Show or hide reviews on the /reviews page</p>
          </div>
          <Button size="sm" variant="outline" onClick={toggleReviews} disabled={savingReviews}>
            {reviewsEnabled ? 'Reviews enabled' : 'Reviews disabled'}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800"
            >
              <card.icon className={cn('w-5 h-5 mb-2', card.color)} />
              <p className="text-2xl font-bold">{data.stats[card.key]}</p>
              <p className="text-xs text-slate-500 mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold mb-4">Recent Requests</h2>
            <div className="space-y-3">
              {data.recent_requests.map((req) => (
                <Link
                  key={req.id}
                  to={`/admin/requests/${req.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-ips-blue">{req.reference_number}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{req.client_name} — {req.event_title}</p>
                  </div>
                  <span className="text-xs capitalize px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    {req.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
            <Link to="/admin/requests" className="block text-sm text-ips-blue mt-4 hover:underline">View all requests →</Link>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold mb-4">Popular Services</h2>
            {data.popular_services.length ? (
              <div className="space-y-3">
                {data.popular_services.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{s.service_name}</span>
                    <span className="font-medium text-ips-blue">{s.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No service data yet.</p>
            )}

            <h2 className="font-semibold mt-6 mb-3">Monthly Trend</h2>
            {data.monthly_trend.length ? (
              <div className="space-y-2">
                {data.monthly_trend.map((m) => (
                  <div key={m.month} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-slate-500">{m.month}</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ips-blue rounded-full"
                        style={{ width: `${Math.min(100, (m.count / Math.max(...data.monthly_trend.map((x) => x.count), 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-medium">{m.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No trend data yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
