import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { MapPin, Phone, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ContactSection() {
  return (
    <section id="contact" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-8 sm:p-12 lg:p-16 text-center"
        >
          <p className="text-ips-gold font-semibold text-sm tracking-widest uppercase mb-3">Get In Touch</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ips-blue dark:text-white mb-4">
            Ready to Elevate Your Event?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-10">
            Contact us today to discuss your protocol and event service needs.
            Our team is ready to deliver an exceptional experience.
          </p>

          <div className="flex flex-wrap justify-center gap-8 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ips-blue/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-ips-blue" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ips-blue dark:text-white">Location</p>
                <p className="text-sm text-slate-500">Kimironko, Kigali, Rwanda</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ips-gold/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-ips-gold" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ips-blue dark:text-white">WhatsApp</p>
                <a href="https://wa.me/250780759253" className="text-sm text-slate-500 hover:text-ips-blue">
                  +250 780 759 253
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/request">
              <Button size="lg">Request Service</Button>
            </Link>
            <a href="https://wa.me/250780759253" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="lg" className="gap-2">
                <MessageCircle size={18} /> WhatsApp Us
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
