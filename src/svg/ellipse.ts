const ns = 'http://www.w3.org/2000/svg'

type CircleParams = {
    x: number
    y: number
    radiusX: number
    radiusY: number
    fill: string
    stroke: string
    fillOpacity?: number
    strokeOpacity: number
    strokeWidth?: number
    rotation: number
}

export function drawEllipse(svg: HTMLElement, params: CircleParams) {
    const { x, y, radiusX, radiusY, fill, fillOpacity = 1, stroke, strokeOpacity = 1, strokeWidth, rotation } = params

    const ellipse = document.createElementNS(ns, 'ellipse')

    ellipse.setAttribute('cx', x.toString())
    ellipse.setAttribute('cy', y.toString())
    ellipse.setAttribute('rx', radiusX.toString())
    ellipse.setAttribute('ry', radiusY.toString())

    ellipse.setAttribute('fill', fill)
    ellipse.setAttribute('fill-opacity', fillOpacity.toString())
    ellipse.setAttribute('stroke-opacity', strokeOpacity.toString())
    ellipse.setAttribute('stroke', stroke)

    ellipse.style.fill = fill
    ellipse.style.stroke = stroke
    ellipse.style.strokeWidth = `${strokeWidth}`

    ellipse.setAttribute('transform', `translate(${x}, ${y}) rotate(${rotation}) translate(${-x}, ${-y})`)

    svg.append(ellipse)
}
