const fs = require('fs')
const path = require('path')

const base = 'c:\\Users\\yuvra\\OneDrive\\Desktop\\photo sheet printer\\photo-sheet-printer'

function write(file, content) {
  fs.writeFileSync(path.join(base, file), content)
  console.log('wrote', file)
}

write('app/lib/processImage.ts', `export async function processImage(
  file: File,
  options: {
    whiteBackground: boolean
    bgTolerance: number
    cropRatio: '4:3' | '1:1' | '3:4' | 'free'
  }
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  ctx.drawImage(bitmap, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  let sumLuminance = 0
  const pixelCount = canvas.width * canvas.height
  for (let i = 0; i < data.length; i += 4) {
    sumLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  const avgLuminance = sumLuminance / pixelCount
  if (avgLuminance > 0 && avgLuminance !== 128) {
    const factor = 128 / avgLuminance
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] * factor))
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor))
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor))
    }
  }

  let minVal = 255
  let maxVal = 0
  for (let i = 0; i < data.length; i += 4) {
    const minC = Math.min(data[i], data[i + 1], data[i + 2])
    const maxC = Math.max(data[i], data[i + 1], data[i + 2])
    if (minC < minVal) minVal = minC
    if (maxC > maxVal) maxVal = maxC
  }
  if (maxVal > minVal) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = (data[i] - minVal) * 255 / (maxVal - minVal)
      data[i + 1] = (data[i + 1] - minVal) * 255 / (maxVal - minVal)
      data[i + 2] = (data[i + 2] - minVal) * 255 / (maxVal - minVal)
    }
  }

  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]
  const src = new Uint8ClampedArray(data)
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      let r = 0, g = 0, b = 0
      for (let cy = 0; cy < 3; cy++) {
        for (let cx = 0; cx < 3; cx++) {
          const srcOff = ((y + cy - 1) * canvas.width + (x + cx - 1)) * 4
          const wt = kernel[cy * 3 + cx]
          r += src[srcOff] * wt
          g += src[srcOff + 1] * wt
          b += src[srcOff + 2] * wt
        }
      }
      const dstOff = (y * canvas.width + x) * 4
      data[dstOff] = r
      data[dstOff + 1] = g
      data[dstOff + 2] = b
    }
  }
  ctx.putImageData(imageData, 0, 0)

  function findEdge(sx: number, sy: number, dx: number, dy: number, limit: number): number {
    let x = sx, y = sy
    while (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const idx = (y * canvas.width + x) * 4
      const isWhite = data[idx] > 240 && data[idx + 1] > 240 && data[idx + 2] > 240
      const isTransparent = data[idx + 3] < 20
      if (!isWhite && !isTransparent) return x + y * canvas.width
      x += dx; y += dy
      if (Math.abs(x - sx) > limit || Math.abs(y - sy) > limit) break
    }
    return sx + sy * canvas.width
  }

  const limit = Math.max(canvas.width, canvas.height)
  const topIdx = findEdge(0, 0, 0, 1, limit)
  const bottomIdx = findEdge(0, canvas.height - 1, 0, -1, limit)
  const leftIdx = findEdge(0, 0, 1, 0, limit)
  const rightIdx = findEdge(canvas.width - 1, 0, -1, 0, limit)

  const topY = Math.floor(topIdx / canvas.width)
  const bottomY = Math.floor(bottomIdx / canvas.width)
  const leftX = leftIdx % canvas.width
  const rightX = rightIdx % canvas.width
  const cropWidth = rightX - leftX
  const cropHeight = bottomY - topY

  if (cropWidth > 0 && cropHeight > 0) {
    const cropped = ctx.getImageData(leftX, topY, cropWidth, cropHeight)
    canvas.width = cropWidth
    canvas.height = cropHeight
    ctx.putImageData(cropped, 0, 0)
  }

  if (options.whiteBackground) {
    const ctx2 = canvas.getContext('2d')
    if (!ctx2) throw new Error('Canvas not supported')
    const imageData2 = ctx2.getImageData(0, 0, canvas.width, canvas.height)
    const d = imageData2.data
    const samples = []
    const sampleSize = 8
    const regions = [
      { x: 0, y: 0 },
      { x: canvas.width - sampleSize, y: 0 },
      { x: 0, y: canvas.height - sampleSize },
      { x: canvas.width - sampleSize, y: canvas.height - sampleSize }
    ]
    for (const region of regions) {
      let r = 0, g = 0, b = 0, count = 0
      for (let dy = 0; dy < sampleSize; dy++) {
        for (let dx = 0; dx < sampleSize; dx++) {
          const px = Math.min(region.x + dx, canvas.width - 1)
          const py = Math.min(region.y + dy, canvas.height - 1)
          const idx = (py * canvas.width + px) * 4
          r += d[idx]
          g += d[idx + 1]
          b += d[idx + 2]
          count++
        }
      }
      samples.push({ r: r / count, g: g / count, b: b / count })
    }
    const bgR = samples.reduce((s, p) => s + p.r, 0) / samples.length
    const bgG = samples.reduce((s, p) => s + p.g, 0) / samples.length
    const bgB = samples.reduce((s, p) => s + p.b, 0) / samples.length
    const tolerance = options.bgTolerance * 2.55
    for (let i = 0; i < d.length; i += 4) {
      const dr = d[i] - bgR
      const dg = d[i + 1] - bgG
      const db = d[i + 2] - bgB
      const distance = Math.sqrt(dr * dr + dg * dg + db * db)
      if (distance < tolerance) {
        d[i] = 255
        d[i + 1] = 255
        d[i + 2] = 255
        d[i + 3] = 255
      }
    }
    ctx2.putImageData(imageData2, 0, 0)
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}
`)

