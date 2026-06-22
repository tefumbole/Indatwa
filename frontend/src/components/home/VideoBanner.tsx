import { motion } from 'framer-motion'
import { Play, X } from 'lucide-react'
import { useState } from 'react'

export function VideoBanner() {
  const [playing, setPlaying] = useState(false)

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
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video max-w-5xl mx-auto group cursor-pointer"
          onClick={() => setPlaying(true)}
        >
          <img
            src="/assets/landing-hero.png"
            alt="IPS Protocol Services Video"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-ips-blue/40 group-hover:bg-ips-blue/30 transition-colors" />

          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-20 h-20 rounded-full bg-ips-gold flex items-center justify-center shadow-xl shadow-ips-gold/30"
              >
                <Play className="w-8 h-8 text-ips-blue ml-1" fill="currentColor" />
              </motion.div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white font-semibold text-lg">Indatwa Protocol & Services Agency</p>
            <p className="text-slate-300 text-sm">Premium event & diplomatic protocol services — Kigali, Rwanda</p>
          </div>
        </motion.div>

        {playing && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setPlaying(false)}
          >
            <button
              className="absolute top-6 right-6 text-white p-2 rounded-full hover:bg-white/10"
              onClick={() => setPlaying(false)}
              aria-label="Close video"
            >
              <X size={28} />
            </button>
            <div
              className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src="/assets/2-22a1aa19-57ba-4ab7-9c3d-f064d69dbf22.png"
                alt="IPS Showcase"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-center px-8">
                  <span className="block text-ips-gold font-semibold mb-2">Video Coming Soon</span>
                  Upload your promotional video to the admin panel or set <code className="text-sm bg-white/10 px-2 py-1 rounded">video_url</code> in site settings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
