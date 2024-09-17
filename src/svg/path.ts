const ns = 'http://www.w3.org/2000/svg'

export type Point = {
    x: number
    y: number
}

type PathParams = {
    points: Point[]
    stroke?: string
    strokeWidth?: number
    fill?: string
    interpolation?: 'linear' | 'bezier'
    closed?: boolean
}

function drawLinear(points: Point[], closed: boolean) {
    let d = ''
    for (let idx = 0; idx < points.length; idx++) {
        const { x, y } = points[idx]

        if (idx === 0) {
            d += `M${x} ${y} `
        } else {
            d += `L${x} ${y} `
        }

        if (idx === points.length - 1 && closed) {
            d += 'Z'
        }
    }

    return d
}

function drawBezier(points: Point[], closed: boolean) {
    let d = ``
    for (let idx = 0; idx < points.length; idx += 3) {
        d += `M `
        d += `${points[idx].x} ${points[idx].y} `
        d += `C `
        d += `${points[idx + 1].x} ${points[idx + 1].y} `
        d += `${points[idx + 2].x} ${points[idx + 2].y} `
        d += `${points[(idx + 3) % points.length].x} ${points[(idx + 3) % points.length].y} `
    }

    return d
}

export function drawPath(svg: HTMLElement, params: PathParams) {
    const {
        points,
        stroke = 'black',
        strokeWidth = 1,
        fill = 'none',
        closed = false,
        interpolation = 'linear',
    } = params

    const path = document.createElementNS(ns, 'path')
    const d = interpolation === 'linear' ? drawLinear(points, closed) : drawBezier(points, closed)

    path.setAttribute('d', d)
    path.setAttribute('stroke', stroke)
    path.setAttribute('stroke-width', `${strokeWidth}`)
    path.setAttribute('fill', `${fill}`)

    svg.append(path)
}
