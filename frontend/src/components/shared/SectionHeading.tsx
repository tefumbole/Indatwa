import { motion } from 'framer-motion'

interface SectionHeadingProps {
  label?: string
  title: string
  description?: string
  centered?: boolean
}

export function SectionHeading({ label, title, description, centered = true }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={centered ? 'text-center mb-12' : 'mb-12'}
    >
      {label && (
        <p className="text-ips-gold font-semibold text-sm tracking-widest uppercase mb-3">{label}</p>
      )}
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-ips-blue dark:text-white mb-3">{title}</h2>
      {description && (
        <p className={`text-slate-600 dark:text-slate-400 ${centered ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}>
          {description}
        </p>
      )}
    </motion.div>
  )
}
