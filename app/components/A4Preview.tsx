'use client'
import { usePhotoStore } from '../store/usePhotoStore'

export default function A4Preview() {
  const images = usePhotoStore(s => s.images)
  const layoutSettings = usePhotoStore(s => s.layoutSettings)
  const currentPage = usePhotoStore(s => s.currentPreviewPage)
  const setCurrentPage = usePhotoStore(s => s.setCurrentPreviewPage)

  const selected = images.filter(i => i.included && i.status === 'ready')
  const { grid, orientation } = layoutSettings
  const [cols, rows] = grid.split('x').map(Number)
  const photosPerPage = cols * rows
  const totalPages = Math.ceil(selected.length / photosPerPage) || 1

  if (selected.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
        <p className="text-gray-400 text-lg">Upload photos to see preview</p>
      </div>
    )
  }

  const pageImages = selected.slice((currentPage - 1) * photosPerPage, currentPage * photosPerPage)

  const a4W = 210, a4H = 297
  const previewWidth = Math.min(480, a4W * 1.5)
  const scale = previewWidth / a4W

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200" style={{ width: previewWidth }}>
        <div className="flex flex-wrap gap-1" style={{ aspectRatio: orientation === 'landscape' ? `${a4H}/${a4W}` : '1', height: previewWidth / (orientation === 'landscape' ? a4H/a4W : 1) }}>
          {pageImages.map((img, i) => (
            <div key={img.id} className="relative overflow-hidden bg-gray-100" style={{ flex: `0 0 calc(${100/cols}% - ${(cols-1)*layoutSettings.spacingMm/210*100}%)`, marginBottom: `${layoutSettings.spacingMm}px`, marginRight: i % cols !== cols - 1 ? `${layoutSettings.spacingMm}px` : '0' }}>
              <img src={img.processedBase64} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50">← Prev</button>
        <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50">Next →</button>
      </div>
    </div>
  )
}