import { FaqAccordion } from '@/components/shared/FaqAccordion'
import { PageHeader } from '@/components/shared/PageHeader'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Seo } from '@/components/shared/Seo'
import { Button } from '@/components/ui/Button'
import { FALLBACK_FAQS } from '@/data/fallbacks'
import { api, type Faq } from '@/lib/api'
import { Loader2, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getFaqs().then((data) => {
      setFaqs(data ?? FALLBACK_FAQS)
      setLoading(false)
    })
  }, [])

  return (
    <>
      <Seo
        title="FAQ"
        description="Frequently asked questions about IPS protocol services, booking, payments, tracking, and document requirements."
        path="/faq"
      />
      <PageHeader
        label="Help Center"
        title="Frequently Asked Questions"
        description="Everything you need to know about requesting and managing IPS services."
      />

      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-ips-blue" />
            </div>
          ) : (
            <FaqAccordion faqs={faqs} />
          )}
        </div>
      </section>

      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <SectionHeading
            title="Still Have Questions?"
            description="Our team is ready to help. Reach out via WhatsApp or our contact form."
          />
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://wa.me/250780759253" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="gap-2">
                <MessageCircle size={18} /> WhatsApp Us
              </Button>
            </a>
            <Link to="/contact">
              <Button variant="outline">Contact Form</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
