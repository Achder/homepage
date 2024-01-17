import type { Direction, Position } from './types'

type SegmentOptions = {
    maxWidth: number
    maxHeight: number
}

export class Segment {
    next: Segment | null = null
    prev: Segment | null = null
    position: Position
    options: SegmentOptions

    constructor(x: number, y: number, options: SegmentOptions) {
        this.position = { x, y }
        this.options = options
    }

    getNext(dir: Direction) {
        const { maxWidth, maxHeight } = this.options
        let nextX = this.position.x + dir.x

        if (nextX < 0) {
            nextX = maxWidth - 1
        } else if (nextX >= maxWidth) {
            nextX = 0
        }

        let nextY = this.position.y + dir.y
        if (nextY < 0) {
            nextY = maxHeight - 1
        } else if (nextY >= maxHeight) {
            nextY = 0
        }

        return new Segment(nextX, nextY, this.options)
    }
}
