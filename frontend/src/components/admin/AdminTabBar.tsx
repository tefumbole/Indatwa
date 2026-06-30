import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface AdminTab {
  label: string
  href?: string
  icon?: LucideIcon
  active?: boolean
  onClick?: () => void
  color?: 'blue' | 'gold' | 'purple' | 'green' | 'orange' | 'pink' | 'teal' | 'red' | 'lime'
}

const OUTLINE_COLORS: Record<string, string> = {
  gold: 'border-amber-400 text-amber-800 bg-white hover:bg-amber-50',
  purple: 'border-purple-500 text-purple-700 bg-white hover:bg-purple-50',
  green: 'border-emerald-500 text-emerald-700 bg-white hover:bg-emerald-50',
  orange: 'border-orange-500 text-orange-700 bg-white hover:bg-orange-50',
  pink: 'border-pink-500 text-pink-700 bg-white hover:bg-pink-50',
  teal: 'border-teal-500 text-teal-700 bg-white hover:bg-teal-50',
  blue: 'border-ips-blue text-ips-blue bg-white hover:bg-blue-50',
  red: 'border-red-500 text-red-700 bg-white hover:bg-red-50',
  lime: 'border-lime-500 text-lime-800 bg-white hover:bg-lime-50',
}

interface AdminTabBarProps {
  section?: string
  tabs: AdminTab[]
  className?: string
}

export function AdminTabBar({ section, tabs, className }: AdminTabBarProps) {
  return (
    <div className={cn('mb-6', className)}>
      {section && (
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">{section}</p>
      )}
      <div className="flex flex-wrap gap-2.5">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const base = cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2 shadow-sm',
            tab.active
              ? 'bg-ips-blue text-white border-ips-blue shadow-md shadow-ips-blue/25'
              : OUTLINE_COLORS[tab.color ?? 'gold']
          )

          if (tab.href) {
            return (
              <Link key={tab.label} to={tab.href} className={base}>
                {Icon && <Icon size={17} strokeWidth={2.5} />}
                {tab.label}
              </Link>
            )
          }

          return (
            <button key={tab.label} type="button" onClick={tab.onClick} className={base}>
              {Icon && <Icon size={17} strokeWidth={2.5} />}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
