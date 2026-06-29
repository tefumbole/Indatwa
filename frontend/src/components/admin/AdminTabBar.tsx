import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface AdminTab {
  label: string
  href?: string
  icon?: LucideIcon
  active?: boolean
  onClick?: () => void
  color?: 'blue' | 'gold' | 'purple' | 'green' | 'orange' | 'pink' | 'teal'
}

const OUTLINE_COLORS: Record<string, string> = {
  gold: 'border-ips-gold text-ips-gold-dark hover:bg-ips-gold/10',
  purple: 'border-purple-500 text-purple-600 hover:bg-purple-50',
  green: 'border-emerald-500 text-emerald-600 hover:bg-emerald-50',
  orange: 'border-orange-500 text-orange-600 hover:bg-orange-50',
  pink: 'border-pink-500 text-pink-600 hover:bg-pink-50',
  teal: 'border-teal-500 text-teal-600 hover:bg-teal-50',
  blue: 'border-ips-blue text-ips-blue hover:bg-ips-blue/5',
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
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">{section}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const base = cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
            tab.active
              ? 'bg-ips-blue text-white shadow-md shadow-ips-blue/20'
              : cn('bg-white border-2', OUTLINE_COLORS[tab.color ?? 'gold'])
          )

          if (tab.href) {
            return (
              <Link key={tab.label} to={tab.href} className={base}>
                {Icon && <Icon size={16} />}
                {tab.label}
              </Link>
            )
          }

          return (
            <button key={tab.label} type="button" onClick={tab.onClick} className={base}>
              {Icon && <Icon size={16} />}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
