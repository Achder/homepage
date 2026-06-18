// Error-diffusion dithering (Floyd–Steinberg, Atkinson) off the main thread.
//
// These algorithms are sequential — each pixel's error feeds its neighbours —
// so they can't run in a single fragment-shader pass. The main thread sends a
// (pixel-scale downsampled) RGBA buffer plus the same pre-processing params the
// shader uses; we return a 1-bit mask (one byte per pixel, 0 or 255) that the
// shader colorizes with the ink/paper palette.

export type DitherWorkerRequest = {
    id: number
    width: number
    height: number
    pixels: Uint8ClampedArray // RGBA, length = width * height * 4
    algorithm: 'floyd-steinberg' | 'atkinson'
    brightness: number
    contrast: number
    gamma: number
    invert: number // 0 or 1
    threshold: number
}

export type DitherWorkerResponse = {
    id: number
    width: number
    height: number
    mask: Uint8ClampedArray // one byte per pixel, 0 or 255
}

function adjust(l: number, p: DitherWorkerRequest): number {
    l += p.brightness
    l = (l - 0.5) * p.contrast + 0.5
    l = Math.min(1, Math.max(0, l))
    l = Math.pow(l, p.gamma)
    if (p.invert > 0.5) l = 1 - l
    return Math.min(1, Math.max(0, l))
}

self.onmessage = (event: MessageEvent<DitherWorkerRequest>) => {
    const p = event.data
    const { width, height, pixels } = p
    const count = width * height

    // Pre-processed grayscale buffer in [0,1].
    const gray = new Float32Array(count)
    for (let i = 0; i < count; i++) {
        const r = pixels[i * 4]
        const g = pixels[i * 4 + 1]
        const b = pixels[i * 4 + 2]
        const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        gray[i] = adjust(l, p)
    }

    const mask = new Uint8ClampedArray(count)
    const atkinson = p.algorithm === 'atkinson'

    const spread = (x: number, y: number, err: number, factor: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return
        gray[y * width + x] += err * factor
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            const old = gray[idx]
            const out = old >= p.threshold ? 1 : 0
            mask[idx] = out * 255
            const err = old - out

            if (atkinson) {
                const e = err / 8
                spread(x + 1, y, e, 1)
                spread(x + 2, y, e, 1)
                spread(x - 1, y + 1, e, 1)
                spread(x, y + 1, e, 1)
                spread(x + 1, y + 1, e, 1)
                spread(x, y + 2, e, 1)
            } else {
                spread(x + 1, y, err, 7 / 16)
                spread(x - 1, y + 1, err, 3 / 16)
                spread(x, y + 1, err, 5 / 16)
                spread(x + 1, y + 1, err, 1 / 16)
            }
        }
    }

    const response: DitherWorkerResponse = { id: p.id, width, height, mask }
    ;(self as unknown as Worker).postMessage(response, [mask.buffer])
}
