import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-ips-blue-dark text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <img src="/assets/logo.png" alt="IPS" className="h-12 mb-4 brightness-0 invert" />
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              Indatwa Protocol & Services Agency delivers world-class protocol,
              event coordination, and premium hospitality services in Rwanda.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-ips-gold mb-4 text-sm tracking-wider uppercase">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              {['About', 'Services', 'Gallery', 'Blog', 'FAQ', 'Contact'].map((link) => (
                <li key={link}>
                  <Link to={`/${link.toLowerCase()}`} className="hover:text-ips-gold transition-colors">
                    {link}
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
          </p>
        </div>
      </div>
    </footer>
  )
}
