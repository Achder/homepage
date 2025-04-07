export function seesaw(c: number, t: number) {
    const a = c < 0 ? 1 - Math.abs(c) : 1
    const b = c >= 0 ? 1 - c : 1
    return a + (b - a) * t
}

export function stump(t: number) {
    const lastNipple = 0.5
    const startOffset = lastNipple
    const endOffset = 1 - lastNipple
    const offsetInverse = 1 / lastNipple

    if (t > startOffset && t < endOffset) {
        return 1
    }

    if (t <= startOffset) {
        t = 1 - t
    }

    return 1 - ((t - endOffset) * offsetInverse) ** 40
}
