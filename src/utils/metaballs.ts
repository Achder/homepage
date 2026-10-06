import { isoBands } from 'marching-squares'

// Metaball field and its iso bands. Used by the metaballs worker for the live
// view and directly on the main thread for the svg export.

export type Circle = {
    x: number
    y: number
    radius: number
}

export type MetaballsParams = {
    balls: Circle[]
    resolution: number
    falloff: number
    minThreshold: number
    maxThreshold: number
    isoLevels: number
}

// one entry per band; each band is a list of rings of [x, y] points in field cells
export type MetaballsLayers = number[][][][]

const metaballFunctions = {
    gaussian(x: number, y: number, ball: Circle, falloff: number) {
        const dx = x - ball.x
        const dy = y - ball.y
        const distanceSquared = dx * dx + dy * dy
        return ball.radius * Math.exp(-falloff * distanceSquared)
    },
    inverseSquared(x: number, y: number, ball: Circle, falloff: number) {
        const dx = x - ball.x
        const dy = y - ball.y
        const distanceSquared = dx * dx + dy * dy
        return ball.radius / (falloff * distanceSquared + 1)
    },
    wyvill(x: number, y: number, ball: Circle, _falloff: number) {
        const dx = x - ball.x
        const dy = y - ball.y
        const distanceSquared = dx * dx + dy * dy
        const radiusSquared = ball.radius * ball.radius

        if (distanceSquared >= radiusSquared) {
            return 0
        }

        const t = 1 - distanceSquared / radiusSquared
        return t * t * t // (1 - (d² / R²))³
    },
    quartic(x: number, y: number, ball: Circle, _falloff: number) {
        const dx = x - ball.x
        const dy = y - ball.y
        const distanceSquared = dx * dx + dy * dy
        const radiusSquared = ball.radius * ball.radius

        if (distanceSquared >= radiusSquared) {
            return 0
        }

        const t = 1 - distanceSquared / radiusSquared
        return t * t * t * t // raise to power 4
    },
}

function generateField(balls: Circle[], resolution: number, falloff: number) {
    const field: number[][] = []

    for (let y = 0; y <= 1.414 + resolution; y += resolution) {
        const dots: number[] = []
        for (let x = 0; x <= 1 + resolution; x += resolution) {
            let sum = 0
            for (const ball of balls) {
                sum += metaballFunctions.gaussian(x, y, ball, falloff)
            }
            dots.push(sum)
        }

        field.push(dots)
    }

    return field
}

function generateThresholds(min: number, max: number, num: number) {
    const bandwidth = (max - min) / num

    // first and last bandwidth need to be big to catch outliers
    const thresholds: number[] = [min - 10]
    const bandwidths: number[] = [10]

    for (let idx = 0; idx < num; idx++) {
        thresholds.push(min + bandwidth * idx)
        bandwidths.push(bandwidth)
    }

    thresholds.push(min + num * bandwidth)
    bandwidths.push(10)

    return { thresholds, bandwidths }
}

export function computeLayers(params: MetaballsParams): MetaballsLayers {
    const field = generateField(params.balls, params.resolution, params.falloff)
    const { thresholds, bandwidths } = generateThresholds(params.minThreshold, params.maxThreshold, params.isoLevels)
    return isoBands(field, thresholds, bandwidths)
}
