const fs = require('fs')
const p2 = `
export default function Sidebar() {
  const images = usePhotoStore(s => s.images)
  const removeImage = usePhotoStore(s => s.removeImage)
  const toggleIncluded = usePhotoStore(s => s.toggleIncluded)
  const reorderImages = usePhotoStore(s => s.reorderImages)
  const clearAll = usePhotoStore(s => s.clearAll)
  const updateImageCrop = usePhotoStore(s => s.updateImageCrop)
  const whiteBackground = usePhotoStore(s => s.whiteBackground)
  const bgTolerance = usePhotoStore(s => s.bgTolerance)
  const setWhiteBackground = usePhotoStore(s => s.setWhiteBackground)
  const setBgTolerance = usePhotoStore(s => s.setBgTolerance)
  const generatePDF = useGeneratePDF()
  const handlePrint = usePrintPhotos()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cropImageId, setCropImageId] = useState<string | null>(null)
  const cropImage = images.find(img => img.id === cropImageId)

  return (
    <>
      <button onClick={() => setMobileOpen(v => !v)} className="fixed bottom-4 right-4 z-50 md:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg">{mobileOpen ? '✕' : '☰'}</button>
      <aside className={\`fixed right-0 top-0 h-screen w-[280px] bg-slate-800 text-slate-100 flex flex-col transition-transform duration-200 z-40 \${mobileOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:static\`} style={{ top: mobileOpen ? 0 : undefined }}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-lg">Images ({images.length}/20)</h2>
          {images.length > 0 && <button onClick={clearAll} className="text-xs bg-red-600 text-white px-2 py-1 rounded">Clear All</button>}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {images.map(img => (
            <SortableItem key={img.id} id={img.id} fileName={img.fileName} status={img.status} included={img.included} onRemove={() => removeImage(img.id)} onToggle={() => toggleIncluded(img.id)} onCrop={() => setCropImageId(img.id)} />
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
      {cropImage && (
        <CropModal
          image={cropImage}
          onSave={(croppedBase64) => { updateImageCrop(cropImage.id, croppedBase64); setCropImageId(null) }}
          onClose={() => setCropImageId(null)}
        />
      )}
    </>
  )
}
`
fs.appendFileSync('app/components/Sidebar.tsx', p2)
console.log('part2 done')