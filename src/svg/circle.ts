const ns = 'http://www.w3.org/2000/svg'

type CircleParams = {
    x: number
    y: number
    radius: number
}

export function drawCircle(svg: HTMLElement, params: CircleParams) {
    const { x, y, radius } = params

    const circle = document.createElementNS(ns, 'circle')

    circle.setAttribute('cx', x.toString())
    circle.setAttribute('cy', y.toString())
    circle.setAttribute('r', radius.toString())

    circle.setAttribute('fill', 'none')
    circle.setAttribute('stroke', '#00000055')
    circle.setAttribute('stroke-width', '1')

    svg.append(circle)
}
