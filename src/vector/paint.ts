import type Color from 'colorjs.io'
import { mixN, toProofed } from '../utils/color'
import type { LinearGradient } from './types'

// Linear gradient rotated by `angle` degrees around the center of the bounding box
// (same as svg `gradientTransform="rotate(angle 0.5 0.5)"`).
export function linearGradient(angle: number, colors: Color[], stops: number): LinearGradient {
    const dx = Math.cos(angle * (Math.PI / 180)) / 2
    const dy = Math.sin(angle * (Math.PI / 180)) / 2

    return {
        x1: 0.5 - dx,
        y1: 0.5 - dy,
        x2: 0.5 + dx,
        y2: 0.5 + dy,
        stops: Array.from({ length: stops }, (_, idx) => {
            const t = idx / stops
            return { offset: t, color: mixN(colors, t, 'hwb', 'srgb').toString({ format: 'hex' }) }
        }),
    }
}

const rampSize = 512
const rampCache = new Map<string, string[]>()

// Returns a lookup `t (0..1) -> hex color` for a color gradient. Mixing and soft
// proofing are slow, so the lookup table is only rebuilt when the inputs change.
export function colorRamp(colors: Color[], space: string, proof: boolean): (t: number) => string {
    const key = `${space}|${proof}|${colors.map((color) => color.toString()).join('|')}`

    let lut = rampCache.get(key)
    if (!lut) {
        lut = Array.from({ length: rampSize }, (_, idx) => {
            const color = mixN(colors, idx / (rampSize - 1), space, 'srgb')
            return (proof ? toProofed(color) : color).toString({ format: 'hex' })
        })

        // color pickers create a new key on every input, so keep the cache small
        if (rampCache.size >= 8) {
            rampCache.clear()
        }
        rampCache.set(key, lut)
    }

    const colorsLut = lut
    return (t) => colorsLut[Math.round(Math.min(1, Math.max(0, t)) * (rampSize - 1))]
}
