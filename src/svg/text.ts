const ns = 'http://www.w3.org/2000/svg'

type TextParams = {
    content: string
    x: number
    y: number
    fill: string
    stroke: string
    fillOpacity?: number
    strokeOpacity: number
    strokeWidth?: number
    rotation: number
    fontFamily?: string
    fontWeight?: string
    fontSize?: string
}

export function drawText(svg: HTMLElement, params: TextParams) {
    const {
        content,
        x,
        y,
        fill,
        fillOpacity = 1,
        stroke,
        strokeOpacity = 1,
        strokeWidth,
        rotation,
        fontWeight = '400',
        fontSize = '16px',
        fontFamily = 'Rethink Sans',
    } = params

    const text = document.createElementNS(ns, 'text')

    text.setAttribute('x', x.toString())
    text.setAttribute('y', y.toString())

    text.setAttribute('fill', fill)
    text.setAttribute('fill-opacity', fillOpacity.toString())
    text.setAttribute('stroke-opacity', strokeOpacity.toString())
    text.setAttribute('stroke', stroke)
    text.setAttribute('stroke-width', `${strokeWidth}`)
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'middle')
    text.setAttribute('paint-order', 'stroke fill')
    text.setAttribute('transform', `translate(${x}, ${y}) rotate(${rotation}) translate(${-x}, ${-y})`)

    text.style.fontSize = fontSize
    text.style.fontWeight = fontWeight
    text.style.fontFamily = fontFamily

    text.appendChild(document.createTextNode(content))

    svg.append(text)
}
