import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { FALLBACK_SERVICES } from '@/data/fallbacks'
import { api, type Service } from '@/lib/api'
import {
  clientStepSchema, eventStepSchema, EVENT_TYPES,
  servicesStepSchema, STEP_LABELS, FORM_PLACEHOLDERS,
  type RequestFormData,
} from '@/schemas/requestSchema'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const EVENT_TYPE_ICONS: Record<string, string> = {
  Wedding: '💒',
  'Corporate Conference': '🏢',
  'Government / Diplomatic': '🏛️',
  'State Visit': '🇷🇼',
  'Private Celebration': '🎉',
  'Product Launch': '🚀',
  'Gala Dinner': '🍽️',
  'Funeral / Memorial': '🕊️',
  Other: '✨',
}

const inputClass = 'w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:ring-2 focus:ring-ips-gold/40 focus:border-ips-gold outline-none transition text-sm'
const labelClass = 'block text-sm font-medium text-white/80 mb-1.5'

const TOTAL_STEPS = STEP_LABELS.length

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
  event_start_date: '',
  event_start_time: '',
  event_end_date: '',
  event_end_time: '',
  number_of_guests: undefined,
  venue: '',
  event_description: '',
  documents: [],
}

export function RequestServicePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { token } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<RequestFormData>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.getServices().then((data) => {
      const list = data ?? FALLBACK_SERVICES
      setServices(list)
      setLoading(false)

      const serviceId = searchParams.get('service')
      if (serviceId) {
        const id = Number(serviceId)
        if (!Number.isNaN(id) && list.some((s) => s.id === id)) {
          setForm((prev) => ({
            ...prev,
            services: prev.services.includes(id) ? prev.services : [...prev.services, id],
          }))
        }
      }
    })
  }, [searchParams])

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

  const validateAll = (): boolean => {
    const checks = [
      servicesStepSchema.safeParse({ services: form.services }),
      clientStepSchema.safeParse(form),
      eventStepSchema.safeParse(form),
    ]
    for (const check of checks) {
      if (!check.success) {
        const fieldErrors: Record<string, string> = {}
        check.error.issues.forEach((issue) => {
          fieldErrors[issue.path[0] as string] = issue.message
        })
        setErrors(fieldErrors)
        return false
      }
    }
    return true
  }

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const back = () => setStep((s) => Math.max(s - 1, 1))

  const submit = async () => {
    if (!validateAll()) return
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

  const formatEventSchedule = () => {
    const start = [form.event_start_date, form.event_start_time].filter(Boolean).join(' ')
    const end = [form.event_end_date || form.event_start_date, form.event_end_time].filter(Boolean).join(' ')
    return end && end !== start ? `${start} → ${end}` : start
  }

  return (
    <>
      <Seo
        title="Request Service"
        description="Submit an event inquiry to Indatwa Protocol & Services Agency. Our team will review your request and send a quotation."
        path="/request"
      />
      <div className="min-h-screen request-page-bg pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-ips-gold mb-8 transition-colors">
              <ArrowLeft size={16} /> Back to Home
            </Link>

            <h1 className="font-display text-4xl font-bold text-white mb-2">
              Request <span className="text-ips-gold">Service</span>
            </h1>
            <p className="text-white/70 mb-2">
              Step {step} of {TOTAL_STEPS} — <span className="text-ips-gold font-semibold">{STEP_LABELS[step - 1]}</span>
            </p>
            <p className="text-xs text-white/50 mb-8">
              Submit your inquiry first. After admin review and quotation, you will sign and attach ID when you accept.
            </p>

            <div className="flex gap-1.5 mb-10">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex-1">
                  <div className={`h-2 rounded-full transition-colors ${i + 1 <= step ? 'bg-ips-gold shadow-lg shadow-ips-gold/30' : 'bg-white/10'}`} />
                  <p className={`text-[10px] mt-1.5 hidden sm:block font-medium ${i + 1 === step ? 'text-ips-gold' : 'text-white/40'}`}>
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
                className="rounded-2xl p-6 sm:p-8 bg-[#0a2560]/80 backdrop-blur-xl border border-white/10 shadow-2xl"
              >
                {step === 1 && (
                  <>
                    <h2 className="font-semibold text-lg text-ips-gold mb-6">Select Services</h2>
                    {loading ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-ips-gold" /></div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {services.map((service) => (
                          <label
                            key={service.id}
                            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              form.services.includes(service.id)
                                ? 'border-ips-gold bg-ips-gold/10 shadow-lg shadow-ips-gold/10'
                                : 'border-white/15 hover:border-ips-gold/40 bg-white/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={form.services.includes(service.id)}
                              onChange={() => toggleService(service.id)}
                              className="w-4 h-4 accent-ips-gold mt-0.5"
                            />
                            <div>
                              <span className="text-sm font-semibold text-white block">{service.name}</span>
                              {service.short_description && (
                                <span className="text-xs text-white/50">{service.short_description}</span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    {errors.services && <p className="text-red-400 text-xs mt-3">{errors.services}</p>}
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="font-semibold text-lg text-ips-gold mb-6">Personal Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Full Name / Organization *</label>
                        <input className={inputClass} value={form.client_name} onChange={(e) => update({ client_name: e.target.value })} placeholder={FORM_PLACEHOLDERS.client_name} />
                        {errors.client_name && <p className="text-red-500 text-xs mt-1">{errors.client_name}</p>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Phone Number *</label>
                          <input className={inputClass} value={form.client_phone} onChange={(e) => update({ client_phone: e.target.value })} placeholder={FORM_PLACEHOLDERS.client_phone} />
                          {errors.client_phone && <p className="text-red-500 text-xs mt-1">{errors.client_phone}</p>}
                        </div>
                        <div>
                          <label className={labelClass}>Email Address</label>
                          <input className={inputClass} type="email" value={form.client_email} onChange={(e) => update({ client_email: e.target.value })} placeholder={FORM_PLACEHOLDERS.client_email} />
                          {errors.client_email && <p className="text-red-500 text-xs mt-1">{errors.client_email}</p>}
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Nationality</label>
                          <input className={inputClass} value={form.client_nationality} onChange={(e) => update({ client_nationality: e.target.value })} placeholder={FORM_PLACEHOLDERS.client_nationality} />
                        </div>
                        <div>
                          <label className={labelClass}>Country</label>
                          <input className={inputClass} value={form.client_country} onChange={(e) => update({ client_country: e.target.value })} placeholder={FORM_PLACEHOLDERS.client_country} />
                        </div>
                        <div>
                          <label className={labelClass}>City</label>
                          <input className={inputClass} value={form.client_city} onChange={(e) => update({ client_city: e.target.value })} placeholder={FORM_PLACEHOLDERS.client_city} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2 className="font-semibold text-lg text-ips-gold mb-6">Event Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Event Title *</label>
                        <input className={inputClass} value={form.event_title} onChange={(e) => update({ event_title: e.target.value })} placeholder={FORM_PLACEHOLDERS.event_title} />
                        {errors.event_title && <p className="text-red-500 text-xs mt-1">{errors.event_title}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Event Type *</label>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {EVENT_TYPES.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => update({ event_type: t })}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                form.event_type === t
                                  ? 'border-ips-gold bg-ips-gold/15 shadow-lg shadow-ips-gold/10'
                                  : 'border-white/15 bg-white/5 hover:border-ips-gold/40'
                              }`}
                            >
                              <span className="text-xl shrink-0">{EVENT_TYPE_ICONS[t] || '📌'}</span>
                              <span className="text-sm font-medium text-white">{t}</span>
                            </button>
                          ))}
                        </div>
                        {errors.event_type && <p className="text-red-500 text-xs mt-1">{errors.event_type}</p>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Start Date *</label>
                          <input className={inputClass} type="date" value={form.event_start_date} onChange={(e) => update({ event_start_date: e.target.value })} />
                          {errors.event_start_date && <p className="text-red-500 text-xs mt-1">{errors.event_start_date}</p>}
                        </div>
                        <div>
                          <label className={labelClass}>Start Time</label>
                          <input className={inputClass} type="time" value={form.event_start_time} onChange={(e) => update({ event_start_time: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>End Date</label>
                          <input className={inputClass} type="date" value={form.event_end_date} onChange={(e) => update({ event_end_date: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>End Time</label>
                          <input className={inputClass} type="time" value={form.event_end_time} onChange={(e) => update({ event_end_time: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Number of Guests</label>
                          <input className={inputClass} type="number" min={1} value={form.number_of_guests ?? ''} onChange={(e) => update({ number_of_guests: e.target.value ? Number(e.target.value) : undefined })} placeholder={FORM_PLACEHOLDERS.number_of_guests} />
                        </div>
                        <div>
                          <label className={labelClass}>Venue</label>
                          <input className={inputClass} value={form.venue} onChange={(e) => update({ venue: e.target.value })} placeholder={FORM_PLACEHOLDERS.venue} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Event Description</label>
                        <textarea className={`${inputClass} resize-none`} rows={4} value={form.event_description} onChange={(e) => update({ event_description: e.target.value })} placeholder={FORM_PLACEHOLDERS.event_description} />
                      </div>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <h2 className="font-semibold text-lg text-ips-gold mb-6">Review & Submit</h2>
                    <div className="space-y-6 text-sm">
                      <ReviewBlock title="Services">
                        <ul className="list-disc list-inside text-white/70">
                          {selectedServices.map((s) => <li key={s.id}>{s.name}</li>)}
                        </ul>
                      </ReviewBlock>
                      <ReviewBlock title="Client">
                        <p className="text-white/80">{form.client_name} — {form.client_phone}</p>
                        {form.client_email && <p className="text-white/70">{form.client_email}</p>}
                        {(form.client_nationality || form.client_country) && (
                          <p className="text-white/70">{[form.client_nationality, form.client_city, form.client_country].filter(Boolean).join(', ')}</p>
                        )}
                      </ReviewBlock>
                      <ReviewBlock title="Event">
                        <p className="text-white/80"><strong className="text-white">{form.event_title}</strong> — {form.event_type}</p>
                        <p className="text-white/70">Schedule: {formatEventSchedule()}</p>
                        {form.venue && <p className="text-white/70">Venue: {form.venue}</p>}
                        {form.number_of_guests && <p className="text-white/70">Guests: {form.number_of_guests}</p>}
                        {form.event_description && <p className="text-white/50 mt-1">{form.event_description}</p>}
                      </ReviewBlock>
                      <p className="text-xs text-white/40">
                        After submission, IPS will review your inquiry and send a quotation. ID upload and signature are required only after you accept the quotation.
                      </p>
                    </div>
                    {errors.submit && (
                      <p className="text-red-300 text-sm mt-4 p-3 bg-red-900/40 border border-red-500/30 rounded-xl">{errors.submit}</p>
                    )}
                  </>
                )}

                <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                  {step > 1 ? (
                    <Button variant="outline" onClick={back} className="gap-2 border-ips-gold text-ips-gold hover:bg-ips-gold hover:text-ips-blue">
                      <ArrowLeft size={16} /> Back
                    </Button>
                  ) : <div />}

                  {step < TOTAL_STEPS ? (
                    <Button variant="secondary" onClick={next} className="gap-2">
                      Continue <ArrowRight size={16} />
                    </Button>
                  ) : (
                    <Button onClick={submit} disabled={submitting} className="gap-2 bg-ips-blue hover:bg-ips-blue-light border border-white/10">
                      {submitting ? (
                        <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                      ) : (
                        <><Check size={16} /> Submit Inquiry</>
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
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <h3 className="font-semibold text-ips-gold text-xs uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  )
}
