export async function processImage(file: File, options: { whiteBackground: boolean, bgTolerance: number }): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  ctx.drawImage(bitmap, 0, 0)
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imgData.data

  let sumL = 0
  for (let i = 0; i < d.length; i += 4) sumL += 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]
  const avgL = sumL / (canvas.width * canvas.height)
  if (avgL > 0 && avgL !== 128) {
    const f = 128 / avgL
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, Math.max(0, d[i]*f))
      d[i+1] = Math.min(255, Math.max(0, d[i+1]*f))
      d[i+2] = Math.min(255, Math.max(0, d[i+2]*f))
    }
  }

  let minV = 255, maxV = 0
  for (let i = 0; i < d.length; i += 4) {
    const mn = Math.min(d[i], d[i+1], d[i+2])
    const mx = Math.max(d[i], d[i+1], d[i+2])
    if (mn < minV) minV = mn
    if (mx > maxV) maxV = mx
  }
  if (maxV > minV) {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = (d[i] - minV) * 255 / (maxV - minV)
      d[i+1] = (d[i+1] - minV) * 255 / (maxV - minV)
      d[i+2] = (d[i+2] - minV) * 255 / (maxV - minV)
    }
  }

  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]
  const src = new Uint8ClampedArray(d)
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
      d[dstOff] = r
      d[dstOff + 1] = g
      d[dstOff + 2] = b
    }
  }
  ctx.putImageData(imgData, 0, 0)

  function findEdge(sx: number, sy: number, dx: number, dy: number): number {
    let x = sx, y = sy
    while (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const idx = (y * canvas.width + x) * 4
      if (!(d[idx] > 240 && d[idx+1] > 240 && d[idx+2] > 240 && d[idx+3] > 20)) {
        return x + y * canvas.width
      }
      x += dx
      y += dy
    }
    return sx + sy * canvas.width
  }

  const top = findEdge(0, 0, 0, 1)
  const bot = findEdge(0, canvas.height - 1, 0, -1)
  const left = findEdge(0, 0, 1, 0)
  const right = findEdge(canvas.width - 1, 0, -1, 0)
  const topY = Math.floor(top / canvas.width)
  const botY = Math.floor(bot / canvas.width)
  const leftX = left % canvas.width
  const rightX = right % canvas.width
  const cropW = rightX - leftX
  const cropH = botY - topY
  if (cropW > 0 && cropH > 0) {
    const cropped = ctx.getImageData(leftX, topY, cropW, cropH)
    canvas.width = cropW
    canvas.height = cropH
    ctx.putImageData(cropped, 0, 0)
  }

  if (options.whiteBackground) {
    const c2 = canvas.getContext('2d')
    if (!c2) throw new Error('Canvas not supported')
    const id2 = c2.getImageData(0, 0, canvas.width, canvas.height)
    const dd = id2.data
    const samples = []
    const ss = 8
    const regions = [{x: 0, y: 0}, {x: canvas.width - ss, y: 0}, {x: 0, y: canvas.height - ss}, {x: canvas.width - ss, y: canvas.height - ss}]
    for (const r of regions) {
      let rv = 0, gv = 0, bv = 0, cnt = 0
      for (let dy = 0; dy < ss; dy++) {
        for (let dx = 0; dx < ss; dx++) {
          const px = Math.min(r.x + dx, canvas.width - 1)
          const py = Math.min(r.y + dy, canvas.height - 1)
          const idx = (py * canvas.width + px) * 4
          rv += dd[idx]
          gv += dd[idx + 1]
          bv += dd[idx + 2]
          cnt++
        }
      }
      samples.push({r: rv / cnt, g: gv / cnt, b: bv / cnt})
    }
    const bgR = samples.reduce((a, s) => a + s.r, 0) / samples.length
    const bgG = samples.reduce((a, s) => a + s.g, 0) / samples.length
    const bgB = samples.reduce((a, s) => a + s.b, 0) / samples.length
    const tol = options.bgTolerance * 2.55
    for (let i = 0; i < dd.length; i += 4) {
      const dr = dd[i] - bgR
      const dg = dd[i + 1] - bgG
      const db = dd[i + 2] - bgB
      if (Math.sqrt(dr * dr + dg * dg + db * db) < tol) {
        dd[i] = 255
        dd[i + 1] = 255
        dd[i + 2] = 255
        dd[i + 3] = 255
      }
    }
    c2.putImageData(id2, 0, 0)
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}