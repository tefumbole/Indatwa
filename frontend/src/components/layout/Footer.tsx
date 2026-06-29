import { Link } from 'react-router-dom'

const quickLinks = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
]

export function Footer() {
  return (
    <footer className="bg-ips-blue-dark text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <img
              src="/build/assets/logo.png"
              alt="Indatwa Protocol & Services Agency"
              className="h-16 w-auto mb-4 object-contain bg-white rounded-lg p-2"
            />
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              Indatwa Protocol & Services Agency delivers world-class protocol,
              event coordination, and premium hospitality services in Rwanda.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-ips-gold mb-4 text-sm tracking-wider uppercase">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-ips-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-ips-gold mb-4 text-sm tracking-wider uppercase">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Kimironko, Kigali</li>
              <li>Rwanda</li>
              <li>
                <a href="mailto:info@indatwagency.com" className="hover:text-ips-gold transition-colors">
                  info@indatwagency.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/250780759253" className="hover:text-ips-gold transition-colors">
                  +250 780 759 253
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Indatwa Protocol & Services Agency. All rights reserved.</p>
          <p>
            Developed by{' '}
            <span className="text-ips-gold font-medium">Alpha Bridge Technologies</span>
            {' · '}
            <a href="tel:+250794006160" className="hover:text-ips-gold transition-colors">+250794006160</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
