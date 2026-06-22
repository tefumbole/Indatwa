import { motion } from 'framer-motion'

interface PageHeaderProps {
  label?: string
  title: string
  description?: string
  image?: string
}

export function PageHeader({ label, title, description, image }: PageHeaderProps) {
  return (
    <section className="relative pt-28 pb-16 overflow-hidden">
      {image && (
        <div className="absolute inset-0">
          <img src={image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-ips-blue/85 dark:bg-slate-950/90" />
        </div>
      )}
      {!image && (
        <div className="absolute inset-0 bg-gradient-to-br from-ips-blue to-ips-blue-dark" />
      )}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-ips-gold rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {label && (
            <p className="text-ips-gold font-semibold text-sm tracking-widest uppercase mb-3">{label}</p>
          )}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">{title}</h1>
          {description && (
            <p className="text-slate-200 max-w-2xl mx-auto text-lg">{description}</p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
