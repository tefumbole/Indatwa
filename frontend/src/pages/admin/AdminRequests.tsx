import { AdminTabBar } from '@/components/admin/AdminTabBar'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type AdminRequestSummary, type Service } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Loader2, Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type WorkflowTab = 'all' | 'awaiting_confirmation' | 'awaiting_client' | 'confirmed'

const WORKFLOW_TABS: { key: WorkflowTab; label: string; color: 'blue' | 'gold' | 'purple' | 'green' }[] = [
  { key: 'all', label: 'All Services', color: 'blue' },
  { key: 'awaiting_confirmation', label: 'Awaiting Confirmation', color: 'gold' },
  { key: 'awaiting_client', label: 'Awaiting Client Confirmation', color: 'purple' },
  { key: 'confirmed', label: 'Confirmed', color: 'green' },
]

const EVENT_TYPES = ['Government / Diplomatic', 'Corporate', 'Wedding', 'Private', 'Other']

export function AdminRequests() {
  const { token } = useAuth()
  const [requests, setRequests] = useState<AdminRequestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<WorkflowTab>('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    services: [] as number[],
    client_name: '',
    client_phone: '',
    client_email: '',
    event_title: '',
    event_type: EVENT_TYPES[0],
    event_date: '',
    venue: '',
    event_description: '',
  })

  const load = () => {
    if (!token) return
    setLoading(true)
    api.getAdminRequests(token, { tab: tab === 'all' ? undefined : tab, search: search || undefined }).then((d) => {
      if (d) setRequests(d)
      setLoading(false)
    })
  }

  useEffect(load, [token, tab])

  useEffect(() => {
    if (showCreate && token) {
      api.getServices().then((d) => { if (d) setServices(d) })
    }
  }, [showCreate, token])

  const toggleService = (id: number) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(id) ? f.services.filter((s) => s !== id) : [...f.services, id],
    }))
  }

  const createRequest = async () => {
    if (!token || !form.services.length) return
    setCreating(true)
    const result = await api.createAdminRequest(token, {
      services: form.services,
      client_name: form.client_name,
      client_phone: form.client_phone,
      client_email: form.client_email || undefined,
      event_title: form.event_title,
      event_type: form.event_type,
      event_date: form.event_date,
      venue: form.venue || undefined,
      event_description: form.event_description || undefined,
    })
    setCreating(false)
    if (result?.success) {
      setShowCreate(false)
      setForm({
        services: [],
        client_name: '',
        client_phone: '',
        client_email: '',
        event_title: '',
        event_type: EVENT_TYPES[0],
        event_date: '',
        venue: '',
        event_description: '',
      })
      load()
    }
  }

  return (
    <>
      <Seo title="Manage Requests" path="/admin/requests" />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-ips-blue mb-2">Service Requests</h1>
            <p className="text-slate-600 text-sm">Review client requests, prepare quotations, and confirm bookings</p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Request
          </Button>
        </div>

        <AdminTabBar
          section="Operations"
          tabs={WORKFLOW_TABS.map((t) => ({
            label: t.label,
            active: tab === t.key,
            onClick: () => setTab(t.key),
            color: t.color,
          }))}
        />

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="form-input pl-10"
              placeholder="Search reference, client, event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
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
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Amount</th>
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
                        {req.client_signed_at ? 'confirmed' : req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-600">
                      {req.quoted_amount ? `${Number(req.quoted_amount).toLocaleString()} RWF` : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-500">
                      {new Date(req.submitted_at).toLocaleDateString()}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No requests in this tab.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg text-ips-blue">Create Service Request</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">Services *</label>
                <div className="space-y-1 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {services.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm text-slate-800 p-1.5 rounded hover:bg-white cursor-pointer">
                      <input type="checkbox" checked={form.services.includes(s.id)} onChange={() => toggleService(s.id)} />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className="form-input" placeholder="Client name *" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
                <input className="form-input" placeholder="Phone *" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
                <input className="form-input sm:col-span-2" placeholder="Email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
                <input className="form-input sm:col-span-2" placeholder="Event title *" value={form.event_title} onChange={(e) => setForm({ ...form, event_title: e.target.value })} />
                <select className="form-select" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input className="form-input" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                <input className="form-input sm:col-span-2" placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                <textarea className="form-input sm:col-span-2 min-h-[80px] resize-y" placeholder="Event description" value={form.event_description} onChange={(e) => setForm({ ...form, event_description: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" onClick={createRequest} disabled={creating || !form.client_name || !form.client_phone || !form.event_title || !form.event_date || !form.services.length}>
                {creating ? 'Creating...' : 'Create Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
