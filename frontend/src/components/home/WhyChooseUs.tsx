import { motion } from 'framer-motion'
import { Award, Globe, Clock, HeartHandshake } from 'lucide-react'

const reasons = [
  {
    icon: Award,
    title: 'Diplomatic Excellence',
    description: 'Trained protocol officers with experience in state-level and corporate diplomatic events.',
  },
  {
    icon: Globe,
    title: 'International Standards',
    description: 'Services aligned with global hospitality and protocol standards, delivered locally in Rwanda.',
  },
  {
    icon: Clock,
    title: 'Punctual & Reliable',
    description: 'Precision timing and flawless execution — because every moment of your event matters.',
  },
  {
    icon: HeartHandshake,
    title: 'Personalized Service',
    description: 'Tailored solutions designed around your unique event requirements and cultural context.',
  },
]

export function WhyChooseUs() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-ips-gold font-semibold text-sm tracking-widest uppercase mb-3">Why IPS</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ips-blue dark:text-white mb-6">
              Why Choose Indatwa?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              With a commitment to luxury, diplomacy, and corporate excellence, IPS has
              become Rwanda's trusted partner for premium protocol and event services.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {reasons.map((reason, i) => (
                <motion.div
                  key={reason.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-ips-gold/10 flex items-center justify-center">
                    <reason.icon className="w-5 h-5 text-ips-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ips-blue dark:text-white text-sm mb-1">{reason.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{reason.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <img
                src="/assets/2-22a1aa19-57ba-4ab7-9c3d-f064d69dbf22.png"
                alt="IPS Protocol Team"
                className="rounded-2xl object-cover aspect-[3/4] shadow-xl"
              />
              <img
                src="/assets/6-d15b8e60-0c5f-450d-b61b-3c74e6347148.png"
                alt="IPS Event Staff"
                className="rounded-2xl object-cover aspect-[3/4] shadow-xl mt-8"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 glass rounded-xl p-4 shadow-xl">
              <p className="text-3xl font-bold text-ips-blue dark:text-ips-gold">10+</p>
              <p className="text-sm text-slate-500">Years of Excellence</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