write('app/lib/generatePDF.ts', `import { jsPDF } from 'jspdf'

export async function generatePDF(
  images: { processedBase64: string; included: boolean; status: string }[],
  settings: {
    grid: string
    orientation: string
    marginMm: number
    spacingMm: number
  }
): Promise<void> {
  const selectedImages = images.filter((img) => img.included && img.status === 'ready')

  const orientation = settings.orientation === 'landscape' ? 'l' : 'p'
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation })

  const pageW = orientation === 'p' ? 210 : 297
  const pageH = orientation === 'p' ? 297 : 210

  const [cols, rows] = settings.grid.split('x').map(Number)
  const photosPerPage = cols * rows

  const cellW = (pageW - 2 * settings.marginMm - (cols - 1) * settings.spacingMm) / cols
  const cellH = (pageH - 2 * settings.marginMm - (rows - 1) * settings.spacingMm) / rows

  for (let i = 0; i < selectedImages.length; i++) {
    const pageIndex = Math.floor(i / photosPerPage)
    const posInPage = i % photosPerPage
    const col = posInPage % cols
    const row = Math.floor(posInPage / cols)

    if (posInPage === 0 && i > 0) {
      doc.addPage()
    }

    const x = settings.marginMm + col * (cellW + settings.spacingMm)
    const y = settings.marginMm + row * (cellH + settings.spacingMm)

    doc.addImage(selectedImages[i].processedBase64, 'JPEG', x, y, cellW, cellH)
  }

  doc.save('photo-sheet.pdf')
}
`)

write('app/lib/printPhotos.ts', `export function printPhotos(
  images: { processedBase64: string; included: boolean; status: string }[],
  settings: {
    grid: string
    orientation: string
    marginMm: number
    spacingMm: number
  }
): void {
  const selected = images.filter((img) => img.included && img.status === 'ready')

  const [cols, rows] = settings.grid.split('x').map(Number)
  const photosPerPage = cols * rows
  const orientation = settings.orientation === 'landscape' ? 'landscape' : 'portrait'

  let html = '<!DOCTYPE html><html><head><title>Print Photos</title>'
  html += '<style>'
  html += \`@page { size: A4 \${orientation}; margin: \${settings.marginMm}mm; }\`
  html += '* { margin: 0; padding: 0; box-sizing: border-box; }'
  html += 'body { display: flex; flex-wrap: wrap; }'
  html += \` .page { width: 100%; display: grid; grid-template-columns: repeat(\${cols}, 1fr); gap: \${settings.spacingMm}mm; }\`
  html += \` .page img { width: 100%; height: auto; aspect-ratio: 1 / 1; object-fit: cover; display: block; }\`
  if (orientation === 'landscape') {
    html += \` .page img { aspect-ratio: \${210 / 297}; }\`
  }
  html += '</style></head><body>'

  for (let i = 0; i < selected.length; i++) {
    if (i % photosPerPage === 0) {
      html += '<div class="page">'
    }
    html += \`<img src="\${selected[i].processedBase64}" />\`
    if ((i + 1) % photosPerPage === 0 || i === selected.length - 1) {
      html += '</div>'
    }
  }

  html += '</body></html>'

  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)
  iframe.contentDocument.write(html)
  iframe.contentDocument.close()
  setTimeout(() => {
    iframe.contentWindow.print()
    setTimeout(() => {
      if (iframe.contentDocument) document.body.removeChild(iframe)
    }, 2000)
  }, 500)
}
`)

