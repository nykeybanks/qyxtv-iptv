function loadLogo(src: string, signal: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    const abort = () => { image.src = ''; reject(new DOMException('Aborted', 'AbortError')) }
    signal.addEventListener('abort', abort, { once: true })
    image.onload = () => { signal.removeEventListener('abort', abort); resolve(image) }
    image.onerror = () => { signal.removeEventListener('abort', abort); reject(new Error('Logo unavailable')) }
    image.src = src
    if (signal.aborted) abort()
  })
}

function outlinedLogo(image: HTMLImageElement, height: number) {
  const width = Math.round(height * image.naturalWidth / image.naturalHeight)
  const silhouette = document.createElement('canvas')
  silhouette.width = width
  silhouette.height = height
  const mask = silhouette.getContext('2d')!
  mask.drawImage(image, 0, 0, width, height)
  mask.globalCompositeOperation = 'source-in'
  mask.fillStyle = '#000'
  mask.fillRect(0, 0, width, height)
  const outlined = document.createElement('canvas')
  outlined.width = width + 6
  outlined.height = height + 6
  const context = outlined.getContext('2d')!
  // Match the SVG's three-pixel alpha dilation without modifying the original artwork.
  for (let x = -3; x <= 3; x++) {
    for (let y = -3; y <= 3; y++) context.drawImage(silhouette, x + 3, y + 3)
  }
  context.drawImage(image, 3, 3, width, height)
  return outlined
}

export async function createPipCompositor(source: HTMLVideoElement, signal: AbortSignal, onError: () => void) {
  const images = await Promise.all([
    loadLogo('/brand/qyx/source-05/logos/qyxtv-white.png', signal),
    loadLogo('/brand/qyx/source-05/logos/quantumyield-white.png', signal)
  ])
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  const product = outlinedLogo(images[0], 28)
  const signature = outlinedLogo(images[1], 20)
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) throw new Error('Canvas unavailable')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const start = performance.now()
  let timer: ReturnType<typeof setInterval> | undefined
  let stream: MediaStream | undefined
  let closed = false
  const output = document.createElement('video')
  output.muted = true
  output.playsInline = true
  output.setAttribute('aria-hidden', 'true')
  output.className = 'pip-compositor-video'
  const dispose = () => {
    if (closed) return
    closed = true
    clearInterval(timer)
    output.removeEventListener('pause', pauseSource)
    output.removeEventListener('play', playSource)
    signal.removeEventListener('abort', dispose)
    output.pause()
    output.srcObject = null
    stream?.getTracks().forEach(track => track.stop())
    output.remove()
    canvas.width = canvas.height = 0
  }
  const pauseSource = () => { if (!closed) source.pause() }
  const playSource = () => { if (!closed && source.paused) void source.play().catch(onError) }
  const draw = () => {
    context.globalAlpha = 1
    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    if (source.readyState >= 2 && source.videoWidth && source.videoHeight) {
      const ratio = Math.min(canvas.width / source.videoWidth, canvas.height / source.videoHeight)
      const width = source.videoWidth * ratio
      const height = source.videoHeight * ratio
      context.drawImage(source, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
    }
    const phase = (performance.now() - start) / 6000 * Math.PI * 2
    context.globalAlpha = reduced.matches || document.documentElement.dataset.motion === 'reduced' ? 1 : 0.33 + 0.67 * (1 - Math.cos(phase)) / 2
    context.drawImage(product, canvas.width - product.width - 12, 12)
    context.drawImage(signature, (canvas.width - signature.width) / 2, canvas.height - signature.height - 12)
    context.globalAlpha = 1
  }
  try {
    draw()
    stream = canvas.captureStream(25)
    signal.addEventListener('abort', dispose, { once: true })
    document.body.append(output)
    output.srcObject = stream
    timer = setInterval(() => {
      try { draw() } catch { dispose(); onError() }
    }, 40)
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout)
        output.removeEventListener('loadedmetadata', ready)
        output.removeEventListener('error', failed)
        signal.removeEventListener('abort', failed)
      }
      const ready = () => { cleanup(); resolve() }
      const failed = () => { cleanup(); reject(new Error('Branded stream unavailable')) }
      const timeout = setTimeout(failed, 3500)
      output.addEventListener('loadedmetadata', ready, { once: true })
      output.addEventListener('error', failed, { once: true })
      signal.addEventListener('abort', failed, { once: true })
      if (output.readyState >= 1) ready()
      if (signal.aborted) failed()
    })
    await output.play()
    output.addEventListener('pause', pauseSource)
    output.addEventListener('play', playSource)
    return {
      video: output,
      resize: (width: number, height: number) => {
        if (closed) return
        canvas.width = Math.max(1, Math.round(width))
        canvas.height = Math.max(1, Math.round(height))
        draw()
      },
      dispose
    }
  } catch (error) { dispose(); throw error }
}
