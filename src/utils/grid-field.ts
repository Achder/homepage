import { simplex3 } from './noise'

// Noise displacement of the grid points. Used by the grid workers for the live
// view and directly on the main thread for the svg export.

export type GridNoise = {
    xShapes: number
    yShapes: number
    noiseFreq: number
    lacunarity: number
    gain: number
    time: number
    seed: number
    octaves: number
}

// octaves whose summed amplitude is below this move points by less than 0.1 px
const minAmplitude = 1e-4

function usefulOctaves({ octaves, gain }: GridNoise) {
    let count = 0
    let amp = 0.5
    while (count < octaves && (gain >= 1 || amp / (1 - gain) >= minAmplitude)) {
        count++
        amp *= gain
    }
    return count
}

// fbm displacement (dx, dy) of every point in rows [rowStart, rowEnd), row by row.
// Same as `fbmWarp` of the former grid shader.
export function computeDisplacement(noise: GridNoise, rowStart: number, rowEnd: number) {
    const { xShapes, yShapes, noiseFreq, lacunarity, gain, time, seed } = noise
    const octaves = usefulOctaves(noise)
    const out = new Float32Array((rowEnd - rowStart) * xShapes * 2)

    let k = 0
    for (let y = rowStart; y < rowEnd; y++) {
        const v = y / yShapes
        for (let x = 0; x < xShapes; x++) {
            const u = x / xShapes
            let dx = 0
            let dy = 0
            let freq = noiseFreq
            let amp = 0.5

            for (let o = 0; o < octaves; o++) {
                dx += amp * simplex3(u * freq + seed, v * freq + seed, time)
                dy += amp * simplex3(u * freq + 1000 + seed, v * freq + 1000 + seed, time)
                freq *= lacunarity
                amp *= gain
            }

            out[k++] = dx
            out[k++] = dy
        }
    }

    return out
}
