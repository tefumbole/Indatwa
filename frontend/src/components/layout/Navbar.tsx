import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { LayoutDashboard, LogIn, LogOut, Menu, Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isClient = user?.roles.includes('client')
  const isStaff = user?.roles.some((r) =>
    ['super_admin', 'director', 'operations_manager', 'customer_service', 'protocol_officer', 'finance_officer'].includes(r)
  )

  const onHero = isHome && !scrolled

  const navLinkClass = (href: string) => cn(
    'px-3 py-2 text-[15px] font-bold transition-all rounded-lg whitespace-nowrap',
    onHero
      ? 'text-white hover:text-ips-gold hover:bg-white/10'
      : 'text-ips-blue dark:text-white hover:text-ips-blue-light dark:hover:text-ips-gold hover:bg-ips-blue/5',
    location.pathname === href && (
      onHero
        ? 'text-ips-gold border-b-2 border-ips-gold rounded-none pb-1.5'
        : 'text-ips-blue dark:text-ips-gold bg-ips-gold/15'
    )
  )

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        onHero
          ? 'bg-[#0a2560]/95 backdrop-blur-md py-4 shadow-lg shadow-black/20'
          : scrolled
            ? 'glass py-3'
            : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-4 shadow-sm'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <img
            src="/build/logo.svg"
            alt="IPS Logo"
            className="h-10 w-10 object-contain transition-transform group-hover:scale-105"
          />
          <div className="hidden sm:block">
            <p className={cn(
              'text-xs font-bold tracking-widest leading-tight',
              onHero ? 'text-ips-gold' : 'text-ips-blue dark:text-ips-gold'
            )}>
              INDATWA
            </p>
            <p className={cn(
              'text-[10px] leading-tight',
              onHero ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'
            )}>
              Protocol & Services
            </p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5 flex-wrap justify-center">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href} className={navLinkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className={cn(
              'p-2 rounded-lg transition-colors',
              onHero ? 'text-white hover:bg-white/10' : 'text-ips-blue dark:text-ips-gold hover:bg-ips-gold/10'
            )}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {isAuthenticated && isClient ? (
            <Link to="/portal" className={cn(
              'hidden sm:flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg',
              onHero ? 'text-white hover:bg-white/10' : 'text-ips-blue hover:bg-ips-blue/5'
            )}>
              <LayoutDashboard size={16} /> Portal
            </Link>
          ) : isAuthenticated && isStaff ? (
            <Link to="/admin" className={cn(
              'hidden sm:flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg',
              onHero ? 'text-white hover:bg-white/10' : 'text-ips-blue hover:bg-ips-blue/5'
            )}>
              <LayoutDashboard size={16} /> Admin
            </Link>
          ) : (
            <Link
              to="/login"
              className={cn(
                'hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg border-2 transition-all duration-300',
                onHero
                  ? 'border-ips-gold text-ips-gold hover:bg-ips-gold hover:text-[#0a2560]'
                  : 'border-ips-gold text-ips-gold hover:bg-ips-gold hover:text-ips-blue'
              )}
            >
              <LogIn size={15} /> Admin Login
            </Link>
          )}

          <Link to="/request" className="hidden sm:block">
            <Button size="sm">Request Service</Button>
          </Link>

          <button
            className={cn('lg:hidden p-2 rounded-lg', onHero ? 'text-white' : 'text-slate-600 dark:text-slate-300')}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={cn(
            'lg:hidden border-t mt-3',
            onHero ? 'bg-[#0a2560] border-white/10' : 'glass'
          )}
        >
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(navLinkClass(link.href), 'px-4 py-3')}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && isClient ? (
              <Link to="/portal" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-base font-bold rounded-lg hover:bg-white/10 text-ips-gold flex items-center gap-2">
                <LayoutDashboard size={16} /> My Portal
              </Link>
            ) : isAuthenticated && isStaff ? (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-base font-bold rounded-lg hover:bg-white/10 text-ips-gold flex items-center gap-2">
                <LayoutDashboard size={16} /> Admin Console
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-base font-bold rounded-lg border-2 border-ips-gold text-ips-gold flex items-center gap-2"
              >
                <LogIn size={16} /> Admin Login
              </Link>
            )}
            {isAuthenticated && (
              <button onClick={() => { logout(); setMobileOpen(false) }} className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-white/10 flex items-center gap-2 text-left w-full text-white/80">
                <LogOut size={16} /> Logout
              </button>
            )}
            <Link to="/request" onClick={() => setMobileOpen(false)} className="mt-2">
              <Button className="w-full">Request Service</Button>
            </Link>
          </nav>
        </motion.div>
      )}
    </motion.header>
  )
}
