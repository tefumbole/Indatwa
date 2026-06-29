import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  CheckSquare, ClipboardList, LayoutDashboard, LogOut, Menu, Settings, Users, X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const NAV_GROUPS = [
  {
    label: 'Dashboard',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Service Requests', href: '/admin/requests', icon: ClipboardList },
      { label: 'Task Management', href: '/admin/tasks', icon: CheckSquare },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Manage Users', href: '/admin/users', icon: Users },
      { label: 'Settings', href: '/admin', icon: Settings },
    ],
  },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location.pathname === href
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'A'
  const primaryRole = user?.roles?.[0]?.replace(/_/g, ' ') || 'Staff'

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-40 w-72 bg-ips-blue text-white flex flex-col transition-transform lg:translate-x-0 shadow-xl',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b border-white/10">
          <Link to="/admin" className="block" onClick={() => setOpen(false)}>
            <p className="text-ips-gold font-bold text-lg leading-tight">Indatwa</p>
            <p className="text-white font-semibold text-sm tracking-wide">PROTOCOL & SERVICES</p>
            <p className="text-[10px] text-white/50 mt-1 uppercase tracking-widest">Admin Console</p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href, 'exact' in item ? item.exact : false)
                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                        active
                          ? 'bg-ips-gold text-ips-blue shadow-lg shadow-black/10'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-ips-gold text-ips-blue flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] text-ips-gold capitalize">{primaryRole}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b shadow-sm">
          <button onClick={() => setOpen(!open)} className="p-2 text-ips-blue">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="font-bold text-ips-blue">IPS Admin</span>
          <div className="w-8" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
