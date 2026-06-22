import { PageHeader } from '@/components/shared/PageHeader'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Seo } from '@/components/shared/Seo'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { Award, Eye, Heart, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

const values = [
  { icon: Award, title: 'Excellence', description: 'We pursue the highest standards in every protocol detail and guest interaction.' },
  { icon: Heart, title: 'Integrity', description: 'Honesty, reliability, and professionalism define every engagement with our clients.' },
  { icon: Eye, title: 'Diplomacy', description: 'Cultural sensitivity and diplomatic etiquette are at the core of our training.' },
  { icon: Target, title: 'Precision', description: 'Every event is executed with meticulous planning and flawless timing.' },
]

const teamImages = [
  { src: '/assets/4-06096c11-f3c0-4d8a-afc5-67cd2b11ca9f.png', label: 'Protocol Officers' },
  { src: '/assets/7-38572c81-7954-4d19-9013-edab41ff3a40.png', label: 'Security & Support' },
  { src: '/assets/2-22a1aa19-57ba-4ab7-9c3d-f064d69dbf22.png', label: 'Event Hostesses' },
  { src: '/assets/6-d15b8e60-0c5f-450d-b61b-3c74e6347148.png', label: 'Event Coordinators' },
]

export function AboutPage() {
  return (
    <>
      <Seo
        title="About Us"
        description="Learn about Indatwa Protocol & Services Agency — Rwanda's premier protocol and event services company based in Kimironko, Kigali."
        path="/about"
      />
      <PageHeader
        label="Our Story"
        title="About Indatwa"
        description="Rwanda's trusted partner for diplomatic protocol and premium event services."
        image="/assets/1-c880fae8-83f5-4df6-94d7-285dbd6cf243.png"
      />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <SectionHeading
                label="Who We Are"
                title="A Legacy of Protocol Excellence"
                description="Indatwa Protocol & Services Agency (IPS) was founded in Kigali with a singular mission: to bring world-class diplomatic protocol and event services to Rwanda and the East African region."
                centered={false}
              />
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Based in Kimironko, Kigali, we serve government institutions, embassies, corporations,
                and private clients who demand nothing less than excellence. Our team of trained protocol
                officers, hostesses, drivers, translators, and event coordinators work in harmony to
                deliver seamless experiences.
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                From state visits and diplomatic receptions to corporate summits and luxury weddings,
                IPS has earned the trust of distinguished clients across Rwanda and beyond.
              </p>
              <Link to="/request">
                <Button>Work With Us</Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <img src="/assets/landing-hero.png" alt="IPS Team" className="rounded-2xl shadow-xl col-span-2 aspect-[16/9] object-cover" />
              <img src="/assets/Landing_Page-6f34a890-3326-4c98-8d7d-c87b51df364e.png" alt="IPS Staff" className="rounded-2xl shadow-lg aspect-square object-cover" />
              <img src="/assets/8-e37d6a7c-b0c6-4d44-8467-19722f574574.png" alt="IPS Events" className="rounded-2xl shadow-lg aspect-square object-cover" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Our Values" title="What Drives Us" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-ips-blue/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-ips-blue dark:text-ips-gold" />
                </div>
                <h3 className="font-semibold text-ips-blue dark:text-white mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Our Team" title="Meet the Professionals Behind IPS" description="Every member of our team is trained to international protocol and hospitality standards." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamImages.map((member, i) => (
              <motion.div
                key={member.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl overflow-hidden shadow-lg"
              >
                <img src={member.src} alt={member.label} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="bg-ips-blue p-4">
                  <p className="text-white font-semibold text-sm">{member.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-ips-blue dark:bg-ips-blue-dark">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-slate-200 text-lg leading-relaxed">
            To elevate every event through impeccable protocol, premium hospitality, and
            unwavering professionalism — making Rwanda a destination for world-class events.
          </p>
        </div>
      </section>
    </>
  )
}
