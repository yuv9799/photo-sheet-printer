'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { usePhotoStore } from '../store/usePhotoStore'

export default function UploadZone() {
  const [processing, setProcessing] = useState(false)
  const addImages = usePhotoStore(s => s.addImages)
  const images = usePhotoStore(s => s.images)

  const onDrop = useCallback(async (files: File[]) => {
    setProcessing(true)
    await addImages(files)
    setProcessing(false)
  }, [addImages])

  const { getRootProps, getInputProps, isDragActive }: any = useDropzone({ onDrop, accept: { 'image/*': ['.jpg','.jpeg','.png','.webp','.bmp','.gif','.tiff','.tif','.avif','.heic'] }, maxFiles: 20, multiple: true } as any)
  const isFull = images.length >= 20

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400'} ${isFull ? 'opacity-50 pointer-events-none' : ''}`}>
      <input {...getInputProps()} />
      {processing ? <p className="text-gray-600">Processing images...</p> : <>
        <p className="text-lg font-medium text-gray-900">Drop up to 20 photos here or click to browse</p>
        <p className="text-sm text-gray-500 mt-2">JPG · PNG · WEBP · HEIC · BMP · GIF supported</p>
      </>}
    </div>
  )
}