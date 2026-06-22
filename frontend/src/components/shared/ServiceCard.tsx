import { Button } from '@/components/ui/Button'
import type { Service } from '@/lib/api'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const SERVICE_IMAGES: Record<string, string> = {
  'protocol-services': '/assets/4-06096c11-f3c0-4d8a-afc5-67cd2b11ca9f.png',
  'event-support': '/assets/6-d15b8e60-0c5f-450d-b61b-3c74e6347148.png',
  hostesses: '/assets/1-c880fae8-83f5-4df6-94d7-285dbd6cf243.png',
  'professional-drivers': '/assets/7-38572c81-7954-4d19-9013-edab41ff3a40.png',
}

interface ServiceCardProps {
  service: Service
  index?: number
}

export function ServiceCard({ service, index = 0 }: ServiceCardProps) {
  const image = service.image_path || SERVICE_IMAGES[service.slug] || '/assets/landing-hero.png'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group glass rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-6">
        {service.is_featured && (
          <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-ips-gold/20 text-ips-gold rounded-full mb-2">
            Featured
          </span>
        )}
        <h3 className="font-semibold text-lg text-ips-blue dark:text-white mb-2">{service.name}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
          {service.short_description || service.description}
        </p>
        {service.category && (
          <p className="text-xs text-ips-gold font-medium mb-4">{service.category.name}</p>
        )}
        <Link to="/request">
          <Button variant="outline" size="sm" className="gap-1 w-full">
            Request <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
