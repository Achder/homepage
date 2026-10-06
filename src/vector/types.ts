export type Size = {
    w: number
    h: number
}

export type GradientStop = {
    offset: number
    color: string
}

// Linear gradient in user space (same as SVG `gradientUnits="userSpaceOnUse"`).
export type LinearGradient = {
    x1: number
    y1: number
    x2: number
    y2: number
    stops: GradientStop[]
}

export type Paint = string | LinearGradient

export type Style = {
    fill?: Paint
    fillOpacity?: number
    stroke?: Paint
    strokeOpacity?: number
    strokeWidth?: number
}

export type Font = {
    // CSS font-family list used for live rendering
    family: string
    // plain family name written into exported files
    exportFamily: string
    size: number
    weight: string
}

// Immediate-mode drawing API shared by all output formats (canvas, svg, later hpgl).
// Rotations are in degrees around the shape's own position.
export interface VectorTarget {
    rect(x: number, y: number, w: number, h: number, style: Style): void
    ellipse(cx: number, cy: number, rx: number, ry: number, rotation: number, style: Style): void
    // one path made of polylines; each polyline is a flat [x0, y0, x1, y1, ...] list
    path(polylines: ArrayLike<number>[], closed: boolean, style: Style): void
    text(content: string, x: number, y: number, rotation: number, font: Font, style: Style): void
}
