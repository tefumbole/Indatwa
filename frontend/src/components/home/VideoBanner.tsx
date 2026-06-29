import { motion } from 'framer-motion'

export function VideoBanner() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-ips-gold font-semibold text-sm tracking-widest uppercase mb-3">Experience IPS</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ips-blue dark:text-white">
            Protocol Excellence in Action
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden shadow-2xl max-w-5xl mx-auto"
        >
          <img
            src="/assets/landing-hero.png"
            alt="Indatwa Protocol & Services Agency"
            className="w-full aspect-video object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white font-semibold text-lg">Indatwa Protocol & Services Agency</p>
            <p className="text-slate-300 text-sm">Premium event & diplomatic protocol services — Kigali, Rwanda</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
