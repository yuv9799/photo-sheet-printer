export function printPhotos(
  images: { processedBase64: string; croppedBase64?: string; included: boolean; status: string }[],
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
  const orientation = settings.orientation

  let html = '<!DOCTYPE html><html><head><title>Print Photos</title><style>'
  html += `@page { size: A4 ${orientation}; margin: ${settings.marginMm}mm; }`
  html += '* { margin: 0; padding: 0; box-sizing: border-box; }'
  html += ` .page { width: 210mm; height: 297mm; display: grid; grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr); gap: ${settings.spacingMm}mm; page-break-after: always; overflow: hidden; }`
  html += ` .photo-cell { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: white; overflow: hidden; box-sizing: border-box; }`
  html += ` .photo-cell img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; }`
  html += '</style></head><body>'

  for (let i = 0; i < selected.length; i++) {
    if (i % photosPerPage === 0) {
      html += '<div class="page">'
    }
    const imageData = selected[i].croppedBase64 || selected[i].processedBase64
    html += `<div class="photo-cell"><img src="${imageData}" /></div>`
    if ((i + 1) % photosPerPage === 0 || i === selected.length - 1) {
      html += '</div>'
    }
  }

  html += '</body></html>'

  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)
  if (iframe.contentDocument) {
    iframe.contentDocument.write(html)
    iframe.contentDocument.close()
  }
  setTimeout(() => {
    iframe.contentWindow?.print()
    setTimeout(() => {
      if (iframe.contentDocument) document.body.removeChild(iframe)
    }, 2000)
  }, 500)
}
