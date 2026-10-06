import type { Font, LinearGradient, RectStyle, Style, VectorTarget } from './types'

const deg = Math.PI / 180

type StrokeStyle = Pick<Style, 'stroke' | 'strokeOpacity' | 'strokeWidth'>

export type CanvasTarget = VectorTarget & {
    // clears the canvas and resets the drawing state; call once per frame
    begin(scale: number): void
}

export function createCanvasTarget(canvas: HTMLCanvasElement): CanvasTarget {
    const ctx = canvas.getContext('2d')!
    let scale = 1

    // canvas state setters parse their input, so skip redundant writes
    let fillStyle: string | CanvasGradient = ''
    let strokeStyle = ''
    let lineWidth = -1
    let alpha = -1
    let font = ''

    let gradientKey = ''
    let gradient: CanvasGradient | null = null

    function setAlpha(value: number) {
        if (value !== alpha) {
            ctx.globalAlpha = alpha = value
        }
    }

    function setFill(value: string | CanvasGradient) {
        if (value !== fillStyle) {
            ctx.fillStyle = fillStyle = value
        }
    }

    function hasStroke(style: StrokeStyle) {
        return !!style.stroke && (style.strokeWidth ?? 1) > 0
    }

    function setStroke(style: StrokeStyle) {
        setAlpha(style.strokeOpacity ?? 1)
        if (style.stroke !== strokeStyle) {
            ctx.strokeStyle = strokeStyle = style.stroke!
        }
        const width = style.strokeWidth ?? 1
        if (width !== lineWidth) {
            ctx.lineWidth = lineWidth = width
        }
    }

    function paintPath(style: Style) {
        if (style.fill) {
            setAlpha(style.fillOpacity ?? 1)
            setFill(style.fill)
            ctx.fill()
        }

        if (hasStroke(style)) {
            setStroke(style)
            ctx.stroke()
        }
    }

    function getGradient(paint: LinearGradient) {
        const key = `${paint.x1},${paint.y1},${paint.x2},${paint.y2}|${paint.stops.map((s) => s.offset + s.color).join()}`
        if (key !== gradientKey || !gradient) {
            gradientKey = key
            gradient = ctx.createLinearGradient(paint.x1, paint.y1, paint.x2, paint.y2)
            for (const stop of paint.stops) {
                gradient.addColorStop(stop.offset, stop.color)
            }
        }
        return gradient
    }

    return {
        begin(newScale) {
            scale = newScale
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.setTransform(scale, 0, 0, scale, 0, 0)
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.miterLimit = 4 // svg default

            // a canvas resize resets the context state, so forget the cached values
            fillStyle = strokeStyle = font = ''
            lineWidth = alpha = -1
        },

        rect(x, y, w, h, style: RectStyle) {
            if (typeof style.fill === 'object') {
                // draw the unit square in bounding box space, like svg objectBoundingBox
                ctx.setTransform(scale * w, 0, 0, scale * h, scale * x, scale * y)
                setAlpha(style.fillOpacity ?? 1)
                setFill(getGradient(style.fill))
                ctx.fillRect(0, 0, 1, 1)
                ctx.setTransform(scale, 0, 0, scale, 0, 0)
            } else if (style.fill) {
                setAlpha(style.fillOpacity ?? 1)
                setFill(style.fill)
                ctx.fillRect(x, y, w, h)
            }

            if (hasStroke(style)) {
                setStroke(style)
                ctx.strokeRect(x, y, w, h)
            }
        },

        ellipse(cx, cy, rx, ry, rotation, style) {
            // svg does not render these; canvas would throw on negative radii
            if (!(rx > 0 && ry > 0)) {
                return
            }

            ctx.beginPath()
            ctx.ellipse(cx, cy, rx, ry, rotation * deg, 0, Math.PI * 2)
            paintPath(style)
        },

        path(points, closed, style) {
            if (points.length === 0) {
                return
            }

            ctx.beginPath()
            ctx.moveTo(points[0][0], points[0][1])
            for (let idx = 1; idx < points.length; idx++) {
                ctx.lineTo(points[idx][0], points[idx][1])
            }
            if (closed) {
                ctx.closePath()
            }
            paintPath(style)
        },

        text(content, x, y, rotation, textFont: Font, style) {
            const nextFont = `${textFont.weight} ${textFont.size}px ${textFont.family}`
            if (nextFont !== font) {
                ctx.font = font = nextFont
            }

            const cos = Math.cos(rotation * deg) * scale
            const sin = Math.sin(rotation * deg) * scale
            ctx.setTransform(cos, sin, -sin, cos, x * scale, y * scale)

            // stroke first, like svg `paint-order: stroke fill`
            if (hasStroke(style)) {
                setStroke(style)
                ctx.strokeText(content, 0, 0)
            }

            if (style.fill) {
                setAlpha(style.fillOpacity ?? 1)
                setFill(style.fill)
                ctx.fillText(content, 0, 0)
            }

            ctx.setTransform(scale, 0, 0, scale, 0, 0)
        },
    }
}
