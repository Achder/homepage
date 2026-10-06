import type Color from 'colorjs.io'
import { mixN, toProofed } from '../utils/color'
import type { LinearGradient, Size } from './types'

// Gradient line across a `size` box at `angle` degrees. Same result as an svg
// objectBoundingBox gradient with `gradientTransform="rotate(angle 0.5 0.5)"`: the
// gradient is linear in the box's unit space, so it is skewed on non-square boxes.
export function gradientLine(size: Size, angle: number) {
    // gradient of t in user space; the gradient line is parallel to it
    const gx = Math.cos(angle * (Math.PI / 180)) / size.w
    const gy = Math.sin(angle * (Math.PI / 180)) / size.h
    const length = gx * gx + gy * gy
    const dx = gx / length / 2
    const dy = gy / length / 2

    return {
        x1: size.w / 2 - dx,
        y1: size.h / 2 - dy,
        x2: size.w / 2 + dx,
        y2: size.h / 2 + dy,
    }
}

// Background gradient for a `size` box with `stops` colors mixed in hwb.
export function linearGradient(size: Size, angle: number, colors: Color[], stops: number): LinearGradient {
    return {
        ...gradientLine(size, angle),
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
