const fs = require('fs')
const part1 = `'use client'
import { useState, useRef, useEffect } from 'react'

export interface CropModalProps {
  image: { processedBase64: string; fileName: string }
  onSave: (croppedBase64: string) => void
  onClose: () => void
}

export default function CropModal({ image, onSave, onClose }: CropModalProps) {
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 50, h: 50 })
  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '4:3' | '3:4' | '16:9'>('free')
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const getRelativePos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? (e as any).touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? (e as any).touches[0].clientY : (e as React.MouseEvent).clientY
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getRelativePos(e)
    setIsDragging(true)
    setDragStart(pos)
    setCropBox({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const pos = getRelativePos(e)
    let newW = pos.x - dragStart.x
    let newH = pos.y - dragStart.y
    let newX = dragStart.x
    let newY = dragStart.y

    if (newW < 0) { newX = pos.x; newW = Math.abs(newW) }
    if (newH < 0) { newY = pos.y; newH = Math.abs(newH) }

    if (aspectRatio === '1:1') newH = newW
    else if (aspectRatio === '4:3') newH = newW * 3 / 4
    else if (aspectRatio === '3:4') newH = newW * 4 / 3
    else if (aspectRatio === '16:9') newH = newW * 9 / 16

    setCropBox({ x: newX, y: newY, w: newW, h: newH })
  }

  const handleMouseUp = () => { setIsDragging(false) }

  const handleApply = () => {
    if (!imgRef.current) return
    const img = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
`
fs.writeFileSync('app/components/CropModal.tsx', part1)