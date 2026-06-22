import { useEffect } from 'react'

interface SeoProps {
  title: string
  description?: string
  image?: string
  path?: string
}

const SITE_NAME = 'Indatwa Protocol & Services Agency'
const DEFAULT_DESCRIPTION = 'Premium protocol, event support, and diplomatic services in Kigali, Rwanda. Request services online with IPS.'
const BASE_URL = 'https://indatwa.rw'

export function Seo({ title, description = DEFAULT_DESCRIPTION, image = '/assets/landing-hero.png', path = '' }: SeoProps) {
  const fullTitle = title === 'Home' ? `${SITE_NAME} | IPS` : `${title} | ${SITE_NAME}`
  const url = `${BASE_URL}${path}`
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`

  useEffect(() => {
    document.title = fullTitle

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', description)
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description, true)
    setMeta('og:image', imageUrl, true)
    setMeta('og:url', url, true)
    setMeta('og:type', 'website', true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', imageUrl)
  }, [fullTitle, description, imageUrl, url])

  return null
}