write('app/store/usePhotoStore.ts', `import { create } from 'zustand'
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
  layoutSettings: {
    grid: '2x2',
    orientation: 'portrait',
    marginMm: 10,
    spacingMm: 5,
  },
  whiteBackground: false,
  bgTolerance: 40,
  currentPreviewPage: 1,
  toasts: [],

  addImages: async (files) => {
    const state = get()
    const remaining = 20 - state.images.length
    if (remaining <= 0) {
      state.addToast('Maximum 20 images reached', 'warning')
      return
    }
    const limited = files.slice(0, remaining)
    const newImages: ProcessedImage[] = limited.map((file) => ({
      id: Math.random().toString(36).slice(2),
      fileName: (file as any).name || 'image',
      originalFile: file,
      processedBase64: '',
      status: 'processing',
      included: true,
    }))
    set({ images: [...state.images, ...newImages] })
    for (const img of newImages) {
      try {
        const base64 = await processImage(img.originalFile, {
          whiteBackground: get().whiteBackground,
          bgTolerance: get().bgTolerance,
          cropRatio: 'free',
        })
        set((s) => ({
          images: s.images.map((i) => i.id === img.id ? { ...i, processedBase64: base64, status: 'ready' } : i),
        }))
        get().addToast(\`\${img.fileName} processed\`, 'success')
      } catch {
        set((s) => ({
          images: s.images.map((i) => i.id === img.id ? { ...i, status: 'error', error: 'Failed' } : i),
        }))
        get().addToast(\`Error processing \${img.fileName}\`, 'error')
      }
    }
  },

  removeImage: (id) => {
    set((s) => ({ images: s.images.filter((i) => i.id !== id) }))
    get().addToast('Image removed', 'success')
  },

  toggleIncluded: (id) => {
    set((s) => ({
      images: s.images.map((i) => i.id === id ? { ...i, included: !i.included } : i),
    }))
  },

  reorderImages: (oldIndex, newIndex) => {
    set((s) => {
      const arr = [...s.images]
      const [item] = arr.splice(oldIndex, 1)
      arr.splice(newIndex, 0, item)
      return { images: arr }
    })
  },

  clearAll: () => {
    set({ images: [], currentPreviewPage: 1 })
    get().addToast('All images cleared', 'success')
  },

  setLayoutSettings: (s) => {
    set((state) => ({
      layoutSettings: { ...state.layoutSettings, ...s },
      currentPreviewPage: 1,
    }))
  },

  setWhiteBackground: (v) => {
    set({ whiteBackground: v })
    if (v) get().reprocessAll()
  },

  setBgTolerance: (v) => {
    set({ bgTolerance: v })
    if (get().whiteBackground) get().reprocessAll()
  },

  setCurrentPreviewPage: (n) => set({ currentPreviewPage: n }),

  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().removeToast(id), 3000)
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  reprocessAll: async () => {
    const { whiteBackground, bgTolerance, images } = get()
    const ready = images.filter((i) => i.status === 'ready')
    for (const img of ready) {
      try {
        const base64 = await processImage(img.originalFile, { whiteBackground, bgTolerance, cropRatio: 'free' })
        set((s) => ({
          images: s.images.map((i) => i.id === img.id ? { ...i, processedBase64: base64 } : i),
        }))
      } catch {
        // keep
      }
    }
  },
}))
`)

write('app/components/Header.tsx', `'use client'
import { usePhotoStore } from '../store/usePhotoStore'
import { useGeneratePDF } from '../store/usePhotoStore'
import { usePrintPhotos } from '../store/usePhotoStore'

export default function Header() {
  const images = usePhotoStore((s) => s.images)
  const hasImages = images.length > 0
  const generatePDF = useGeneratePDF()
  const handlePrint = usePrintPhotos()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-900">📸 Photo Sheet Printer</h1>
      {hasImages && (
        <div className="flex gap-2">
          <button
            onClick={generatePDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            ⬇ Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            🖨 Print
          </button>
        </div>
      )}
    </header>
  )
}
`)