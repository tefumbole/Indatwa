import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  ClipboardList, LayoutDashboard, LogOut, Menu, MessageCircle, X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const nav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Requests', href: '/admin/requests', icon: ClipboardList },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-ips-blue text-white flex flex-col transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-3">
            <img src="/logo.svg" alt="IPS" className="h-9 w-9" />
            <div>
              <p className="font-bold text-sm tracking-wider">IPS ADMIN</p>
              <p className="text-[10px] text-white/60">Protocol & Services</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => {
            const active = location.pathname === item.href
              || (item.href !== '/admin' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/60 mb-2 truncate">{user?.name}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white w-full px-2 py-1"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b">
          <button onClick={() => setOpen(!open)} className="p-2">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="font-semibold text-ips-blue">IPS Admin</span>
          <MessageCircle size={22} className="opacity-0" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
