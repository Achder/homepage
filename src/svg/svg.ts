import { clearAllListeners } from '../utils/controls'
import { redo, undo } from '../utils/state'

function getFontFamilyName() {
    const fontSelector = document.getElementById('font') as HTMLSelectElement | null
    const fontOption = document.querySelector(`#font option[value="${fontSelector?.value}"]`) as HTMLElement | null

    return {
        fontVariable: fontSelector?.value,
        fontFamily: fontOption?.textContent,
    }
}

export async function save(id: string) {
    const svgElement = document.getElementById(id)
    if (!svgElement) {
        console.error('Could not find SVG element.')
        return
    }

    const svgString = new XMLSerializer().serializeToString(svgElement)
    const svgData =
        `<?xml version="1.0" standalone="no"?>\r\n` +
        `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ` +
        `"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\r\n` +
        svgString

    // replace font variable with font family
    const font = getFontFamilyName()
    const finalSvgData = svgData.replaceAll(`var(${font.fontVariable})`, `${font.fontFamily ?? ''}`)

    const blob = new Blob([finalSvgData], { type: 'image/svg+xml' })
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
