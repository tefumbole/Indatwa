import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { api, type PortalRequestDetail } from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Loader2, Send, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function DetailContent() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const [data, setData] = useState<PortalRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    if (!token || !id) return
    api.getPortalRequest(token, Number(id)).then((d) => {
      if (d) setData(d)
      setLoading(false)
    })
  }

  useEffect(load, [token, id])

  const sendMessage = async () => {
    if (!token || !id || !message.trim()) return
    setSending(true)
    await api.sendPortalMessage(token, Number(id), message)
    setMessage('')
    setSending(false)
    load()
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token || !id) return
    await api.uploadPortalDocument(token, Number(id), file, 'additional')
    load()
    e.target.value = ''
  }

  const submitReview = async () => {
    if (!token || !data) return
    setSending(true)
    const res = await api.submitReview(token, {
      service_request_id: data.id,
      rating: reviewRating,
      comment: reviewComment || undefined,
    })
    setSending(false)
    if (res.success) setReviewSubmitted(true)
  }

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
  }

  if (!data) {
    return <div className="text-center py-32"><p>Request not found</p><Link to="/portal"><Button className="mt-4">Back</Button></Link></div>
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/portal" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-ips-blue mb-6">
          <ArrowLeft size={16} /> Back to Portal
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="font-mono font-bold text-ips-blue dark:text-ips-gold text-lg">{data.reference_number}</p>
              <h1 className="font-display text-xl font-bold mt-1">{data.event_title}</h1>
              <p className="text-sm text-slate-500">{data.event_type} — {new Date(data.event_date).toLocaleDateString()}</p>
            </div>
            <span className="text-sm px-3 py-1 rounded-full bg-ips-blue/10 text-ips-blue font-medium capitalize">
              {data.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {token && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => api.downloadPortalPdf(token, data.id, data.reference_number)}
              >
                <Download size={14} /> PDF
              </Button>
            )}
            {['quotation_prepared', 'awaiting_payment'].includes(data.status) && token && (
              <Button size="sm" variant="secondary" onClick={() => api.initiatePayment(token, data.id)}>
                Pay Now (Coming Soon)
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Upload Document
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={uploadFile} />
          </div>

          {data.status_history?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ips-blue mb-3">Status Timeline</h3>
              <div className="space-y-2">
                {data.status_history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="w-2 h-2 rounded-full bg-ips-blue shrink-0" />
                    <span className="capitalize font-medium">{h.to_status.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-slate-400 ml-auto">{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.services.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ips-blue mb-3">Services</h3>
              <div className="space-y-2">
                {data.services.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span>{s.name}</span>
                    <span className={cn('text-xs capitalize', s.status === 'approved' ? 'text-green-600' : s.status === 'rejected' ? 'text-red-600' : 'text-yellow-600')}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ips-blue mb-3">Messages</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {data.messages?.length ? data.messages.map((m) => (
                <div key={m.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
                  <p className="font-medium text-xs text-slate-500 mb-1">{m.sender?.name}</p>
                  <p>{m.message}</p>
                </div>
              )) : <p className="text-sm text-slate-400">No messages yet.</p>}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message admin..."
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button size="sm" onClick={sendMessage} disabled={sending} className="gap-1">
                <Send size={14} />
              </Button>
            </div>
          </div>

          {data.status === 'completed' && token && (
            <div className="mb-6 p-4 rounded-xl bg-ips-blue/5 border border-ips-blue/10">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ips-blue mb-3">Leave a Review</h3>
              {reviewSubmitted ? (
                <p className="text-sm text-green-600">Thank you! Your review has been submitted.</p>
              ) : (
                <div className="space-y-3">
                  <select className="px-3 py-2 rounded-lg border text-sm" value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
                  </select>
                  <textarea className="w-full px-3 py-2 rounded-lg border text-sm" rows={3} placeholder="Share your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                  <Button size="sm" onClick={submitReview} disabled={sending}>Submit Review</Button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export function PortalRequestDetail() {
  return (
    <ProtectedRoute role="client">
      <DetailContent />
    </ProtectedRoute>
  )
}
