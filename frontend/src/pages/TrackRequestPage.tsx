import { SignaturePad } from '@/components/request/SignaturePad'
import { PageHeader } from '@/components/shared/PageHeader'
import { Seo } from '@/components/shared/Seo'
import { Button } from '@/components/ui/Button'
import { api, type TrackRequestResult } from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, Download, FileText, Loader2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const STATUS_STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'quotation_prepared', label: 'Quotation Prepared' },
  { key: 'approved', label: 'Confirmed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
]

const STATUS_INDEX: Record<string, number> = Object.fromEntries(STATUS_STEPS.map((s, i) => [s.key, i]))

function StatusTimeline({ status }: { status: string }) {
  const currentIndex = STATUS_INDEX[status] ?? (status === 'awaiting_payment' ? 3 : 0)
  const isRejected = status === 'rejected'

  if (isRejected) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600">
        <XCircle size={20} />
        <span className="font-medium">Request Rejected</span>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIndex
        const active = i === currentIndex
        return (
          <div key={step.key} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                done ? 'bg-ips-blue border-ips-blue text-white' : 'border-slate-200 dark:border-slate-700 text-slate-400',
                active && 'ring-4 ring-ips-blue/20'
              )}>
                {done ? <CheckCircle size={16} /> : <Clock size={14} />}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={cn('w-0.5 h-8', done && i < currentIndex ? 'bg-ips-blue' : 'bg-slate-200 dark:bg-slate-700')} />
              )}
            </div>
            <div className="pt-1 pb-6">
              <p className={cn('text-sm font-medium', active ? 'text-ips-blue dark:text-ips-gold' : done ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400')}>
                {step.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function TrackRequestPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<TrackRequestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [signature, setSignature] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState('')

  const reload = () => {
    if (!token) return
    api.trackRequest(token).then((result) => {
      if (result) setData(result)
      else setNotFound(true)
      setLoading(false)
    })
  }

  useEffect(reload, [token])

  const acceptQuotation = async () => {
    if (!token || !signature) {
      setAcceptError('Please sign to accept the quotation')
      return
    }
    setAccepting(true)
    setAcceptError('')
    const result = await api.acceptQuotation(token, signature)
    setAccepting(false)
    if (result?.success) reload()
    else setAcceptError(result?.message || 'Could not accept quotation')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-28">
        <Loader2 className="w-8 h-8 animate-spin text-ips-blue" />
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center pt-28 px-4">
        <h1 className="text-2xl font-bold text-ips-blue mb-4">Request Not Found</h1>
        <p className="text-slate-500 mb-6">Invalid or expired tracking link.</p>
        <Link to="/request"><Button>Submit New Request</Button></Link>
      </div>
    )
  }

  const pdfUrl = data.pdf_url || (token ? api.getPdfDownloadUrl(token) : null)

  return (
    <>
      <Seo title={`Track ${data.reference_number}`} path={`/track/${token}`} />
      <PageHeader
        label="Request Tracking"
        title={data.reference_number}
        description={`${data.event_title} — ${new Date(data.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="font-semibold text-lg text-ips-blue dark:text-white mb-6">Status Timeline</h2>
              <StatusTimeline status={data.status} />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-ips-blue dark:text-white mb-4">Request Details</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Client</dt><dd className="font-medium">{data.client_name}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Event</dt><dd className="font-medium">{data.event_title}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd>{data.event_type}</dd></div>
                  {data.venue && <div className="flex justify-between"><dt className="text-slate-500">Venue</dt><dd>{data.venue}</dd></div>}
                  <div className="flex justify-between"><dt className="text-slate-500">Submitted</dt><dd>{new Date(data.submitted_at).toLocaleDateString()}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Documents</dt><dd>{data.documents_count} uploaded</dd></div>
                </dl>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-ips-blue dark:text-white mb-4">Requested Services</h3>
                <ul className="space-y-2">
                  {data.services.map((s, i) => (
                    <li key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="flex items-center gap-2"><FileText size={14} className="text-ips-blue" />{s.name}</span>
                      <div className="flex items-center gap-2">
                        {s.quoted_price != null && (
                          <span className="text-xs text-slate-500">{Number(s.quoted_price).toLocaleString()} RWF</span>
                        )}
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          s.status === 'approved' ? 'bg-green-100 text-green-700' :
                          s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        )}>
                          {s.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                {data.quoted_amount != null && (
                  <p className="mt-4 text-right font-bold text-ips-blue">
                    Total: {Number(data.quoted_amount).toLocaleString()} RWF
                  </p>
                )}
                {data.quotation_notes && (
                  <p className="mt-2 text-xs text-slate-500">{data.quotation_notes}</p>
                )}
              </div>

              {data.can_accept_quotation && (
                <div className="glass rounded-2xl p-6 border-2 border-ips-gold/40">
                  <h3 className="font-semibold text-ips-blue dark:text-white mb-2">Accept Quotation</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Review the quotation above and sign below to confirm your booking.
                  </p>
                  <SignaturePad value={signature} onChange={setSignature} error={acceptError} />
                  <Button className="w-full mt-4" onClick={acceptQuotation} disabled={accepting}>
                    {accepting ? 'Confirming...' : 'Sign & Confirm Quotation'}
                  </Button>
                </div>
              )}

              {data.client_signed_at && (
                <div className="glass rounded-2xl p-4 flex items-center gap-3 text-green-700 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle size={20} />
                  <div>
                    <p className="font-medium text-sm">Quotation confirmed</p>
                    <p className="text-xs">{new Date(data.client_signed_at).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2">
                    <Download size={16} /> Download Request PDF
                  </Button>
                </a>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
