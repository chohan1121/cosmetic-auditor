export function ScanPage() {
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h1 className="text-xl font-bold">スキャン</h1>
      <p className="text-sm text-muted-foreground text-center">
        JANコードをスキャンするか、成分表の写真を撮ってください
      </p>
      {/* TODO: BarcodeScanner + OCRUploader コンポーネント */}
    </div>
  )
}
