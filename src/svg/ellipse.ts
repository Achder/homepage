const ns = 'http://www.w3.org/2000/svg'

type CircleParams = {
    x: number
    y: number
    radiusX: number
    radiusY: number
    fill: string
    stroke: string
    strokeWidth: number
    rotation: number
}

export function drawEllipse(svg: HTMLElement, params: CircleParams) {
    const { x, y, radiusX, radiusY, fill, stroke, strokeWidth, rotation } =
        params

    const ellipse = document.createElementNS(ns, 'ellipse')

    ellipse.setAttribute('cx', x.toString())
    ellipse.setAttribute('cy', y.toString())
    ellipse.setAttribute('rx', radiusX.toString())
    ellipse.setAttribute('ry', radiusY.toString())

    ellipse.setAttribute('fill', fill)
    ellipse.setAttribute('stroke', stroke)

    ellipse.style.fill = fill
    ellipse.style.stroke = stroke
    ellipse.style.strokeWidth = `${strokeWidth}`
    ellipse.style.transform = `rotate(${rotation}deg)`
    ellipse.style.transformOrigin = `${x}px ${y}px`

    svg.append(ellipse)
}
