import { addListener, clearAllListeners } from '../utils/controls'
import { redo, undo } from '../utils/state'
import { getOrCreateDefs } from './gradient'

function blobToBase64(blob: Blob) {
    return new Promise<string | ArrayBuffer | null>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
    })
}

async function embedFontInSVG(svg: HTMLElement) {
    const fontResponse = await fetch(`/fonts/RethinkSans-ExtraBold.woff2`)
    const fontBlob = await fontResponse.blob()
    const dataUrl = await blobToBase64(fontBlob)

    const style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.textContent = `
        <![CDATA[
            @font-face {
                font-family: 'Rethink Sans';
                src: url(${dataUrl});
                svg:font-weight: normal;
                svg:font-style: normal;
            }
        ]]>
    `

    const defs = getOrCreateDefs(svg)
    defs?.appendChild(style)
}

export async function save(id: string) {
    const svgElement = document.getElementById(id)
    if (!svgElement) {
        console.error('Could not find SVG element.')
        return
    }

    await embedFontInSVG(svgElement)

    // 1. Get SVG Content
    const svgString = new XMLSerializer().serializeToString(svgElement)

    // 2. Prepare Data
    const svgData =
        `<?xml version="1.0" standalone="no"?>\r\n` +
        `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ` +
        `"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\r\n` +
        svgString

    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const title = document.querySelector('h1')?.textContent ?? 'your-file'

    // 3. Trigger Download
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = title.trim()
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
}

export function clear(svg: HTMLElement) {
    svg.innerHTML = ''
}

export function resetControls() {
    for (const input of [...document.querySelectorAll('input')]) {
        input.value = input.defaultValue
    }

    for (const select of [...document.querySelectorAll('select')]) {
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].defaultSelected) {
                select.selectedIndex = i
                break
            }
        }
    }
}

export type Size = {
    w: number
    h: number
}

type InteractiveSvgParams = {
    init: (svg: HTMLElement, size: Size, abortSignal?: AbortSignal) => void
}

export function initInteractiveSvg(params: InteractiveSvgParams) {
    const { init } = params

    const container = document.getElementById('container')!
    const svg = document.getElementById('svg')!

    let size: Size = {
        w: container.clientWidth,
        h: container.clientHeight,
    }

    function restart() {
        size = {
            w: container.clientWidth,
            h: container.clientHeight,
        }

        svg.setAttribute('width', size.w.toString())
        svg.setAttribute('height', size.h.toString())
        svg.setAttribute('viewbox', `0 0 ${size.w.toString()} ${size.h.toString()}`)

        clearAllListeners()
        resetControls()
        init(svg, size)
    }

    const saveBtn = document.getElementById('save')!
    saveBtn.addEventListener('click', () => save('svg'))

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
