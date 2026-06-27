export interface ProcessedImage {
  id: string
  fileName: string
  originalFile: File
  processedBase64: string
  status: 'processing' | 'ready' | 'error'
  included: boolean
  error?: string
}

export interface LayoutSettings {
  grid: '1x1' | '2x2' | '2x3' | '3x4'
  orientation: 'portrait' | 'landscape'
  marginMm: number
  spacingMm: number
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning'
}