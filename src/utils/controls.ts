export function get<T>(id: string) {
    const element = document.getElementById(id)! as HTMLInputElement
    if (!isNaN(element.valueAsNumber)) {
        return element.valueAsNumber as T
    }
    return element.value as T
}

export function connect(id: string, callback: () => void) {
    const element = document.getElementById(id)! as HTMLInputElement
    element.addEventListener('input', callback)
}

export function connectClick(id: string, callback: () => void) {
    const element = document.getElementById(id)! as HTMLButtonElement
    element.addEventListener('click', callback)
}

export function shiftLeft<T>(arr: T[]) {
    const first = arr.shift()!
    return [...arr, first]
}
