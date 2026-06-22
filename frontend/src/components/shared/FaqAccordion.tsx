import { cn } from '@/lib/utils'
import type { Faq } from '@/lib/api'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FaqAccordionProps {
  faqs: Faq[]
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null)

  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))]

  return (
    <div className="space-y-10">
      {categories.length > 1 ? (
        categories.map((category) => (
          <div key={category}>
            <h3 className="font-semibold text-ips-blue dark:text-ips-gold mb-4 text-sm tracking-wider uppercase">
              {category}
            </h3>
            <div className="space-y-3">
              {faqs.filter((f) => f.category === category).map((faq) => (
                <FaqItem
                  key={faq.id}
                  faq={faq}
                  isOpen={openId === faq.id}
                  onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FaqItem({ faq, isOpen, onToggle }: { faq: Faq; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-ips-blue/5 transition-colors"
      >
        <span className="font-medium text-ips-blue dark:text-white pr-4">{faq.question}</span>
        <ChevronDown
          className={cn('w-5 h-5 text-ips-gold flex-shrink-0 transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-5 pb-5 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
