import { PageHeader } from '@/components/shared/PageHeader'
import { Seo } from '@/components/shared/Seo'
import { Button } from '@/components/ui/Button'
import { FALLBACK_SERVICES } from '@/data/fallbacks'
import { api, type Service } from '@/lib/api'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getServices().then((data) => {
      setServices(data ?? FALLBACK_SERVICES)
      setLoading(false)
    })
  }, [])

  return (
    <>
      <Seo
        title="Our Services"
        description="Browse IPS protocol services, professional drivers, translators, hostesses, security, catering, and full event support in Kigali, Rwanda."
        path="/services"
      />
      <PageHeader
        label="What We Offer"
        title="Our Services"
        description="Comprehensive protocol and event services tailored to your distinguished occasion."
        image="/assets/6-d15b8e60-0c5f-450d-b61b-3c74e6347148.png"
      />

      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-ips-blue" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col hover:shadow-lg hover:border-ips-gold/40 transition-all"
                >
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                    {service.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1 mb-5">
                    {service.short_description || service.description}
                  </p>
                  <Link to={`/request?service=${service.id}`}>
                    <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto border-ips-gold text-ips-blue dark:text-ips-gold hover:bg-ips-gold hover:text-ips-blue">
                      Request <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-16 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 bg-slate-50 dark:bg-slate-900/30">
            <h3 className="font-display text-2xl font-bold text-ips-blue dark:text-white mb-3">
              Need a Custom Package?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
              Combine multiple services into a tailored package. Our team will prepare a detailed quotation.
            </p>
            <Link to="/request">
              <Button size="lg">Request Service</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
