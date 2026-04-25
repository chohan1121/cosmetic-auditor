import { useParams } from 'react-router-dom'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">成分分析</h1>
      <p className="mt-2 text-zinc-400">製品 {id} の成分・安全性・コスパ評価を表示します</p>
    </div>
  )
}
