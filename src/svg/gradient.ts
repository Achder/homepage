const ns = 'http://www.w3.org/2000/svg'

type GradientParams = {
    id: string
    start: string
    end: string
    angle: number
}

function getOrCreateDefs(svg: HTMLElement) {
    const defs = svg.querySelector('defs')
    if (defs) {
        return defs
    }

    const newDefs = document.createElementNS(ns, 'defs')
    svg.prepend(newDefs)
    return newDefs
}

export function createGradient(svg: HTMLElement, params: GradientParams) {
    const { id, start, end, angle } = params

    const defs = getOrCreateDefs(svg)

    // check if id exists
    if (document.getElementById(id)) {
        throw new Error(`Id exists: ${id}`)
    }

    const gradient = document.createElementNS(ns, 'linearGradient')
    gradient.setAttribute('id', id)
    gradient.setAttribute('gradientTransform', `rotate(${angle})`)

    const stopStart = document.createElementNS(ns, 'stop')
    stopStart.setAttribute('offset', '0%')
    stopStart.setAttribute('stop-color', start)
    gradient.append(stopStart)

    const stopEnd = document.createElementNS(ns, 'stop')
    stopEnd.setAttribute('offset', '100%')
    stopEnd.setAttribute('stop-color', end)
    gradient.append(stopEnd)

    defs.append(gradient)
}
