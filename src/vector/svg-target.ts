import type { LinearGradient, RectStyle, Size, Style, VectorTarget } from './types'

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

function styleAttributes(style: Style | RectStyle, fill: string | undefined) {
    let attrs = ` fill="${fill ?? 'none'}"`
    if (fill && (style.fillOpacity ?? 1) !== 1) {
        attrs += ` fill-opacity="${n(style.fillOpacity!)}"`
    }

    if (style.stroke && (style.strokeWidth ?? 1) > 0) {
        attrs += ` stroke="${style.stroke}" stroke-width="${n(style.strokeWidth ?? 1)}"`
        if ((style.strokeOpacity ?? 1) !== 1) {
            attrs += ` stroke-opacity="${n(style.strokeOpacity!)}"`
        }
    }

    return attrs
}

function rotate(rotation: number, x: number, y: number) {
    return rotation ? ` transform="rotate(${n(rotation)} ${n(x)} ${n(y)})"` : ''
}

export function createSvgTarget(size: Size): SvgTarget {
    const defs: string[] = []
    const body: string[] = []

    function addGradient(gradient: LinearGradient) {
        const id = `gradient-${defs.length}`
        const stops = gradient.stops
            .map((stop) => `<stop offset="${n(stop.offset * 100)}%" stop-color="${stop.color}"/>`)
            .join('')
        defs.push(
            `<linearGradient id="${id}" gradientUnits="objectBoundingBox" x1="${gradient.x1}" y1="${gradient.y1}" x2="${gradient.x2}" y2="${gradient.y2}">${stops}</linearGradient>`
        )
        return `url(#${id})`
    }

    return {
        rect(x, y, w, h, style) {
            const fill = typeof style.fill === 'object' ? addGradient(style.fill) : style.fill
            body.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${styleAttributes(style, fill)}/>`)
        },

        ellipse(cx, cy, rx, ry, rotation, style) {
            if (!(rx > 0 && ry > 0)) {
                return
            }

            body.push(
                `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"${rotate(rotation, cx, cy)}${styleAttributes(style, style.fill)}/>`
            )
        },

        path(points, closed, style) {
            if (points.length === 0) {
                return
            }

            let d = `M${n(points[0][0])} ${n(points[0][1])}`
            for (let idx = 1; idx < points.length; idx++) {
                d += `L${n(points[idx][0])} ${n(points[idx][1])}`
            }
            if (closed) {
                d += 'Z'
            }

            body.push(`<path d="${d}"${styleAttributes(style, style.fill)}/>`)
        },

        text(content, x, y, rotation, font, style) {
            body.push(
                `<text x="${n(x)}" y="${n(y)}"${rotate(rotation, x, y)} text-anchor="middle" dominant-baseline="middle" paint-order="stroke fill" font-family="${escape(font.exportFamily)}" font-size="${n(font.size)}" font-weight="${font.weight}"${styleAttributes(style, style.fill)}>${escape(content)}</text>`
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
