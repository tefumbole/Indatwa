import { PageHeader } from '@/components/shared/PageHeader'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Seo } from '@/components/shared/Seo'
import { ServiceCard } from '@/components/shared/ServiceCard'
import { Button } from '@/components/ui/Button'
import { FALLBACK_SERVICES } from '@/data/fallbacks'
import { api, type Service } from '@/lib/api'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.getServices().then((data) => {
      setServices(data ?? FALLBACK_SERVICES)
      setLoading(false)
    })
  }, [])

  const featured = services.filter((s) => s.is_featured)
  const filtered = filter === 'all' ? services : services.filter((s) => s.category?.slug === filter)

  const categories = [
    { slug: 'all', name: 'All Services' },
    ...Array.from(
      new Map(services.filter((s) => s.category).map((s) => [s.category!.slug, s.category!])).values()
    ).map((c) => ({ slug: c.slug, name: c.name })),
  ]

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

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-ips-blue" />
            </div>
          ) : (
            <>
              {featured.length > 0 && (
                <div className="mb-16">
                  <SectionHeading label="Featured" title="Popular Services" />
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featured.map((service, i) => (
                      <ServiceCard key={service.id} service={service} index={i} />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-10 justify-center">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setFilter(cat.slug)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filter === cat.slug
                        ? 'bg-ips-blue text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-ips-blue/10'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((service, i) => (
                  <ServiceCard key={service.id} service={service} index={i} />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mt-16 glass rounded-2xl p-10"
              >
                <h3 className="font-display text-2xl font-bold text-ips-blue dark:text-white mb-3">
                  Need a Custom Package?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
                  Combine multiple services into a tailored package for your event. Our team will prepare a detailed quotation.
                </p>
                <Link to="/request">
                  <Button size="lg">Request Service</Button>
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
