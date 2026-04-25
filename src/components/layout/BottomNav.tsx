import { NavLink } from 'react-router-dom'
import { ScanLine, ShoppingBag, CloudSun, BarChart2, Shirt } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/',        icon: ScanLine,    label: 'スキャン' },
  { to: '/closet',  icon: Shirt,       label: 'クローゼット' },
  { to: '/weather', icon: CloudSun,    label: '気候' },
  { to: '/generic', icon: ShoppingBag, label: 'ジェネリック' },
  { to: '/audit',   icon: BarChart2,   label: 'コスパ' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
