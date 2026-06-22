import { ContactForm } from '@/components/shared/ContactForm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Seo } from '@/components/shared/Seo'
import { motion } from 'framer-motion'
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'

const contactInfo = [
  { icon: MapPin, label: 'Location', value: 'Kimironko, Kigali, Rwanda' },
  { icon: Phone, label: 'WhatsApp', value: '+250 780 759 253', href: 'https://wa.me/250780759253' },
  { icon: Mail, label: 'Email', value: 'info@indatwa.rw', href: 'mailto:info@indatwa.rw' },
  { icon: Clock, label: 'Hours', value: 'Mon – Sat: 8:00 AM – 6:00 PM' },
]

export function ContactPage() {
  return (
    <>
      <Seo
        title="Contact Us"
        description="Contact Indatwa Protocol & Services Agency in Kimironko, Kigali. WhatsApp +250 780 759 253."
        path="/contact"
      />
      <PageHeader
        label="Get In Touch"
        title="Contact Us"
        description="We'd love to hear about your event. Reach out and let us create something exceptional."
      />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-6"
            >
              <h2 className="font-display text-2xl font-bold text-ips-blue dark:text-white mb-6">
                Let's Talk
              </h2>

              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-ips-blue/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-ips-blue dark:text-ips-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ips-blue dark:text-white">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm text-slate-500 hover:text-ips-blue transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm text-slate-500">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}

              <a
                href="https://wa.me/250780759253"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <MessageCircle size={18} /> Chat on WhatsApp
              </a>

              <div className="rounded-2xl overflow-hidden mt-8 aspect-video">
                <iframe
                  title="IPS Location"
                  src="https://maps.google.com/maps?q=Kimironko,Kigali,Rwanda&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <ContactForm />
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
