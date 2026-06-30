import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  CalendarDays, CheckSquare, ClipboardList, CreditCard, LayoutDashboard, LogOut, Megaphone, Menu, Settings, Shield, Users, X,
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
      { label: 'Booking Calendar', href: '/admin/bookings', icon: CalendarDays },
      { label: 'Task Management', href: '/admin/tasks', icon: CheckSquare },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'System Settings', href: '/admin/settings', icon: Settings },
      { label: 'Manage Users', href: '/admin/users', icon: Users },
      { label: 'Roles & Permissions', href: '/admin/roles', icon: Shield },
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
    <div className="admin-console min-h-screen bg-slate-100 flex">
      <aside className={cn(
        'admin-sidebar fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#0a2560] text-white flex flex-col transition-transform lg:translate-x-0 shadow-xl',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b border-white/15">
          <Link to="/admin" className="block" onClick={() => setOpen(false)}>
            <p className="text-ips-gold font-bold text-xl leading-tight">Indatwa</p>
            <p className="text-white font-bold text-sm tracking-wide mt-0.5">PROTOCOL & SERVICES</p>
            <p className="text-[10px] text-white/60 mt-1 uppercase tracking-widest">Admin Console</p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 px-3 mb-2">
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
                        'admin-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                        active
                          ? 'bg-ips-gold text-[#0a2560] shadow-md'
                          : 'text-white hover:bg-white/15'
                      )}
                    >
                      <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/15">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-ips-gold text-[#0a2560] flex items-center justify-center font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/90 text-white capitalize">
                {primaryRole}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="admin-nav-link flex items-center gap-2 text-sm text-white/80 hover:text-white w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
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
