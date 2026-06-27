'use client'
import { useState } from 'react'
import { usePhotoStore } from '../store/usePhotoStore'
import { useGeneratePDF } from '../store/usePhotoStore'
import { usePrintPhotos } from '../store/usePhotoStore'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableItem({ id, fileName, status, included, onRemove, onToggle }: { id: string, fileName: string, status: string, included: boolean, onRemove: () => void, onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style: any = { transform: CSS.Transform.toString(transform), transition }
  const img = usePhotoStore.getState().images.find(i => i.id === id)
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg mb-2 cursor-move">
      {status === 'processing' ? <div className="w-14 h-14 bg-gray-600 rounded flex items-center justify-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>
        : <div className={`w-14 h-14 rounded overflow-hidden ${status === 'error' ? 'border-2 border-red-500' : ''}`}><img src={img?.processedBase64 || ''} alt="" className="w-full h-full object-cover" /></div>}
      <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{fileName}</p>
        <div className="flex items-center gap-2 mt-1">
          <button onClick={onToggle} className={`text-xs px-2 py-1 rounded ${included ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>{included ? '✅' : '⬜'}</button>
          <span className={`text-xs ${status === 'ready' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>{status === 'ready' ? 'Ready' : status === 'error' ? 'Error' : 'Processing...'}</span>
        </div>
      </div>
      <button onClick={onRemove} className="text-red-400 hover:text-red-300 p-1">🗑️</button>
    </div>
  )
}

export default function Sidebar() {
  const images = usePhotoStore(s => s.images)
  const removeImage = usePhotoStore(s => s.removeImage)
  const toggleIncluded = usePhotoStore(s => s.toggleIncluded)
  const reorderImages = usePhotoStore(s => s.reorderImages)
  const clearAll = usePhotoStore(s => s.clearAll)
  const whiteBackground = usePhotoStore(s => s.whiteBackground)
  const bgTolerance = usePhotoStore(s => s.bgTolerance)
  const setWhiteBackground = usePhotoStore(s => s.setWhiteBackground)
  const setBgTolerance = usePhotoStore(s => s.setBgTolerance)
  const generatePDF = useGeneratePDF()
  const handlePrint = usePrintPhotos()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button onClick={() => setMobileOpen(v => !v)} className="fixed bottom-4 right-4 z-50 md:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg">{mobileOpen ? '✕' : '☰'}</button>
      <aside className={`fixed right-0 top-0 h-screen w-[280px] bg-slate-800 text-slate-100 flex flex-col transition-transform duration-200 z-40 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:static`} style={{ top: mobileOpen ? 0 : undefined }}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-lg">Images ({images.length}/20)</h2>
          {images.length > 0 && <button onClick={clearAll} className="text-xs bg-red-600 text-white px-2 py-1 rounded">Clear All</button>}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {images.map(img => (
            <SortableItem key={img.id} id={img.id} fileName={img.fileName} status={img.status} included={img.included} onRemove={() => removeImage(img.id)} onToggle={() => toggleIncluded(img.id)} />
          ))}
        </div>
        <div className="p-4 border-t border-gray-700 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={whiteBackground} onChange={(e) => setWhiteBackground(e.target.checked)} className="w-4 h-4" />
              ⬜ Make Background White
            </label>
          </div>
          {whiteBackground && <div>
            <label className="text-xs text-gray-400">Tolerance: {bgTolerance}</label>
            <input type="range" min={0} max={100} step={1} value={bgTolerance} onChange={(e) => setBgTolerance(Number(e.target.value))} className="w-full mt-1" />
          </div>}
          <button onClick={generatePDF} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">Generate PDF</button>
          <button onClick={handlePrint} className="w-full border border-white text-white py-2 rounded-lg hover:bg-white hover:text-slate-900 transition-colors font-medium">Print</button>
        </div>
      </aside>
    </>
  )
}