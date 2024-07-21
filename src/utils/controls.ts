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
