import Color from 'colorjs.io'
import { Profile, Transform, eIntent, color } from 'jscolorengine'

export function mix(start: Color, mid: Color, end: Color, t: number, space: string, outputSpace: string) {
    if (t < 0.5) {
        return start.mix(mid, t * 2, { space, outputSpace })
    } else {
        return mid.mix(end, (t - 0.5) * 2, { space, outputSpace })
    }
}

const p3Profile = new Profile()
await p3Profile.loadPromise('/display-p3.icc')

const cmykProfile = new Profile()
await cmykProfile.loadPromise('/iso-coated-v2.icc')

const p3ToCmyk = new Transform({ BPC: true })
p3ToCmyk.create(p3Profile, cmykProfile, eIntent.relative)

const cmykToP3 = new Transform()
cmykToP3.create(cmykProfile, p3Profile, eIntent.relative)

export function toCmyk(input: Color): CMYK {
    const p3Color = color.RGBf(...input.to('p3').coords)
    const cmyk = p3ToCmyk.transform(p3Color)
    return cmyk
}

export type CMYK = {
    C: number
    M: number
    Y: number
    K: number
    type: number
}

export function toP3(input: CMYK) {
    const cmykColor = color.CMYK(input.C, input.M, input.Y, input.K)
    const p3 = cmykToP3.transform(cmykColor)
    return p3
}

export function toProofed(input: Color) {
    const cmyk = toCmyk(input)
    const p3 = toP3(cmyk)
    return new Color(`color(display-p3 ${p3.R / 255} ${p3.G / 255} ${p3.B / 255})`).to('srgb')
}
