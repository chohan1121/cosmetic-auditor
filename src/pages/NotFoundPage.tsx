import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <p className="text-muted-foreground">ページが見つかりませんでした</p>
      <Link to="/" className="text-primary underline underline-offset-4">
        スキャン画面に戻る
      </Link>
    </div>
  )
}
