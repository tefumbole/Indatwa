import { PageHeader } from '@/components/shared/PageHeader'
import { Seo } from '@/components/shared/Seo'
import { FALLBACK_BLOG } from '@/data/fallbacks'
import { api, type BlogPost } from '@/lib/api'
import { motion } from 'framer-motion'
import { Calendar, Loader2, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getBlogPosts().then((data) => {
      setPosts(data ?? FALLBACK_BLOG)
      setLoading(false)
    })
  }, [])

  return (
    <>
      <Seo
        title="Blog"
        description="Insights, news, and stories about protocol services, event management, and hospitality excellence from IPS."
        path="/blog"
      />
      <PageHeader
        label="Insights"
        title="IPS Blog"
        description="Stories and expertise from the world of protocol and premium events."
      />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-ips-blue" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group glass rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <Link to={`/blog/${post.slug}`}>
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={post.featured_image || '/assets/landing-hero.png'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {formatDate(post.published_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} /> {post.author_name}
                        </span>
                      </div>
                      <h2 className="font-semibold text-lg text-ips-blue dark:text-white mb-2 group-hover:text-ips-gold transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{post.excerpt}</p>
                      <span className="inline-block mt-4 text-sm font-medium text-ips-blue dark:text-ips-gold group-hover:underline">
                        Read more →
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
