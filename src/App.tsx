import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ScanPage } from '@/pages/ScanPage'
import { ProductPage } from '@/pages/ProductPage'
import { GenericPage } from '@/pages/GenericPage'
import { ClosetPage } from '@/pages/ClosetPage'
import { WeatherPage } from '@/pages/WeatherPage'
import { AuditPage } from '@/pages/AuditPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ScanPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="generic" element={<GenericPage />} />
          <Route path="generic/:productId" element={<GenericPage />} />
          <Route path="closet" element={<ClosetPage />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="audit/:productId" element={<AuditPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
