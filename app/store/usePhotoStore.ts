import { create } from 'zustand'
import { ProcessedImage, LayoutSettings, Toast } from '../types'
import { processImage } from '../lib/processImage'
import { generatePDF } from '../lib/generatePDF'
import { printPhotos } from '../lib/printPhotos'

interface PhotoStore {
  images: ProcessedImage[]
  layoutSettings: LayoutSettings
  whiteBackground: boolean
  bgTolerance: number
  currentPreviewPage: number
  toasts: Toast[]
  addImages: (files: File[]) => Promise<void>
  removeImage: (id: string) => void
  toggleIncluded: (id: string) => void
  reorderImages: (oldIndex: number, newIndex: number) => void
  clearAll: () => void
  updateImageCrop: (id: string, croppedBase64: string) => void
  setLayoutSettings: (s: Partial<LayoutSettings>) => void
  setWhiteBackground: (v: boolean) => void
  setBgTolerance: (v: number) => void
  setCurrentPreviewPage: (n: number) => void
  addToast: (message: string, type: 'success' | 'error' | 'warning') => void
  removeToast: (id: string) => void
  reprocessAll: () => Promise<void>
}

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  images: [],
  layoutSettings: { grid: '2x2', orientation: 'portrait', marginMm: 10, spacingMm: 5 },
  whiteBackground: false, bgTolerance: 40, currentPreviewPage: 1, toasts: [],
  addImages: async (files) => {
    const rem = 20 - get().images.length
    if (rem <= 0) { get().addToast('Maximum 20 images reached', 'warning'); return }
    const toAdd = files.slice(0, rem)
    const newImgs: ProcessedImage[] = toAdd.map(f => ({
      id: Math.random().toString(36).slice(2),
      fileName: (f as any).name,
      originalFile: f,
      processedBase64: '',
      status: 'processing',
      included: true,
    }))
    set(s => ({ images: [...s.images, ...newImgs] }))
    for (const img of newImgs) {
      try {
        const b64 = await processImage(img.originalFile, { whiteBackground: get().whiteBackground, bgTolerance: get().bgTolerance })
        set(s => ({ images: s.images.map(i => i.id === img.id ? { ...i, processedBase64: b64, status: 'ready' } : i) }))
        get().addToast(img.fileName + ' processed', 'success')
      } catch {
        set(s => ({ images: s.images.map(i => i.id === img.id ? { ...i, status: 'error', error: 'Failed' } : i) }))
        get().addToast('Error processing ' + img.fileName, 'error')
      }
    }
  },
  removeImage: (id) => { set(s => ({ images: s.images.filter(i => i.id !== id) })); get().addToast('Image removed', 'success') },
  toggleIncluded: (id) => set(s => ({ images: s.images.map(i => i.id === id ? { ...i, included: !i.included } : i) })),
  reorderImages: (oldIndex, newIndex) => set(s => { const a = [...s.images]; const [m] = a.splice(oldIndex, 1); a.splice(newIndex, 0, m); return { images: a } }),
  clearAll: () => { set({ images: [], currentPreviewPage: 1 }); get().addToast('All images cleared', 'success') },
  updateImageCrop: (id, croppedBase64) => set(s => ({ images: s.images.map(img => img.id === id ? { ...img, croppedBase64 } : img) })),
  setLayoutSettings: (s) => set(state => ({ layoutSettings: { ...state.layoutSettings, ...s }, currentPreviewPage: 1 })),
  setWhiteBackground: (v) => { set({ whiteBackground: v }); if (v) get().reprocessAll() },
  setBgTolerance: (v) => { set({ bgTolerance: v }); if (get().whiteBackground) get().reprocessAll() },
  setCurrentPreviewPage: (n) => set({ currentPreviewPage: n }),
  addToast: (message, type) => { const id = Math.random().toString(36).slice(2); set(s => ({ toasts: [...s.toasts, { id, message, type }] })); setTimeout(() => get().removeToast(id), 3000) },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  reprocessAll: async () => { const { whiteBackground, bgTolerance, images } = get(); for (const img of images.filter(i => i.status === 'ready')) { try { const b64 = await processImage(img.originalFile, { whiteBackground, bgTolerance }); set(s => ({ images: s.images.map(i => i.id === img.id ? { ...i, processedBase64: b64 } : i) })); } catch {} } }
}))

export function useGeneratePDF() {
  const images = usePhotoStore(s => s.images)
  const layoutSettings = usePhotoStore(s => s.layoutSettings)
  return async () => {
    const sel = images.filter(i => i.included && i.status === 'ready')
    if (!sel.length) return
    await generatePDF(sel, layoutSettings)
    usePhotoStore.getState().addToast('PDF downloaded successfully', 'success')
  }
}

export function usePrintPhotos() {
  const images = usePhotoStore(s => s.images)
  const layoutSettings = usePhotoStore(s => s.layoutSettings)
  return () => {
    const sel = images.filter(i => i.included && i.status === 'ready')
    if (!sel.length) return
    printPhotos(sel, layoutSettings)
    usePhotoStore.getState().addToast('Print dialog opened', 'success')
  }
}