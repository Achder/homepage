import type Color from 'colorjs.io'
import { mixN } from '../utils/color'

const ns = 'http://www.w3.org/2000/svg'

type GradientParams = {
    id: string
    colors: Color[]
    stops: number
    angle: number
}

export function getOrCreateDefs(svg: HTMLElement) {
    const defs = svg.querySelector('defs')
    if (defs) {
        return defs
    }

    const newDefs = document.createElementNS(ns, 'defs')
    svg.prepend(newDefs)
    return newDefs
}

export function createGradient(svg: HTMLElement, params: GradientParams) {
    const { id, colors, angle, stops } = params

    const defs = getOrCreateDefs(svg)

    // check if id exists
    if (document.getElementById(id)) {
        throw new Error(`Id exists: ${id}`)
    }

    const gradient = document.createElementNS(ns, 'linearGradient')
    gradient.setAttribute('id', id)
    gradient.setAttribute('gradientUnits', `objectBoundingBox`)
    gradient.setAttribute('gradientTransform', `rotate(${angle} 0.5 0.5)`)

    for (let idx = 0; idx < stops; idx++) {
        const t = idx / stops
        const offset = t * 100
        const color = mixN(colors, t, 'hwb', 'srgb')

        const stopStart = document.createElementNS(ns, 'stop')
        stopStart.setAttribute('offset', `${offset}%`)
        stopStart.setAttribute('stop-color', color.toString({ format: 'hex' }))
        gradient.append(stopStart)
    }

    defs.append(gradient)
}
