'use client'
import { usePhotoStore } from '../store/usePhotoStore'

export default function Toast() {
  const toasts = usePhotoStore(s => s.toasts)
  const removeToast = usePhotoStore(s => s.removeToast)

  const bg = { success: 'bg-green-600', error: 'bg-red-600', warning: 'bg-orange-600' }
  const icon = { success: '✅', error: '❌', warning: '⚠️' }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`${bg[t.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in`}>
          <span>{icon[t.type]}</span>
          <span className="text-sm">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-2 hover:opacity-80">✕</button>
        </div>
      ))}
    </div>
  )
}