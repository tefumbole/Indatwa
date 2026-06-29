import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { ArrowRight, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background hero image */}
      <div className="absolute inset-0">
        <img
          src="/assets/landing-hero.png"
          alt="Indatwa Protocol Officers"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/30 dark:from-slate-950/95 dark:via-slate-950/80 dark:to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-slate-950" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-ips-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-ips-blue/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-ips-blue dark:text-ips-gold mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-ips-gold animate-pulse" />
              Kimironko, Kigali — Rwanda
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ips-blue dark:text-white leading-tight mb-6"
            >
              Excellence in{' '}
              <span className="text-gradient-gold">Protocol</span>{' '}
              & Event Services
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed"
            >
              Indatwa Protocol & Services Agency delivers world-class diplomatic
              protocol, event coordination, and premium hospitality services for
              distinguished occasions across Rwanda and beyond.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/request">
                <Button size="lg" className="gap-2">
                  Request Service <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" size="lg" className="gap-2">
                  Explore Services
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-2 border-ips-gold text-ips-gold hover:bg-ips-gold hover:text-ips-blue dark:border-ips-gold dark:text-ips-gold"
                >
                  <LogIn size={18} /> Admin Login
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-12 flex items-center gap-8"
            >
              {[
                { value: '500+', label: 'Events Served' },
                { value: '50+', label: 'Expert Staff' },
                { value: '98%', label: 'Client Satisfaction' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-ips-blue dark:text-ips-gold">{stat.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block relative"
          >
            <div className="glass rounded-2xl p-6 shadow-2xl">
              <img
                src="/assets/4-06096c11-f3c0-4d8a-afc5-67cd2b11ca9f.png"
                alt="IPS Professional Team"
                className="rounded-xl w-full object-cover aspect-[4/5]"
              />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ips-blue dark:text-white">Professional Team</p>
                  <p className="text-sm text-slate-500">Trained protocol officers</p>
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-ips-blue/20 border-2 border-white dark:border-slate-800" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
