import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { api, type AdminRequestDetail, type StaffMember } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowLeft, CheckCircle, Download, Loader2, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const STATUSES = [
  'submitted', 'under_review', 'quotation_prepared',
  'awaiting_payment', 'approved', 'in_progress', 'completed', 'rejected',
]

const adminSelectClass = 'px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm flex-1 min-w-[160px] outline-none focus:ring-2 focus:ring-ips-blue/20'
const adminInputClass = 'px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm flex-1 min-w-[160px] outline-none focus:ring-2 focus:ring-ips-blue/20'

export function AdminRequestDetail() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const [data, setData] = useState<AdminRequestDetail | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [notes, setNotes] = useState('')
  const [assignId, setAssignId] = useState<string>('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [quotationNotes, setQuotationNotes] = useState('')
  const [itemPrices, setItemPrices] = useState<Record<number, string>>({})
  const [scheduleUserIds, setScheduleUserIds] = useState<number[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [scheduleNotes, setScheduleNotes] = useState('')

  const load = () => {
    if (!token || !id) return
    Promise.all([
      api.getAdminRequest(token, Number(id)),
      api.getAdminStaff(token),
    ]).then(([req, st]) => {
      if (req) {
        setData(req)
        setStatus(req.status)
        setNotes(req.admin_notes || '')
        setAssignId(req.assigned_to?.id ? String(req.assigned_to.id) : '')
        setQuotationNotes(req.quotation_notes || '')
        const prices: Record<number, string> = {}
        req.services.forEach((s) => {
          if (s.quoted_price != null) prices[s.id] = String(s.quoted_price)
        })
        setItemPrices(prices)
        if (req.event_start_date) setStartDate(req.event_start_date)
        if (req.event_end_date) setEndDate(req.event_end_date)
      }
      if (st) setStaff(st)
      setLoading(false)
    })
  }

  useEffect(load, [token, id])

  const approvedServices = useMemo(
    () => data?.services.filter((s) => s.status === 'approved') ?? [],
    [data]
  )

  const computedTotal = useMemo(() => {
    return approvedServices.reduce((sum, s) => {
      const price = Number(itemPrices[s.id] || 0)
      return sum + (Number.isFinite(price) ? price : 0)
    }, 0)
  }, [approvedServices, itemPrices])

  const isConfirmed = Boolean(data?.client_signed_at)

  const saveStatus = async () => {
    if (!token || !id) return
    setSaving(true)
    await api.updateAdminRequestStatus(token, Number(id), status, statusNote)
    setStatusNote('')
    setSaving(false)
    load()
  }

  const saveNotes = async () => {
    if (!token || !id) return
    setSaving(true)
    await api.updateAdminNotes(token, Number(id), notes)
    setSaving(false)
  }

  const saveAssign = async () => {
    if (!token || !id) return
    setSaving(true)
    await api.assignAdminRequest(token, Number(id), assignId ? Number(assignId) : null)
    setSaving(false)
    load()
  }

  const reviewItem = async (itemId: number, itemStatus: string) => {
    if (!token || !id) return
    const comment = window.prompt('Comment (optional):') || undefined
    const quoted_price = itemPrices[itemId] ? Number(itemPrices[itemId]) : undefined
    await api.updateAdminRequestItem(token, Number(id), itemId, {
      status: itemStatus,
      admin_comment: comment,
      quoted_price,
    })
    load()
  }

  const acceptAll = async () => {
    if (!token || !id) return
    setSaving(true)
    await api.acceptAllAdminServices(token, Number(id))
    setSaving(false)
    load()
  }

  const sendMessage = async () => {
    if (!token || !id || !message.trim()) return
    await api.addAdminMessage(token, Number(id), message)
    setMessage('')
    load()
  }

  const sendQuotation = async (forSignature: boolean) => {
    if (!token || !id) return
    setSaving(true)
    await api.setAdminQuotation(token, Number(id), {
      quoted_amount: computedTotal,
      quotation_notes: quotationNotes || undefined,
      send_to_client: true,
      send_for_signature: forSignature,
      items: approvedServices.map((s) => ({
        id: s.id,
        quoted_price: Number(itemPrices[s.id] || 0),
      })),
    })
    setSaving(false)
    load()
  }

  const saveSchedule = async () => {
    if (!token || !id || !scheduleUserIds.length || !startDate) return
    setSaving(true)
    await api.assignAdminSchedule(token, Number(id), {
      assigned_user_ids: scheduleUserIds,
      start_date: startDate,
      end_date: endDate || undefined,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      notes: scheduleNotes || undefined,
    })
    setSaving(false)
    load()
  }

  const toggleScheduleUser = (userId: number) => {
    setScheduleUserIds((ids) =>
      ids.includes(userId) ? ids.filter((i) => i !== userId) : [...ids, userId]
    )
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
  }

  if (!data) {
    return <p>Request not found.</p>
  }

  const hasPending = data.services.some((s) => s.status === 'pending')

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/admin/requests" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-ips-blue mb-6">
        <ArrowLeft size={16} /> Back to requests
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
        <div className="flex flex-wrap justify-between gap-4 mb-4">
          <div>
            <p className="font-mono font-bold text-lg text-ips-blue">{data.reference_number}</p>
            <h1 className="font-display text-xl font-bold">{data.event_title}</h1>
            <p className="text-sm text-slate-500">{data.client_name} — {data.client_phone}</p>
            {isConfirmed && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle size={14} /> Client confirmed {new Date(data.client_signed_at!).toLocaleString()}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => token && api.downloadAdminPdf(token, data.id, data.reference_number)}>
            <Download size={14} /> PDF
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
          <div><span className="text-slate-500">Event date:</span> {new Date(data.event_date).toLocaleDateString()}</div>
          <div><span className="text-slate-500">Type:</span> {data.event_type}</div>
          {data.venue && <div><span className="text-slate-500">Venue:</span> {data.venue}</div>}
          {data.client_email && <div><span className="text-slate-500">Email:</span> {data.client_email}</div>}
          {data.event_description && <div className="sm:col-span-2"><span className="text-slate-500">Description:</span> {data.event_description}</div>}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <select className={adminSelectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <input
            className={adminInputClass}
            placeholder="Status note (optional)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />
          <Button size="sm" onClick={saveStatus} disabled={saving}>Update Status</Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <select className={adminSelectClass} value={assignId} onChange={(e) => setAssignId(e.target.value)}>
            <option value="">Unassigned</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={saveAssign} disabled={saving}>Assign</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold">Services</h3>
          {hasPending && (
            <Button size="sm" variant="outline" onClick={acceptAll} disabled={saving}>
              Accept All Pending
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {data.services.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
              <div className="flex-1 min-w-[140px]">
                <p className="font-medium">{s.name}</p>
                {s.admin_comment && <p className="text-xs text-slate-500">{s.admin_comment}</p>}
              </div>
              {s.status === 'approved' && (
                <input
                  className="w-28 px-2 py-1.5 rounded border text-sm"
                  type="number"
                  min={0}
                  placeholder="Price RWF"
                  value={itemPrices[s.id] ?? ''}
                  onChange={(e) => setItemPrices({ ...itemPrices, [s.id]: e.target.value })}
                />
              )}
              <div className="flex gap-2 items-center">
                <span className={cn('text-xs px-2 py-1 rounded capitalize', s.status === 'approved' ? 'bg-green-100 text-green-700' : s.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>{s.status}</span>
                {s.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => reviewItem(s.id, 'approved')}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => reviewItem(s.id, 'rejected')}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {approvedServices.length > 0 && !isConfirmed && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-3">Quotation & Invoice</h3>
          <p className="text-xs text-slate-500 mb-3">Set a price per approved service, then send the quotation to the client for signature.</p>
          <div className="flex items-center justify-between text-sm mb-3 p-3 rounded-lg bg-ips-blue/5">
            <span className="font-medium">Total</span>
            <span className="font-bold text-ips-blue">{computedTotal.toLocaleString()} RWF</span>
          </div>
          <textarea
            className="w-full px-3 py-2 rounded-lg border text-sm min-h-[80px] mb-3"
            placeholder="Quotation notes"
            value={quotationNotes}
            onChange={(e) => setQuotationNotes(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => sendQuotation(true)} disabled={saving || computedTotal <= 0}>
              Send to Client for Signature
            </Button>
            {data.sent_for_signature_at && (
              <span className="text-xs text-slate-500 self-center">
                Sent {new Date(data.sent_for_signature_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}

      {isConfirmed && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-3">Schedule Assignment</h3>
          <p className="text-xs text-slate-500 mb-3">Assign staff and date/time range. Booked dates appear on the Booking Calendar.</p>
          <div className="space-y-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {staff.map((s) => (
                <label key={s.id} className={cn(
                  'text-xs px-3 py-1.5 rounded-full border cursor-pointer',
                  scheduleUserIds.includes(s.id) ? 'bg-ips-gold text-ips-blue border-ips-gold' : 'border-slate-200'
                )}>
                  <input type="checkbox" className="sr-only" checked={scheduleUserIds.includes(s.id)} onChange={() => toggleScheduleUser(s.id)} />
                  {s.name}
                </label>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input className="px-3 py-2 rounded-lg border text-sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <input className="px-3 py-2 rounded-lg border text-sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="End date" />
              <input className="px-3 py-2 rounded-lg border text-sm" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <input className="px-3 py-2 rounded-lg border text-sm" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <textarea className="w-full px-3 py-2 rounded-lg border text-sm min-h-[60px]" placeholder="Assignment notes" value={scheduleNotes} onChange={(e) => setScheduleNotes(e.target.value)} />
          </div>
          <Button size="sm" onClick={saveSchedule} disabled={saving || !scheduleUserIds.length || !startDate}>
            Assign Schedule
          </Button>

          {data.assignments && data.assignments.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase">Previous assignments</p>
              {data.assignments.map((a) => (
                <div key={a.id} className="text-sm p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                  {a.start_date}{a.end_date && a.end_date !== a.start_date ? ` — ${a.end_date}` : ''}
                  {a.start_time && ` · ${a.start_time}`}{a.end_time && `–${a.end_time}`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border mb-6">
        <h3 className="font-semibold mb-3">Internal Notes</h3>
        <textarea
          className="w-full px-3 py-2 rounded-lg border text-sm min-h-[100px] mb-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button size="sm" className="gap-1" onClick={saveNotes} disabled={saving}><Save size={14} /> Save Notes</Button>
      </div>

      {data.status_history?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-3">Status Timeline</h3>
          <div className="space-y-2">
            {data.status_history.map((h, i) => (
              <div key={i} className="text-sm p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                <span className="font-medium capitalize">{h.to_status.replace(/_/g, ' ')}</span>
                <span className="text-xs text-slate-400 ml-2">{new Date(h.created_at).toLocaleString()}</span>
                {h.note && <p className="text-xs text-slate-500 mt-1">{h.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border">
        <h3 className="font-semibold mb-3">Messages</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
          {data.messages?.map((m) => (
            <div key={m.id} className={cn('p-2 rounded text-sm', m.is_internal ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-800/50')}>
              <p className="text-xs text-slate-500">{m.sender.name} {m.is_internal && '(internal)'}</p>
              <p>{m.message}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="flex-1 px-3 py-2 rounded-lg border text-sm" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Internal note to team..." />
          <Button size="sm" onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  )
}
