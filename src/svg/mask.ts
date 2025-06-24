const ns = 'http://www.w3.org/2000/svg'

type MaskParams = {
    id: string
    maskType: string
}

export function addMask(svg: HTMLElement, params: MaskParams) {
    const { id, maskType } = params

    const mask = document.createElementNS(ns, 'mask')

    mask.setAttribute('id', id)
    mask.setAttribute('mask-type', maskType)

    svg.append(mask)

    return mask
}
