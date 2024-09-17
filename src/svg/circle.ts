const ns = 'http://www.w3.org/2000/svg'

type CircleParams = {
    x: number
    y: number
    radius: number
    fill?: string
    stroke?: string
    strokeWidth?: number
}

export function drawCircle(svg: HTMLElement, params: CircleParams) {
    const { x, y, radius, fill = 'black', stroke = 'black', strokeWidth = 0 } = params

    const circle = document.createElementNS(ns, 'circle')

    circle.setAttribute('cx', x.toString())
    circle.setAttribute('cy', y.toString())
    circle.setAttribute('r', radius.toString())

    circle.setAttribute('fill', fill)
    circle.setAttribute('stroke', stroke)
    circle.setAttribute('stroke-width', `${strokeWidth}`)

    svg.append(circle)
}
