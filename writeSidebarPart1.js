const fs = require('fs')
const p1 = `'use client'
import { useState } from 'react'
import { usePhotoStore } from '../store/usePhotoStore'
import { useGeneratePDF } from '../store/usePhotoStore'
import { usePrintPhotos } from '../store/usePhotoStore'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CropModal, { type CropModalProps } from './CropModal'

function SortableItem({ id, fileName, status, included, onRemove, onToggle, onCrop }: {
  id: string, fileName: string, status: string, included: boolean, onRemove: () => void, onToggle: () => void, onCrop: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style: any = { transform: CSS.Transform.toString(transform), transition }
  const img = usePhotoStore.getState().images.find(i => i.id === id)
  return (
    <div ref={setNodeRef} style={{ ...style, display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#263548', borderRadius: 8, marginBottom: 8, cursor: 'move' }} {...attributes} {...listeners}>
      <div style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#374151' }}>
        <img src={img?.croppedBase64 || img?.processedBase64 || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#F1F5F9', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{fileName}</div>
        <div style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: status === 'ready' ? '#10B981' : status === 'error' ? '#EF4444' : '#F59E0B', color: 'white', marginBottom: 6 }}>
          {status === 'ready' ? '✓ Ready' : status === 'error' ? '✗ Error' : '⟳ Processing'}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={onCrop} style={{ background: '#374151', border: 'none', borderRadius: 4, color: '#93C5FD', padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>✂️ Crop</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#94A3B8', fontSize: 11 }}>
            <input type="checkbox" checked={included} onChange={onToggle} style={{ accentColor: '#2563EB' }} /> Include
          </label>
          <button onClick={onRemove} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 16, padding: '2px 4px' }}>🗑️</button>
        </div>
      </div>
    </div>
  )
}
`
fs.writeFileSync('app/components/Sidebar.tsx', p1)
console.log('part1 done')