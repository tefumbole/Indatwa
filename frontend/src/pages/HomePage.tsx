import { ContactSection } from '@/components/home/ContactSection'
import { HeroSection } from '@/components/home/HeroSection'
import { ServicesSection } from '@/components/home/ServicesSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { VideoBanner } from '@/components/home/VideoBanner'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { Seo } from '@/components/shared/Seo'
import { motion } from 'framer-motion'

function CompanyOverview() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <img
              src="/assets/1-c880fae8-83f5-4df6-94d7-285dbd6cf243.png"
              alt="IPS Team"
              className="rounded-2xl shadow-2xl w-full object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-ips-gold font-semibold text-sm tracking-widest uppercase mb-3">About IPS</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ips-blue dark:text-white mb-6">
              Rwanda's Premier Protocol Agency
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Founded in Kigali, Indatwa Protocol & Services Agency has established
              itself as the leading provider of diplomatic protocol and premium event
              services in Rwanda. Our team of trained professionals brings international
              standards to every occasion.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Whether you are hosting a state visit, corporate summit, wedding, or
              private celebration, IPS ensures your event reflects the highest standards
              of hospitality and protocol excellence.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <>
      <Seo title="Home" path="/" />
      <HeroSection />
      <VideoBanner />
      <CompanyOverview />
      <ServicesSection />
      <WhyChooseUs />
      <TestimonialsSection />
      <ContactSection />
    </>
  )
}
