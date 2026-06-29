import { AdminTabBar } from '@/components/admin/AdminTabBar'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type AdminRequestSummary } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Loader2, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STATUSES = [
  '', 'submitted', 'under_review', 'quotation_prepared',
  'awaiting_payment', 'approved', 'in_progress', 'completed', 'rejected',
]

export function AdminRequests() {
  const { token } = useAuth()
  const [requests, setRequests] = useState<AdminRequestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const load = () => {
    if (!token) return
    setLoading(true)
    api.getAdminRequests(token, { status: status || undefined, search: search || undefined }).then((d) => {
      if (d) setRequests(d)
      setLoading(false)
    })
  }

  useEffect(load, [token, status])

  return (
    <>
      <Seo title="Manage Requests" path="/admin/requests" />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-ips-blue mb-2">Service Requests</h1>
        <p className="text-slate-600 text-sm mb-6">Review, approve, or deny client inquiries</p>

        <AdminTabBar
          section="Operations"
          tabs={[
            { label: 'All Requests', active: !status, onClick: () => setStatus(''), color: 'blue' },
            { label: 'Submitted', active: status === 'submitted', onClick: () => setStatus('submitted'), color: 'gold' },
            { label: 'Under Review', active: status === 'under_review', onClick: () => setStatus('under_review'), color: 'purple' },
            { label: 'In Progress', active: status === 'in_progress', onClick: () => setStatus('in_progress'), color: 'green' },
          ]}
        />

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
              placeholder="Search reference, client, event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
          <select
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <Button size="sm" onClick={load}>Search</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
        ) : (
          <div className="admin-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Client</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Event</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.length ? requests.map((req) => (
                  <tr key={req.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <Link to={`/admin/requests/${req.id}`} className="font-mono font-bold text-ips-blue hover:underline">
                        {req.reference_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{req.client_name}</td>
                    <td className="px-4 py-3 hidden md:table-cell truncate max-w-[200px]">{req.event_title}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full capitalize', 'bg-slate-100 dark:bg-slate-800')}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-500">
                      {new Date(req.submitted_at).toLocaleDateString()}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
