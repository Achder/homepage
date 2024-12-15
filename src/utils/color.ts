import Color from 'colorjs.io'

export function mix(start: Color, mid: Color, end: Color, t: number, space: string) {
    if (t < 0.5) {
        return start.mix(mid, t * 2, { space, outputSpace: space })
    } else {
        return mid.mix(end, (t - 0.5) * 2, { space, outputSpace: space })
    }
}
