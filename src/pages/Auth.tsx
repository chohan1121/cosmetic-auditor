import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export default function Auth() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): string | null {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'メールアドレスの形式が正しくありません'
    if (password.length < 6) return 'パスワードは6文字以上で入力してください'
    return null
  }

  async function handleSignIn() {
    const err = validate()
    if (err) { toast.error(err); return }
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp() {
    const err = validate()
    if (err) { toast.error(err); return }
    setLoading(true)
    try {
      await signUp(email, password)
      toast.success('確認メールを送信しました。メールを確認してください。')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-emerald-400">Cosmetic Auditor</h1>
          <p className="mt-1 text-sm text-zinc-400">忖度なしの成分分析</p>
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
            <TabsTrigger value="signin">ログイン</TabsTrigger>
            <TabsTrigger value="signup">新規登録</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">メールアドレス</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">パスワード</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">メールアドレス</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">パスワード</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold"
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? '登録中...' : 'アカウントを作成'}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
