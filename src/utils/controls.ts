import { pushUndo } from './state'

export function getInputValue<T>(id: string, renderCallback: () => void) {
    const element = document.getElementById(id)! as HTMLInputElement

    // add initial listener
    // this should only happen the first time after the page was initialized
    const listener = listeners.get(element)
    if (!listener) {
        connect(id, renderCallback)
    }

    // parse value
    if (!isNaN(element.valueAsNumber)) {
        return element.valueAsNumber as T
    }

    return element.value as T
}

export function getChecked(id: string) {
    const element = document.getElementById(id)! as HTMLInputElement
    return element.checked
}

export function readFromUrl(id: string) {
    const searchParams = new URLSearchParams(window.location.search)
    return searchParams.get(id)
}

export function writeToUrl(id: string, value: string) {
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set(id, value)
    pushUndo(`?${searchParams.toString()}`)
}

export const listeners = new Map<Element, Partial<Record<keyof HTMLElementEventMap, () => void>>>()

export function getAllListenerElements() {
    return [...listeners.keys()]
}

export function clearAllListeners() {
    for (const [element, eventMap] of listeners) {
        for (const [type, callback] of Object.entries(eventMap)) {
            element.removeEventListener(type, callback)
        }
    }

    listeners.clear()
}

export function addListener(element: Element, type: keyof HTMLElementEventMap, callback: () => void) {
    const eventMap = listeners.get(element)
    const existingListener = eventMap?.[type]

    if (existingListener) {
        element.removeEventListener(type, existingListener)
    }

    element.addEventListener(type, callback)
    listeners.set(element, {
        ...eventMap,
        [type]: callback,
    })
}

export function connect(id: string, callback: () => void) {
    const element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement
    if (!element) {
        throw new Error(`Element with id ${id} not found`)
    }

    const urlValue = readFromUrl(id)
    if (urlValue) {
        element.value = urlValue
    }

    addListener(element, 'change', () => writeToUrl(id, element.value))
    addListener(element, 'input', callback)
}

export function connectClick(id: string, callback: () => void) {
    const element = document.getElementById(id)! as HTMLButtonElement
    addListener(element, 'click', callback)
}

export function shiftLeft<T>(arr: T[]) {
    const first = arr.shift()!
    return [...arr, first]
}
