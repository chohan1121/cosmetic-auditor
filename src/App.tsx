import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/authStore'
import { router } from '@/routes'

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <p className="text-2xl font-bold text-emerald-400">Cosmetic Auditor</p>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    </div>
  )
}

export default function App() {
  const { initialize, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) return <Splash />

  return (
    <>
      <RouterProvider router={router} />
      <Toaster theme="dark" position="top-center" />
    </>
  )
}
