import { jsPDF } from 'jspdf'

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
