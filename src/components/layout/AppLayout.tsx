import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Camera, Package, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const navItems = [
  { to: '/',       icon: Home,    label: 'ホーム',       end: true },
  { to: '/scan',   icon: Camera,  label: 'スキャン',     end: false },
  { to: '/closet', icon: Package, label: 'クローゼット', end: false },
  { to: '/profile',icon: User,    label: 'プロフィール', end: false },
]

export function AppLayout() {
  const { signOut } = useAuthStore()
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/auth')
    } catch {
      toast.error('ログアウトに失敗しました')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800 px-4">
        <span className="font-bold text-emerald-400">Cosmetic Auditor</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          aria-label="ログアウト"
        >
          <LogOut className="h-4 w-4" />
          <span>ログアウト</span>
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 z-50 flex h-16 w-full max-w-[480px] -translate-x-1/2 items-center justify-around border-t border-zinc-800 bg-zinc-950">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors',
                isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300',
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
