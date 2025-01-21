let undoState: string[] = [window.location.search || '?']
let redoState: string[] = []

const maxUndo = 1000
export function pushUndo(searchParams: string) {
    if (undoState.length >= maxUndo) {
        undoState.shift()
    }
    undoState.push(searchParams)
    window.history.replaceState({}, '', searchParams)

    redoState = []
}

export function undo() {
    if (undoState.length > 1) {
        const redo = undoState.pop() || null
        if (redo) {
            redoState.push(redo)
        }
    }

    window.history.replaceState({}, '', undoState?.[undoState.length - 1] ?? '?')
}

export function redo() {
    const undo = redoState.pop() || null
    if (undo) {
        undoState.push(undo)
    }

    window.history.replaceState({}, '', undo)
}
