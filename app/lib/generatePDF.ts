import { jsPDF } from 'jspdf'

export async function generatePDF(
  images: { processedBase64: string; croppedBase64?: string; included: boolean; status: string }[],
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

  const PAGE_W_MM = orientation === 'p' ? 210 : 297
  const PAGE_H_MM = orientation === 'p' ? 297 : 210

  const [cols, rows] = settings.grid.split('x').map(Number)
  const photosPerPage = cols * rows

  const cellW = (PAGE_W_MM - 2 * settings.marginMm - (cols - 1) * settings.spacingMm) / cols
  const cellH = (PAGE_H_MM - 2 * settings.marginMm - (rows - 1) * settings.spacingMm) / rows

  for (let i = 0; i < selectedImages.length; i++) {
    const posInPage = i % photosPerPage
    const col = posInPage % cols
    const row = Math.floor(posInPage / cols)

    if (posInPage === 0 && i > 0) {
      doc.addPage()
    }

    const x = settings.marginMm + col * (cellW + settings.spacingMm)
    const y = settings.marginMm + row * (cellH + settings.spacingMm)
    const imageData = selectedImages[i].croppedBase64 || selectedImages[i].processedBase64

    // Fill cell background white
    doc.setFillColor(255, 255, 255)
    doc.rect(x, y, cellW, cellH, 'F')

    // Calculate proper fit to preserve aspect ratio
    const img = new Image()
    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
      img.src = imageData
    })

    const imgW = img.naturalWidth
    const imgH = img.naturalHeight
    const imgRatio = imgW / imgH
    const cellRatio = cellW / cellH

    let drawW: number
    let drawH: number
    let drawX: number
    let drawY: number

    if (imgRatio > cellRatio) {
      // Image wider than cell - fit by width
      drawW = cellW
      drawH = cellW / imgRatio
      drawX = x
      drawY = y + (cellH - drawH) / 2
    } else {
      // Image taller than cell - fit by height
      drawH = cellH
      drawW = cellH * imgRatio
      drawX = x + (cellW - drawW) / 2
      drawY = y
    }

    doc.addImage(imageData, 'JPEG', drawX, drawY, drawW, drawH)
  }

  doc.save('photo-sheet.pdf')
}
