export function get<T>(id: string) {
    const element = document.getElementById(id)! as HTMLInputElement
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
    window.history.replaceState({}, '', `?${searchParams.toString()}`)
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

    element.addEventListener('change', () => writeToUrl(id, element.value))
    element.addEventListener('input', callback)
    element.dispatchEvent(new Event('change'))
}

export function connectClick(id: string, callback: () => void) {
    const element = document.getElementById(id)! as HTMLButtonElement
    element.addEventListener('click', callback)
}

export function shiftLeft<T>(arr: T[]) {
    const first = arr.shift()!
    return [...arr, first]
}
