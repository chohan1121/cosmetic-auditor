import { useParams } from 'react-router-dom'

export function ProductPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">成分分析</h1>
      <p className="text-sm text-muted-foreground">Product ID: {id}</p>
      {/* TODO: IngredientList, SafetyScore, SynergyCheck */}
    </div>
  )
}
