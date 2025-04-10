type InputElement = HTMLInputElement | HTMLSelectElement

const start = new Map<InputElement, number>()
const end = new Map<InputElement, number>()

export function setAnimation(map: 'start' | 'end', inputs: Element[]) {
    for (const input of inputs) {
        if (!(input instanceof HTMLInputElement) || input.type !== 'range') {
            continue
        }

        if (map === 'start') {
            start.set(input, Number(input.value))
        } else {
            end.set(input, Number(input.value))
        }
    }

    console.log(start, end)
}

export function animate(seconds: number) {
    const frames = seconds * 60
    let count = 0

    const anim = () => {
        console.log('Frame', count)
        for (const [element, startValue] of start.entries()) {
            const endValue = end.get(element) || startValue
            const t = count / frames
            const smooth = t * t * (3 - 2 * t)
            const value = startValue + (endValue - startValue) * smooth
            element.value = value.toString()
        }

        ;[...start.keys()][0].dispatchEvent(new Event('input'))

        count++
        if (count < frames) {
            requestAnimationFrame(anim)
        }
    }

    requestAnimationFrame(anim)
}
