'use client'
import { useRef, useState, useEffect } from 'react'
import { usePhotoStore } from '../store/usePhotoStore'

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const A4_RATIO = A4_HEIGHT_MM / A4_WIDTH_MM

export default function A4Preview() {
  const images = usePhotoStore(s => s.images)
  const layoutSettings = usePhotoStore(s => s.layoutSettings)
  const currentPage = usePhotoStore(s => s.currentPreviewPage)
  const setCurrentPage = usePhotoStore(s => s.setCurrentPreviewPage)
  const containerRef = useRef<HTMLDivElement>(null)
  const [displayWidth, setDisplayWidth] = useState(480)

  const selected = images.filter(i => i.included && i.status === 'ready')
  const { grid, orientation, marginMm, spacingMm } = layoutSettings
  const [cols, rows] = grid.split('x').map(Number)
  const photosPerPage = cols * rows
  const totalPages = Math.ceil(selected.length / photosPerPage) || 1

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const available = containerRef.current.offsetWidth - 48
        setDisplayWidth(Math.min(available, 520))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const displayHeight = displayWidth * A4_RATIO

  if (selected.length === 0) {
    return (
      <div ref={containerRef} className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
        <p className="text-gray-400 text-lg">Upload photos to see preview</p>
      </div>
    )
  }

  const pageImages = selected.slice((currentPage - 1) * photosPerPage, currentPage * photosPerPage)

  const marginPct = (marginMm / A4_WIDTH_MM) * 100
  const spacingXPct = (spacingMm / A4_WIDTH_MM) * 100
  const spacingYPct = (spacingMm / A4_HEIGHT_MM) * 100
  const cellWPct = (100 - 2 * marginPct - (cols - 1) * spacingXPct) / cols
  const cellHPct = (100 - 2 * (marginMm / A4_HEIGHT_MM * 100) - (rows - 1) * spacingYPct) / rows

  return (
    <div className="flex flex-col items-center">
      <div ref={containerRef} style={{ width: '100%' }}>
        <div style={{
          width: displayWidth,
          height: displayHeight,
          background: 'white',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {pageImages.map((img, i) => {
            const col = i % cols
            const row = Math.floor(i / cols)
            const left = marginPct + col * (cellWPct + spacingXPct)
            const top = (marginMm / A4_HEIGHT_MM * 100) + row * (cellHPct + spacingYPct)
            return (
              <div key={img.id} style={{
                position: 'absolute',
                left: left + '%',
                top: top + '%',
                width: cellWPct + '%',
                height: cellHPct + '%',
                overflow: 'hidden',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '0.5px solid #e5e7eb',
                boxSizing: 'border-box',
              }}>
                <img
                  src={img.croppedBase64 || img.processedBase64}
                  alt=""
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
            )
          })}
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