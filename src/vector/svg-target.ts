import type { Paint, Size, Style, VectorTarget } from './types'

export type SvgTarget = VectorTarget & {
    toString(): string
}

// round to 2 decimals to keep files small
function n(value: number) {
    return Math.round(value * 100) / 100
}

function escape(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function rotate(rotation: number, x: number, y: number) {
    return rotation ? ` transform="rotate(${n(rotation)} ${n(x)} ${n(y)})"` : ''
}

export function createSvgTarget(size: Size): SvgTarget {
    const defs: string[] = []
    const gradientIds = new Map<string, string>()
    const body: string[] = []

    function paint(value: Paint) {
        if (typeof value === 'string') {
            return value
        }

        const stops = value.stops
            .map((stop) => `<stop offset="${n(stop.offset * 100)}%" stop-color="${stop.color}"/>`)
            .join('')
        const attributes = `x1="${n(value.x1)}" y1="${n(value.y1)}" x2="${n(value.x2)}" y2="${n(value.y2)}"`
        const key = attributes + stops

        let id = gradientIds.get(key)
        if (!id) {
            id = `gradient-${gradientIds.size}`
            gradientIds.set(key, id)
            defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" ${attributes}>${stops}</linearGradient>`)
        }
        return `url(#${id})`
    }

    function styleAttributes(style: Style) {
        let attrs = ` fill="${style.fill ? paint(style.fill) : 'none'}"`
        if (style.fill && (style.fillOpacity ?? 1) !== 1) {
            attrs += ` fill-opacity="${n(style.fillOpacity!)}"`
        }

        if (style.stroke && (style.strokeWidth ?? 1) > 0) {
            attrs += ` stroke="${paint(style.stroke)}" stroke-width="${n(style.strokeWidth ?? 1)}"`
            if ((style.strokeOpacity ?? 1) !== 1) {
                attrs += ` stroke-opacity="${n(style.strokeOpacity!)}"`
            }
        }

        return attrs
    }

    return {
        rect(x, y, w, h, style) {
            body.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${styleAttributes(style)}/>`)
        },

        ellipse(cx, cy, rx, ry, rotation, style) {
            if (!(rx > 0 && ry > 0)) {
                return
            }

            body.push(
                `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"${rotate(rotation, cx, cy)}${styleAttributes(style)}/>`
            )
        },

        path(polylines, closed, style) {
            let d = ''
            for (const points of polylines) {
                if (points.length < 2) {
                    continue
                }

                d += `M${n(points[0])} ${n(points[1])}`
                for (let idx = 2; idx < points.length; idx += 2) {
                    d += `L${n(points[idx])} ${n(points[idx + 1])}`
                }
                if (closed) {
                    d += 'Z'
                }
            }

            if (d) {
                body.push(`<path d="${d}"${styleAttributes(style)}/>`)
            }
        },

        text(content, x, y, rotation, font, style) {
            body.push(
                `<text x="${n(x)}" y="${n(y)}"${rotate(rotation, x, y)} text-anchor="middle" dominant-baseline="middle" paint-order="stroke fill" font-family="${escape(font.exportFamily)}" font-size="${n(font.size)}" font-weight="${font.weight}"${styleAttributes(style)}>${escape(content)}</text>`
            )
        },

        toString() {
            return [
                `<?xml version="1.0" standalone="no"?>`,
                `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`,
                `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}">`,
                defs.length ? `<defs>${defs.join('')}</defs>` : '',
                ...body,
                `</svg>`,
            ].join('\n')
        },
    }
}
