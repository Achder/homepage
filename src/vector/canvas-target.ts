import type { Font, Paint, Style, VectorTarget } from './types'

const deg = Math.PI / 180

export type CanvasTarget = VectorTarget & {
    // clears the canvas and resets the drawing state; call once per frame
    begin(scale: number): void
}

export function createCanvasTarget(canvas: HTMLCanvasElement): CanvasTarget {
    const ctx = canvas.getContext('2d')!
    let scale = 1

    // canvas state setters parse their input, so skip redundant writes
    let fillStyle: string | CanvasGradient = ''
    let strokeStyle: string | CanvasGradient = ''
    let lineWidth = -1
    let alpha = -1
    let font = ''

    // gradients are rebuilt by every draw call, so reuse them by value
    const gradients = new Map<string, CanvasGradient>()

    function setAlpha(value: number) {
        if (value !== alpha) {
            ctx.globalAlpha = alpha = value
        }
    }

    function toCanvasPaint(paint: Paint) {
        if (typeof paint === 'string') {
            return paint
        }

        const key = `${paint.x1},${paint.y1},${paint.x2},${paint.y2}|${paint.stops.map((s) => s.offset + s.color).join()}`
        let gradient = gradients.get(key)
        if (!gradient) {
            gradient = ctx.createLinearGradient(paint.x1, paint.y1, paint.x2, paint.y2)
            for (const stop of paint.stops) {
                gradient.addColorStop(stop.offset, stop.color)
            }

            if (gradients.size >= 16) {
                gradients.clear()
            }
            gradients.set(key, gradient)
        }
        return gradient
    }

    function setFill(style: Style) {
        setAlpha(style.fillOpacity ?? 1)
        const paint = toCanvasPaint(style.fill!)
        if (paint !== fillStyle) {
            ctx.fillStyle = fillStyle = paint
        }
    }

    function hasStroke(style: Style) {
        return !!style.stroke && (style.strokeWidth ?? 1) > 0
    }

    function setStroke(style: Style) {
        setAlpha(style.strokeOpacity ?? 1)
        const paint = toCanvasPaint(style.stroke!)
        if (paint !== strokeStyle) {
            ctx.strokeStyle = strokeStyle = paint
        }
        const width = style.strokeWidth ?? 1
        if (width !== lineWidth) {
            ctx.lineWidth = lineWidth = width
        }
    }

    function paintPath(style: Style) {
        if (style.fill) {
            setFill(style)
            ctx.fill()
        }

        if (hasStroke(style)) {
            setStroke(style)
            ctx.stroke()
        }
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

        rect(x, y, w, h, style) {
            if (style.fill) {
                setFill(style)
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

        path(polylines, closed, style) {
            ctx.beginPath()
            for (const points of polylines) {
                if (points.length < 2) {
                    continue
                }

                ctx.moveTo(points[0], points[1])
                for (let idx = 2; idx < points.length; idx += 2) {
                    ctx.lineTo(points[idx], points[idx + 1])
                }
                if (closed) {
                    ctx.closePath()
                }
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
                setFill(style)
                ctx.fillText(content, 0, 0)
            }

            ctx.setTransform(scale, 0, 0, scale, 0, 0)
        },
    }
}
