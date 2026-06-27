export function printPhotos(
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
  html += `@page { size: A4 ${orientation}; margin: ${settings.marginMm}mm; }`
  html += '* { margin: 0; padding: 0; box-sizing: border-box; }'
  html += 'body { display: flex; flex-wrap: wrap; }'
  html += ` .page { width: 100%; display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: ${settings.spacingMm}mm; }`
  html += ` .page img { width: 100%; height: auto; aspect-ratio: 1 / 1; object-fit: cover; display: block; }`
  if (orientation === 'landscape') {
    html += ` .page img { aspect-ratio: ${210 / 297}; }`
  }
  html += '</style></head><body>'

  for (let i = 0; i < selected.length; i++) {
    if (i % photosPerPage === 0) {
      html += '<div class="page">'
    }
    html += `<img src="${selected[i].processedBase64}" />`
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
