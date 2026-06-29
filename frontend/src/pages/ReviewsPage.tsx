import { Seo } from '@/components/shared/Seo'
import { api, type ServiceReview } from '@/lib/api'
import { motion } from 'framer-motion'
import { Loader2, Star } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ReviewsPage() {
  const [reviews, setReviews] = useState<ServiceReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getReviews().then((data) => {
      setReviews(data ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <>
      <Seo title="Client Reviews" description="Read reviews from clients who have used Indatwa Protocol & Services Agency." path="/reviews" />
      <div className="min-h-screen pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-bold text-ips-blue dark:text-white mb-2">Client Reviews</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-10">
              Feedback from clients after completed events and services.
            </p>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
            ) : reviews.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center text-slate-500">
                No reviews published yet. Reviews appear here after clients complete a service.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <article key={review.id} className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < review.rating ? 'text-ips-gold fill-ips-gold' : 'text-slate-300'}
                        />
                      ))}
                    </div>
                    <p className="font-semibold text-ips-blue dark:text-white">{review.client_name}</p>
                    {review.comment && <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">{review.comment}</p>}
                    <p className="text-xs text-slate-400 mt-3">{new Date(review.created_at).toLocaleDateString()}</p>
                  </article>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
