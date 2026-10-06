import { clearAllListeners, getInputValue, resetControls } from '../utils/controls'
import { download } from '../utils/download'
import { redo, undo } from '../utils/state'
import { createCanvasTarget } from './canvas-target'
import { createSvgTarget } from './svg-target'
import type { Size, VectorTarget } from './types'

export type DrawContext = {
    size: Size
    // reads a control value and re-renders when the control changes
    get: <T>(id: string) => T
    // schedules a render on the next animation frame; repeated calls are merged
    requestRender: () => void
    // true when drawing the svg export, false for the live canvas
    exporting: boolean
}

type PlaygroundParams = {
    // called on every restart (load, undo/redo, resize), before the first draw
    setup?: (ctx: DrawContext) => void
    // draws the artwork; used for both the live canvas and the svg export
    draw: (target: VectorTarget, ctx: DrawContext) => void
}

const maxPixelRatio = 2

export function initPlayground({ setup, draw }: PlaygroundParams) {
    const container = document.getElementById('container')!
    const canvas = document.getElementById('canvas') as HTMLCanvasElement
    const target = createCanvasTarget(canvas)

    let ctx: DrawContext | null = null
    let frame = 0

    function requestRender() {
        if (!frame) {
            frame = requestAnimationFrame(render)
        }
    }

    function render() {
        cancelAnimationFrame(frame)
        frame = 0
        if (!ctx) {
            return
        }

        const scale = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
        const width = Math.round(ctx.size.w * scale)
        const height = Math.round(ctx.size.h * scale)
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width
            canvas.height = height
        }

        target.begin(scale)
        draw(target, ctx)
    }

    // re-reads all control values from the url
    function restart() {
        clearAllListeners()
        resetControls()

        ctx = {
            size: { w: container.clientWidth, h: container.clientHeight },
            get: (id) => getInputValue(id, requestRender),
            requestRender,
            exporting: false,
        }
        setup?.(ctx)
        render()
    }

    function save() {
        if (!ctx) {
            return
        }

        const svg = createSvgTarget(ctx.size)
        draw(svg, { ...ctx, exporting: true })
        download(new Blob([svg.toString()], { type: 'image/svg+xml' }), 'svg')
    }

    document.getElementById('save')!.addEventListener('click', save)
    document.getElementById('undo')!.addEventListener('click', () => {
        undo()
        restart()
    })
    document.getElementById('redo')!.addEventListener('click', () => {
        redo()
        restart()
    })
    window.addEventListener('popstate', restart)

    new ResizeObserver(() => {
        if (ctx?.size.w !== container.clientWidth || ctx?.size.h !== container.clientHeight) {
            restart()
        }
    }).observe(container)

    restart()
}
