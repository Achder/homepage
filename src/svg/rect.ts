const ns = 'http://www.w3.org/2000/svg'

type RectParams = {
    x: number
    y: number
    width: number
    height: number
    fill?: string
    stroke?: string
    strokeWidth?: number
    maskId?: string
}

export function drawRect(svg: HTMLElement, params: RectParams) {
    const { x, y, width, height, fill, stroke, strokeWidth, maskId } = params

    const rect = document.createElementNS(ns, 'rect')

    rect.setAttribute('x', x.toString())
    rect.setAttribute('y', y.toString())
    rect.setAttribute('width', width.toString())
    rect.setAttribute('height', height.toString())

    if (fill) {
        rect.setAttribute('fill', fill)
    }

    if (stroke) {
        rect.setAttribute('stroke', stroke)
    }

    if (strokeWidth) {
        rect.setAttribute('stroke-width', `${strokeWidth}`)
    }

    if (maskId) {
        rect.setAttribute('mask', `url(#${maskId})`)
    }

    svg.append(rect)
}
