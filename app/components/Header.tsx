'use client'
import { usePhotoStore } from '../store/usePhotoStore'
import { useGeneratePDF } from '../store/usePhotoStore'
import { usePrintPhotos } from '../store/usePhotoStore'

export default function Header() {
  const images = usePhotoStore(s => s.images)
  const hasImages = images.length > 0
  const generatePDF = useGeneratePDF()
  const handlePrint = usePrintPhotos()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-900">📸 Photo Sheet Printer</h1>
      {hasImages && (
        <div className="flex gap-2">
          <button onClick={generatePDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">⬇ Download PDF</button>
          <button onClick={handlePrint} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">🖨 Print</button>
        </div>
      )}
    </header>
  )
}