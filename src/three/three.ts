import * as THREE from 'three'
import { clearAllListeners, resetControls } from '../utils/controls'
import { redo, undo } from '../utils/state'
import type { Size } from '../vector/types'
import { download } from '../utils/download'

export type { Size }

// A scene built by `init`. Returns the per-render `render` callback (controls
// hook into it) and an optional `dispose` to free GPU resources on restart.
type ThreeScene = {
    render: () => void
    dispose?: () => void
}

type InteractiveThreeParams = {
    init: (renderer: THREE.WebGLRenderer, size: Size) => ThreeScene
}

async function save(canvas: HTMLCanvasElement, render: () => void) {
    // Re-render right before reading so the drawing buffer is guaranteed fresh.
    render()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) {
        console.error('Could not export canvas.')
        return
    }

    download(blob, 'png')
}

export function initInteractiveThree(params: InteractiveThreeParams) {
    console.log('initInteractiveThree')
    const { init } = params

    const container = document.getElementById('container')!
    const canvas = document.getElementById('canvas') as HTMLCanvasElement

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        preserveDrawingBuffer: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    let scene: ThreeScene | null = null

    function restart() {
        const size: Size = {
            w: container.clientWidth,
            h: container.clientHeight,
        }

        renderer.setSize(size.w, size.h, false)

        console.log('RESTART')
        scene?.dispose?.()
        clearAllListeners()
        resetControls()
        scene = init(renderer, size)
        scene.render()
    }

    const saveBtn = document.getElementById('save')!
    saveBtn.addEventListener('click', () => {
        if (scene) save(canvas, scene.render)
    })

    const undoBtn = document.getElementById('undo')!
    undoBtn.addEventListener('click', () => {
        undo()
        restart()
    })

    const redoBtn = document.getElementById('redo')!
    redoBtn.addEventListener('click', () => {
        redo()
        restart()
    })

    window.addEventListener('popstate', restart)
    window.addEventListener('resize', restart)
    restart()
}
