import { FALLBACK_TESTIMONIALS } from '@/data/fallbacks'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { useEffect, useState } from 'react'

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS)

  useEffect(() => {
    api.getTestimonials().then((data) => {
      if (data?.length) setTestimonials(data)
    })
  }, [])
  return (
    <section className="py-24 bg-ips-blue dark:bg-ips-blue-dark relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-ips-gold rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-ips-gold font-semibold text-sm tracking-widest uppercase mb-3">Testimonials</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by Distinguished Clients
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass rounded-2xl p-8 relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-ips-gold/30" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-ips-gold text-ips-gold" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed italic">
                "{t.content}"
              </p>
              <div>
                <p className="font-semibold text-ips-blue dark:text-white">{t.client_name}</p>
                <p className="text-sm text-slate-500">{t.client_title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
