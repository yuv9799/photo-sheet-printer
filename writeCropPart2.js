const fs = require('fs')
const part2 = `
    const scaleX = img.naturalWidth / 100
    const scaleY = img.naturalHeight / 100
    const sx = cropBox.x * scaleX
    const sy = cropBox.y * scaleY
    const sw = cropBox.w * scaleX
    const sh = cropBox.h * scaleY
    canvas.width = sw
    canvas.height = sh
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
    onSave(canvas.toDataURL('image/jpeg', 0.95))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 12, maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto', padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Crop Image</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div ref={containerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} style={{ position: 'relative', width: '100%', maxWidth: 500, height: 400, margin: '0 auto', overflow: 'hidden', cursor: 'crosshair', userSelect: 'none', background: '#1a1a1a', borderRadius: 8 }}>
          <img ref={imgRef} src={image.processedBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(' + zoom + ')', transformOrigin: 'center center', pointerEvents: 'none' }} draggable={false} />
          <div style={{ position: 'absolute', left: cropBox.x + '%', top: cropBox.y + '%', width: cropBox.w + '%', height: cropBox.h + '%', border: '2px dashed white', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -4, left: -4, width: 8, height: 8, background: 'white', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: 'white', borderRadius: 2 }} />
            <div style={{ position: 'absolute', bottom: -4, left: -4, width: 8, height: 8, background: 'white', borderRadius: 2 }} />
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 8, height: 8, background: 'white', borderRadius: 2 }} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Aspect Ratio</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['free', '1:1', '4:3', '3:4', '16:9'] as const).map((r) => (
              <button key={r} onClick={() => setAspectRatio(r)} style={{ padding: '6px 12px', borderRadius: 6, border: aspectRatio === r ? '2px solid #2563EB' : '1px solid #D1D5DB', background: aspectRatio === r ? '#EFF6FF' : 'white', color: aspectRatio === r ? '#2563EB' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>{r}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Zoom: {zoom.toFixed(1)}x</label>
          <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleApply} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563EB', color: 'white', cursor: 'pointer', fontWeight: 500 }}>Apply Crop</button>
        </div>
      </div>
      <style>{'@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }'}</style>
    </div>
  )
}
`
fs.appendFileSync('app/components/CropModal.tsx', part2)
console.log('appended CropModal.tsx')