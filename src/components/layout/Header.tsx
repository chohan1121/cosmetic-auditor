import { Link } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <FlaskConical className="h-5 w-5 text-primary" />
          <span>Cosmetic Auditor</span>
        </Link>
      </div>
    </header>
  )
}
