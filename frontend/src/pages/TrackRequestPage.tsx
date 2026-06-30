import { IdDocumentCapture } from '@/components/request/IdDocumentCapture'
import { SignaturePad } from '@/components/request/SignaturePad'
import { PageHeader } from '@/components/shared/PageHeader'
import { Seo } from '@/components/shared/Seo'
import { Button } from '@/components/ui/Button'
import { api, type TrackRequestResult } from '@/lib/api'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, Download, FileText, Loader2, X, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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

function AgreementModal({ html, onClose }: { html: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-[#0a2560] text-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <div className="w-1 h-10 bg-ips-gold rounded-full inline-block mr-3 align-middle" />
            <h2 className="text-xl font-bold inline align-middle">Rental & Service Agreement</h2>
            <p className="text-sm text-white/70 mt-2">Please read these terms carefully before accepting.</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 agreement-content text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="p-4 border-t border-white/10">
          <Button className="w-full" onClick={onClose}>Close</Button>
        </div>
      </div>
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
  const [itemResponses, setItemResponses] = useState<Record<number, 'accepted' | 'rejected'>>({})
  const [agreementViewed, setAgreementViewed] = useState(false)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idType, setIdType] = useState<'passport' | 'national_id'>('national_id')
  const [agreementHtml, setAgreementHtml] = useState('')

  const reload = () => {
    if (!token) return
    api.trackRequest(token).then(async (result) => {
      if (result) {
        setData(result)
        if (result.rental_agreement_html) {
          setAgreementHtml(result.rental_agreement_html)
        } else {
          const branding = await api.getBranding()
          if (branding?.rental_agreement_html) setAgreementHtml(branding.rental_agreement_html)
        }
        const quoted = result.services.filter((s) => s.status === 'approved')
        const initial: Record<number, 'accepted' | 'rejected'> = {}
        quoted.forEach((s) => { initial[s.id] = (s.client_status as 'accepted' | 'rejected') || 'accepted' })
        setItemResponses(initial)
      } else setNotFound(true)
      setLoading(false)
    })
  }

  useEffect(reload, [token])

  const quotedServices = useMemo(
    () => data?.services.filter((s) => s.status === 'approved') ?? [],
    [data]
  )

  const clientTotal = useMemo(() => {
    const itemsSum = quotedServices.reduce((sum, s) => {
      if (itemResponses[s.id] !== 'accepted') return sum
      return sum + Number(s.quoted_price || 0)
    }, 0)
    const misc = Number(data?.miscellaneous_amount || 0)
    const hasAccepted = quotedServices.some((s) => itemResponses[s.id] === 'accepted')
    return itemsSum + (hasAccepted ? misc : 0)
  }, [quotedServices, itemResponses, data?.miscellaneous_amount])

  const acceptQuotation = async () => {
    if (!token || !signature) {
      setAcceptError('Please sign to accept the quotation')
      return
    }
    if (!agreementViewed) {
      setAcceptError('Please view the rental agreement first')
      return
    }
    if (!agreementAccepted) {
      setAcceptError('Please agree to the terms')
      return
    }
    if (!idFile && !data?.has_id_document) {
      setAcceptError('Please upload your ID or passport')
      return
    }
    const items = quotedServices.map((s) => ({
      id: s.id,
      client_status: itemResponses[s.id] || 'rejected',
    }))
    if (!items.some((i) => i.client_status === 'accepted')) {
      setAcceptError('Accept at least one service')
      return
    }

    setAccepting(true)
    setAcceptError('')
    const result = await api.acceptQuotation(token, {
      signature,
      agreement_accepted: true,
      items,
      id_document: idFile,
      id_document_type: idType,
    })
    setAccepting(false)
    if (result?.success) reload()
    else setAcceptError(result?.message || 'Could not accept quotation')
  }

  const openAgreement = () => {
    if (!agreementHtml?.trim()) {
      setAcceptError('Agreement text is loading. Please try again in a moment.')
      api.getBranding().then((b) => {
        if (b?.rental_agreement_html) {
          setAgreementHtml(b.rental_agreement_html)
          setShowAgreement(true)
          setAcceptError('')
        }
      })
      return
    }
    setShowAgreement(true)
    setAcceptError('')
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
  const companyName = data.branding?.company_name || 'Indatwa Protocol & Services Agency'

  return (
    <>
      <Seo title={`Track ${data.reference_number}`} path={`/track/${token}`} />
      {showAgreement && agreementHtml && (
        <AgreementModal
          html={agreementHtml}
          onClose={() => { setShowAgreement(false); setAgreementViewed(true) }}
        />
      )}
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
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="bg-[#0B3D91] text-white p-4">
                  {data.branding?.logo_url && <img src={data.branding.logo_url} alt="" className="h-8 mb-2" />}
                  <p className="font-bold">{companyName}</p>
                  <span className="inline-block mt-2 bg-[#FACC15] text-[#0B3D91] text-xs font-bold px-2 py-1">{data.reference_number}</span>
                </div>
                <dl className="p-4 space-y-3 text-sm bg-white">
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-ips-blue shrink-0">Client</dt>
                    <dd className="font-semibold text-ips-blue text-right">{data.client_name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-ips-blue shrink-0">Event</dt>
                    <dd className="font-semibold text-ips-blue text-right">{data.event_title}</dd>
                  </div>
                  {data.venue && (
                    <div className="flex justify-between gap-4">
                      <dt className="font-semibold text-ips-blue shrink-0">Venue</dt>
                      <dd className="font-semibold text-ips-blue text-right">{data.venue}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-ips-blue dark:text-white mb-4">Quoted Services</h3>
                <ul className="space-y-3">
                  {data.services.map((s) => (
                    <li key={s.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="flex items-center gap-2 font-medium"><FileText size={14} className="text-ips-blue" />{s.name}</span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full capitalize',
                          s.status === 'approved' ? 'bg-green-100 text-green-700' :
                          s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        )}>{s.status}</span>
                      </div>
                      {s.status === 'approved' && s.quoted_price != null && (
                        <p className="text-xs text-slate-500 mb-2">{Number(s.quoted_price).toLocaleString()} RWF</p>
                      )}
                      {data.can_accept_quotation && s.status === 'approved' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant={itemResponses[s.id] === 'accepted' ? 'primary' : 'outline'} onClick={() => setItemResponses({ ...itemResponses, [s.id]: 'accepted' })}>Accept</Button>
                          <Button size="sm" variant={itemResponses[s.id] === 'rejected' ? 'secondary' : 'outline'} onClick={() => setItemResponses({ ...itemResponses, [s.id]: 'rejected' })}>Reject</Button>
                        </div>
                      )}
                      {!data.can_accept_quotation && s.client_status && s.client_status !== 'pending' && (
                        <p className="text-xs capitalize text-purple-700">Your response: {s.client_status}</p>
                      )}
                    </li>
                  ))}
                </ul>
                {(data.quoted_amount != null || quotedServices.length > 0) && (
                  <div className="mt-4 text-right space-y-1">
                    {data.miscellaneous_amount ? (
                      <p className="text-xs text-slate-500">Miscellaneous: {Number(data.miscellaneous_amount).toLocaleString()} RWF</p>
                    ) : null}
                    <p className="font-bold text-ips-blue">
                      Total: {(data.can_accept_quotation ? clientTotal : Number(data.quoted_amount || 0)).toLocaleString()} RWF
                    </p>
                  </div>
                )}
                {data.quotation_notes && <p className="mt-2 text-xs text-slate-500">{data.quotation_notes}</p>}
              </div>

              {data.can_accept_quotation && (
                <div className="glass rounded-2xl p-6 border-2 border-ips-blue/20">
                  <h3 className="font-semibold text-ips-blue dark:text-white mb-4">Confirm Quotation</h3>

                  <div className="mb-4">
                    <Button type="button" variant="outline" size="sm" className="border-ips-blue text-ips-blue" onClick={openAgreement}>View Rental Agreement</Button>
                    {agreementViewed && (
                      <label className="flex items-start gap-2 mt-3 text-sm cursor-pointer text-ips-blue">
                        <input type="checkbox" checked={agreementAccepted} onChange={(e) => setAgreementAccepted(e.target.checked)} className="mt-1 accent-ips-blue" />
                        <span>I have read and agree to the rental & service agreement terms.</span>
                      </label>
                    )}
                  </div>

                  <IdDocumentCapture
                    file={idFile}
                    onChange={setIdFile}
                    idType={idType}
                    onTypeChange={setIdType}
                    hasExisting={data.has_id_document}
                  />

                  <SignaturePad value={signature} onChange={setSignature} error={acceptError} />
                  <Button className="w-full mt-4" onClick={acceptQuotation} disabled={accepting}>
                    {accepting ? 'Confirming...' : 'Sign & Submit'}
                  </Button>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Already have an account? <Link to="/login" className="text-ips-blue underline">Login to portal</Link>
                  </p>
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
