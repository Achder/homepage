export function save(id: string) {
    const svgElement = document.getElementById(id)!

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

    // 3. Trigger Download
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = 'squaddle'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
}

export function clear(svg: HTMLElement) {
    svg.innerHTML = ''
}

export type Size = {
    w: number
    h: number
}

type InteractiveSvgParams = {
    init: (svg: HTMLElement, size: Size) => void
}

export function initInteractiveSvg(params: InteractiveSvgParams) {
    const { init } = params

    const saveBtn = document.getElementById('save')!
    saveBtn.addEventListener('click', () => save('svg'))

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
        svg.setAttribute(
            'viewbox',
            `0 0 ${size.h.toString()} ${size.h.toString()}`
        )

        init(svg, size)
    }

    restart()

    window.addEventListener('resize', restart)
}
