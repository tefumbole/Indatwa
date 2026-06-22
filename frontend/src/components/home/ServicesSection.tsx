import { motion } from 'framer-motion'
import {
  Car, Cake, Coffee, GlassWater, Languages, Shield,
  Sparkles, Users, PartyPopper, MoreHorizontal, Crown,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const services = [
  { icon: Crown, name: 'Protocol Services', desc: 'Diplomatic protocol for state and corporate events' },
  { icon: Car, name: 'Professional Drivers', desc: 'Chauffeur services for VIP transportation' },
  { icon: Languages, name: 'Translators', desc: 'Professional interpretation in multiple languages' },
  { icon: Coffee, name: 'Beverages', desc: 'Premium beverage catering and service' },
  { icon: GlassWater, name: 'Glass Rental', desc: 'Elegant glassware for any occasion' },
  { icon: Cake, name: 'Wedding Cakes', desc: 'Custom-designed celebration cakes' },
  { icon: Users, name: 'Hostesses', desc: 'Professional hospitality and guest reception' },
  { icon: Shield, name: 'Security Services', desc: 'Trained security for event protection' },
  { icon: Sparkles, name: 'Decoration', desc: 'Premium event styling and décor' },
  { icon: PartyPopper, name: 'Event Support', desc: 'Full-service event coordination' },
  { icon: MoreHorizontal, name: 'Other Services', desc: 'Custom solutions for unique needs' },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-ips-gold font-semibold text-sm tracking-widest uppercase mb-3">What We Offer</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ips-blue dark:text-white mb-4">
            Our Premium Services
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From diplomatic protocol to complete event management, IPS provides
            comprehensive services tailored to your distinguished occasion.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.name}
              variants={item}
              className="group glass rounded-2xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-ips-blue/10 dark:bg-ips-gold/10 flex items-center justify-center mb-4 group-hover:bg-ips-blue group-hover:text-white dark:group-hover:bg-ips-gold dark:group-hover:text-ips-blue transition-colors">
                <service.icon className="w-6 h-6 text-ips-blue dark:text-ips-gold group-hover:text-inherit" />
              </div>
              <h3 className="font-semibold text-ips-blue dark:text-white mb-2">{service.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{service.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12 flex flex-wrap justify-center gap-6"
        >
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-ips-blue dark:text-ips-gold font-semibold hover:underline"
          >
            View All Services →
          </Link>
          <Link
            to="/request"
            className="inline-flex items-center gap-2 text-ips-blue dark:text-ips-gold font-semibold hover:underline"
          >
            Request a Custom Package →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
