const ns = 'http://www.w3.org/2000/svg'

export type Point = {
    x: number
    y: number
}

type PathParams = {
    d: string
    stroke?: string
    strokeWidth?: number
    fill?: string
    closed?: boolean
    dashArray?: string
}

export function drawPath(svg: HTMLElement, params: PathParams) {
    const { d, stroke = 'black', strokeWidth = 2, fill = 'none' } = params

    const path = document.createElementNS(ns, 'path')

    path.setAttribute('d', d)
    path.setAttribute('stroke', stroke)
    path.setAttribute('stroke-width', `${strokeWidth}`)
    path.setAttribute('fill', `${fill}`)

    svg.append(path)
}
