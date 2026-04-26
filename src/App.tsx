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
  const { initialize, loading, initError } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) return <Splash />

  if (initError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-sm space-y-3 rounded-lg border border-red-800 bg-zinc-900 p-4">
          <p className="font-bold text-red-400">初期化エラー</p>
          <p className="break-all font-mono text-xs text-zinc-300">{initError}</p>
          <button
            onClick={() => initialize()}
            className="w-full rounded bg-zinc-700 py-2 text-sm text-zinc-100 hover:bg-zinc-600"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster theme="dark" position="top-center" />
    </>
  )
}
