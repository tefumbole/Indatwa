import { DocumentUpload } from '@/components/request/DocumentUpload'
import { SignaturePad } from '@/components/request/SignaturePad'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { FALLBACK_SERVICES } from '@/data/fallbacks'
import { api, type Service } from '@/lib/api'
import {
  clientStepSchema, eventStepSchema, EVENT_TYPES,
  servicesStepSchema, signatureStepSchema, STEP_LABELS,
  type RequestFormData,
} from '@/schemas/requestSchema'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const inputClass = 'w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-ips-blue/30 focus:border-ips-blue outline-none transition text-sm'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5'

const initialForm: RequestFormData = {
  services: [],
  client_name: '',
  client_phone: '',
  client_email: '',
  client_nationality: '',
  client_country: '',
  client_city: '',
  event_title: '',
  event_type: '',
  event_date: '',
  event_start_date: '',
  event_end_date: '',
  number_of_guests: undefined,
  venue: '',
  event_description: '',
  signature: '',
  documents: [],
}

export function RequestServicePage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<RequestFormData>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.getServices().then((data) => {
      setServices(data ?? FALLBACK_SERVICES)
      setLoading(false)
    })
  }, [])

  const update = (fields: Partial<RequestFormData>) => {
    setForm((prev) => ({ ...prev, ...fields }))
    setErrors({})
  }

  const toggleService = (id: number) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id],
    }))
    setErrors({})
  }

  const validateStep = (): boolean => {
    let result
    switch (step) {
      case 1:
        result = servicesStepSchema.safeParse({ services: form.services })
        break
      case 2:
        result = clientStepSchema.safeParse(form)
        break
      case 3:
        result = eventStepSchema.safeParse(form)
        break
      case 4:
        return true
      case 5:
        result = signatureStepSchema.safeParse({ signature: form.signature })
        break
      default:
        return true
    }
    if (result && !result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 6))
  }

  const back = () => setStep((s) => Math.max(s - 1, 1))

  const submit = async () => {
    if (!validateStep()) return
    setSubmitting(true)
    const result = await api.submitRequest(form, token ?? undefined)
    setSubmitting(false)

    if (result.success && result.data) {
      navigate('/request/success', {
        state: {
          reference_number: result.data.reference_number,
          tracking_url: result.data.tracking_url,
          tracking_token: result.data.tracking_token,
          pdf_url: result.data.pdf_url,
        },
      })
    } else {
      setErrors({ submit: result.message || 'Submission failed. Please try again.' })
    }
  }

  const selectedServices = services.filter((s) => form.services.includes(s.id))

  return (
    <>
      <Seo
        title="Request Service"
        description="Submit a service request to Indatwa Protocol & Services Agency. Select services, provide event details, and receive a tracking reference."
        path="/request"
      />
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-ips-blue mb-8">
              <ArrowLeft size={16} /> Back to Home
            </Link>

            <h1 className="font-display text-3xl font-bold text-ips-blue dark:text-white mb-2">
              Request Service
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Step {step} of 6 — {STEP_LABELS[step - 1]}
            </p>

            <div className="flex gap-1.5 mb-10">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex-1">
                  <div className={`h-1.5 rounded-full transition-colors ${i + 1 <= step ? 'bg-ips-blue' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <p className={`text-[10px] mt-1 hidden sm:block ${i + 1 === step ? 'text-ips-blue font-semibold' : 'text-slate-400'}`}>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="glass rounded-2xl p-6 sm:p-8"
              >
                {step === 1 && (
                  <>
                    <h2 className="font-semibold text-lg text-ips-blue dark:text-white mb-6">Select Services</h2>
                    {loading ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-ips-blue" /></div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {services.map((service) => (
                          <label
                            key={service.id}
                            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              form.services.includes(service.id)
                                ? 'border-ips-blue bg-ips-blue/5 dark:border-ips-gold dark:bg-ips-gold/5'
                                : 'border-slate-200 dark:border-slate-700 hover:border-ips-blue/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={form.services.includes(service.id)}
                              onChange={() => toggleService(service.id)}
                              className="w-4 h-4 accent-ips-blue mt-0.5"
                            />
                            <div>
                              <span className="text-sm font-medium block">{service.name}</span>
                              {service.short_description && (
                                <span className="text-xs text-slate-500">{service.short_description}</span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    {errors.services && <p className="text-red-500 text-xs mt-3">{errors.services}</p>}
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="font-semibold text-lg text-ips-blue dark:text-white mb-6">Personal Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Full Name *</label>
                        <input className={inputClass} value={form.client_name} onChange={(e) => update({ client_name: e.target.value })} placeholder="Jean Baptiste N." />
                        {errors.client_name && <p className="text-red-500 text-xs mt-1">{errors.client_name}</p>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Phone Number *</label>
                          <input className={inputClass} value={form.client_phone} onChange={(e) => update({ client_phone: e.target.value })} placeholder="+250 780 000 000" />
                          {errors.client_phone && <p className="text-red-500 text-xs mt-1">{errors.client_phone}</p>}
                        </div>
                        <div>
                          <label className={labelClass}>Email Address</label>
                          <input className={inputClass} type="email" value={form.client_email} onChange={(e) => update({ client_email: e.target.value })} placeholder="you@example.com" />
                          {errors.client_email && <p className="text-red-500 text-xs mt-1">{errors.client_email}</p>}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Nationality</label>
                          <input className={inputClass} value={form.client_nationality} onChange={(e) => update({ client_nationality: e.target.value })} placeholder="Rwandan" />
                        </div>
                        <div>
                          <label className={labelClass}>Country</label>
                          <input className={inputClass} value={form.client_country} onChange={(e) => update({ client_country: e.target.value })} placeholder="Rwanda" />
                        </div>
                        <div>
                          <label className={labelClass}>City</label>
                          <input className={inputClass} value={form.client_city} onChange={(e) => update({ client_city: e.target.value })} placeholder="Kigali" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2 className="font-semibold text-lg text-ips-blue dark:text-white mb-6">Event Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Event Title *</label>
                        <input className={inputClass} value={form.event_title} onChange={(e) => update({ event_title: e.target.value })} placeholder="Embassy Reception 2026" />
                        {errors.event_title && <p className="text-red-500 text-xs mt-1">{errors.event_title}</p>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Event Type *</label>
                          <select className={inputClass} value={form.event_type} onChange={(e) => update({ event_type: e.target.value })}>
                            <option value="">Select type</option>
                            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {errors.event_type && <p className="text-red-500 text-xs mt-1">{errors.event_type}</p>}
                        </div>
                        <div>
                          <label className={labelClass}>Event Date *</label>
                          <input className={inputClass} type="date" value={form.event_date} onChange={(e) => update({ event_date: e.target.value })} />
                          {errors.event_date && <p className="text-red-500 text-xs mt-1">{errors.event_date}</p>}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Start Date</label>
                          <input className={inputClass} type="date" value={form.event_start_date} onChange={(e) => update({ event_start_date: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>End Date</label>
                          <input className={inputClass} type="date" value={form.event_end_date} onChange={(e) => update({ event_end_date: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Number of Guests</label>
                          <input className={inputClass} type="number" min={1} value={form.number_of_guests ?? ''} onChange={(e) => update({ number_of_guests: e.target.value ? Number(e.target.value) : undefined })} placeholder="100" />
                        </div>
                        <div>
                          <label className={labelClass}>Venue</label>
                          <input className={inputClass} value={form.venue} onChange={(e) => update({ venue: e.target.value })} placeholder="Kigali Convention Centre" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Event Description</label>
                        <textarea className={`${inputClass} resize-none`} rows={4} value={form.event_description} onChange={(e) => update({ event_description: e.target.value })} placeholder="Describe your event requirements..." />
                      </div>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <h2 className="font-semibold text-lg text-ips-blue dark:text-white mb-2">Upload Documents</h2>
                    <p className="text-sm text-slate-500 mb-6">Optional — passport, national ID, or other identification</p>
                    <DocumentUpload documents={form.documents} onChange={(documents) => update({ documents })} />
                  </>
                )}

                {step === 5 && (
                  <>
                    <h2 className="font-semibold text-lg text-ips-blue dark:text-white mb-6">Digital Signature</h2>
                    <SignaturePad
                      value={form.signature}
                      onChange={(signature) => update({ signature })}
                      error={errors.signature}
                    />
                  </>
                )}

                {step === 6 && (
                  <>
                    <h2 className="font-semibold text-lg text-ips-blue dark:text-white mb-6">Review & Submit</h2>
                    <div className="space-y-6 text-sm">
                      <ReviewBlock title="Services">
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-400">
                          {selectedServices.map((s) => <li key={s.id}>{s.name}</li>)}
                        </ul>
                      </ReviewBlock>
                      <ReviewBlock title="Client">
                        <p>{form.client_name} — {form.client_phone}</p>
                        {form.client_email && <p>{form.client_email}</p>}
                        {(form.client_nationality || form.client_country) && (
                          <p>{[form.client_nationality, form.client_city, form.client_country].filter(Boolean).join(', ')}</p>
                        )}
                      </ReviewBlock>
                      <ReviewBlock title="Event">
                        <p><strong>{form.event_title}</strong> — {form.event_type}</p>
                        <p>Date: {form.event_date}{form.venue ? ` — ${form.venue}` : ''}</p>
                        {form.number_of_guests && <p>Guests: {form.number_of_guests}</p>}
                        {form.event_description && <p className="text-slate-500 mt-1">{form.event_description}</p>}
                      </ReviewBlock>
                      {form.documents.length > 0 && (
                        <ReviewBlock title="Documents">
                          <p>{form.documents.length} file(s) attached</p>
                        </ReviewBlock>
                      )}
                      <ReviewBlock title="Signature">
                        {form.signature ? (
                          <img src={form.signature} alt="Signature" className="h-16 border rounded" />
                        ) : (
                          <p className="text-red-500">No signature</p>
                        )}
                      </ReviewBlock>
                    </div>
                    {errors.submit && (
                      <p className="text-red-500 text-sm mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">{errors.submit}</p>
                    )}
                  </>
                )}

                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  {step > 1 ? (
                    <Button variant="outline" onClick={back} className="gap-2">
                      <ArrowLeft size={16} /> Back
                    </Button>
                  ) : <div />}

                  {step < 6 ? (
                    <Button onClick={next} className="gap-2">
                      Continue <ArrowRight size={16} />
                    </Button>
                  ) : (
                    <Button onClick={submit} disabled={submitting} className="gap-2">
                      {submitting ? (
                        <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                      ) : (
                        <><Check size={16} /> Submit Request</>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  )
}

function ReviewBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
      <h3 className="font-semibold text-ips-blue dark:text-ips-gold text-xs uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  )
}
