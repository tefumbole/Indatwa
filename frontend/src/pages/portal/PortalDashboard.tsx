import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Seo } from '@/components/shared/Seo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { api, type PortalRequestSummary } from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowRight, FileText, Loader2, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  quotation_prepared: 'bg-purple-100 text-purple-700',
  awaiting_payment: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

function PortalContent() {
  const { user, token, logout } = useAuth()
  const [requests, setRequests] = useState<PortalRequestSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.getPortalRequests(token).then((data) => {
      if (data) setRequests(data)
      setLoading(false)
    })
  }, [token])

  return (
    <>
      <Seo title="My Portal" path="/portal" />
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold text-ips-blue dark:text-white">
                Welcome, {user?.name}
              </h1>
              <p className="text-slate-500 text-sm">Your service requests</p>
            </div>
            <div className="flex gap-2">
              <Link to="/request"><Button size="sm">New Request</Button></Link>
              <Button variant="outline" size="sm" onClick={logout} className="gap-1">
                <LogOut size={14} /> Logout
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
          ) : requests.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No requests yet.</p>
              <Link to="/request"><Button>Request a Service</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/portal/requests/${req.id}`} className="block glass rounded-xl p-5 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-bold text-ips-blue dark:text-ips-gold">{req.reference_number}</p>
                        <p className="font-medium text-slate-800 dark:text-white mt-1">{req.event_title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {req.event_type} — {new Date(req.event_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', STATUS_COLORS[req.status] || 'bg-slate-100')}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                        <ArrowRight size={16} className="text-slate-400 group-hover:text-ips-blue transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export function PortalDashboard() {
  return (
    <ProtectedRoute role="client">
      <PortalContent />
    </ProtectedRoute>
  )
}
