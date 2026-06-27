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

  // Conservative auto-crop - only trim obvious large empty borders (>5%)
  const THRESHOLD = 245
  const MIN_BORDER_PCT = 0.05

  function isWhiteRow(y: number): boolean {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4
      if (d[i] < THRESHOLD || d[i+1] < THRESHOLD || d[i+2] < THRESHOLD) {
        return false
      }
    }
    return true
  }

  function isWhiteCol(x: number): boolean {
    for (let y = 0; y < canvas.height; y++) {
      const i = (y * canvas.width + x) * 4
      if (d[i] < THRESHOLD || d[i+1] < THRESHOLD || d[i+2] < THRESHOLD) {
        return false
      }
    }
    return true
  }

  let top = 0
  let bot = canvas.height - 1
  let left = 0
  let right = canvas.width - 1

  while (top < canvas.height * MIN_BORDER_PCT && isWhiteRow(top)) top++
  while (bot > canvas.height * (1 - MIN_BORDER_PCT) && isWhiteRow(bot)) bot--
  while (left < canvas.width * MIN_BORDER_PCT && isWhiteCol(left)) left++
  while (right > canvas.width * (1 - MIN_BORDER_PCT) && isWhiteCol(right)) right--

  const cropW = right - left + 1
  const cropH = bot - top + 1
  if (cropW > 0 && cropH > 0 && cropW < canvas.width && cropH < canvas.height) {
    const cropped = ctx.getImageData(left, top, cropW, cropH)
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