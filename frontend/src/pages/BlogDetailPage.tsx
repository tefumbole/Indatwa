import { PageHeader } from '@/components/shared/PageHeader'
import { Seo } from '@/components/shared/Seo'
import { FALLBACK_BLOG } from '@/data/fallbacks'
import { api, type BlogPost } from '@/lib/api'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Loader2, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    api.getBlogPost(slug).then((data) => {
      setPost(data ?? FALLBACK_BLOG.find((p) => p.slug === slug) ?? null)
      setLoading(false)
    })
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-28">
        <Loader2 className="w-8 h-8 animate-spin text-ips-blue" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center pt-28 px-4">
        <h1 className="text-2xl font-bold text-ips-blue mb-4">Article Not Found</h1>
        <Link to="/blog" className="text-ips-gold hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Blog
        </Link>
      </div>
    )
  }

  return (
    <>
      <Seo
        title={post.title}
        description={post.excerpt || post.title}
        image={post.featured_image || undefined}
        path={`/blog/${post.slug}`}
      />
      <PageHeader title={post.title} image={post.featured_image || undefined} />

      <article className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-ips-blue mb-8">
            <ArrowLeft size={16} /> Back to Blog
          </Link>

          <div className="flex items-center gap-4 text-sm text-slate-500 mb-8">
            <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(post.published_at)}</span>
            <span className="flex items-center gap-1"><User size={14} /> {post.author_name}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="blog-content text-slate-600 dark:text-slate-300 leading-relaxed space-y-4
              [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-ips-blue dark:[&_strong]:text-ips-gold
              [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ips-blue dark:[&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-4"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </div>
      </article>
    </>
  )
}
