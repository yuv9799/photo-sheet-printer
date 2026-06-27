'use client'
import { usePhotoStore } from '../store/usePhotoStore'

const GRIDS = ['1x1', '2x2', '2x3', '3x4'] as const
type Grid = typeof GRIDS[number]

export default function LayoutControls() {
  const layoutSettings = usePhotoStore(s => s.layoutSettings)
  const setLayoutSettings = usePhotoStore(s => s.setLayoutSettings)
  const images = usePhotoStore(s => s.images)
  const { grid, orientation, marginMm, spacingMm } = layoutSettings

  const selected = images.filter(i => i.included && i.status === 'ready')
  const [cols, rows] = grid.split('x').map(Number)
  const photosPerPage = cols * rows
  const totalPages = Math.ceil(selected.length / photosPerPage) || 1

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Layout</label>
          <div className="flex gap-2">
            {GRIDS.map(g => {
              const [c, r] = g.split('x').map(Number)
              return (
                <button key={g} onClick={() => setLayoutSettings({ grid: g as Grid })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${grid === g ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {g} <span className="text-[10px] opacity-75">({c*r})</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Orientation</label>
          <div className="flex gap-2">
            {(['portrait', 'landscape'] as const).map(o => (
              <button key={o} onClick={() => setLayoutSettings({ orientation: o })}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${orientation === o ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {o === 'portrait' ? 'Portrait' : 'Landscape'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Margin: {marginMm}mm</label>
          <input type="range" min={5} max={25} step={1} value={marginMm} onChange={(e) => setLayoutSettings({ marginMm: Number(e.target.value) })} className="w-32" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Spacing: {spacingMm}mm</label>
          <input type="range" min={2} max={15} step={1} value={spacingMm} onChange={(e) => setLayoutSettings({ spacingMm: Number(e.target.value) })} className="w-32" />
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3">📄 {selected.length} photos → {totalPages} page{totalPages !== 1 ? 's' : ''}</p>
    </div>
  )
}