import { PageHeader } from '@/components/shared/PageHeader'
import { Seo } from '@/components/shared/Seo'
import { FALLBACK_GALLERY } from '@/data/fallbacks'
import { api, type GalleryItem } from '@/lib/api'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X, ZoomIn } from 'lucide-react'
import { useEffect, useState } from 'react'

export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  useEffect(() => {
    api.getGallery().then((data) => {
      setItems(data ?? FALLBACK_GALLERY)
      setLoading(false)
    })
  }, [])

  const categories = ['all', ...new Set(items.map((i) => i.category).filter(Boolean) as string[])]
  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter)

  return (
    <>
      <Seo
        title="Gallery"
        description="View IPS portfolio — protocol officers, event staff, diplomatic services, and premium events in Kigali, Rwanda."
        path="/gallery"
      />
      <PageHeader
        label="Portfolio"
        title="Our Gallery"
        description="A glimpse into the distinguished events and professional teams that define IPS."
        image="/assets/4-06096c11-f3c0-4d8a-afc5-67cd2b11ca9f.png"
      />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-ips-blue" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-10 justify-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                      filter === cat
                        ? 'bg-ips-blue text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-ips-blue/10'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative rounded-xl overflow-hidden cursor-pointer aspect-[4/5]"
                    onClick={() => setLightbox(item)}
                  >
                    <img
                      src={item.image_path}
                      alt={item.title || 'Gallery image'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                      {item.title && <p className="text-white font-medium text-sm">{item.title}</p>}
                      {item.category && <p className="text-ips-gold text-xs">{item.category}</p>}
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-6 right-6 text-white p-2 rounded-full hover:bg-white/10"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              <X size={28} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={lightbox.image_path}
              alt={lightbox.title || ''}
              className="max-w-full max-h-[85vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {lightbox.title && (
              <p className="absolute bottom-6 text-white text-center font-medium">{lightbox.title}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
