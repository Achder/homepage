import type { Field, Direction, Position } from './types'
import { Segment } from './segment'

export class Snake {
    first: Segment | null
    last: Segment | null
    field: Field
    nextDir: Direction

    constructor(x: number, y: number, field: Field, startDir: Direction) {
        this.first = new Segment(x, y, {
            maxWidth: field.width,
            maxHeight: field.height,
        })

        this.last = this.first
        this.field = field
        this.nextDir = startDir
    }

    collidesWith(position: Position, startOffset: number = 0) {
        let segment = this.first
        let offsetCount = 0
        while (segment) {
            if (offsetCount < startOffset) {
                offsetCount++
                segment = segment.next
                continue
            }

            if (
                segment.position.x === position.x &&
                segment.position.y === position.y
            ) {
                return true
            }

            segment = segment.next
        }

        return false
    }

    extend(dir: Direction) {
        if (!this.first) {
            return
        }

        const segment = this.first.getNext(dir)
        segment.next = this.first
        this.first.prev = segment
        this.first = segment
    }

    removeLast() {
        if (!this.last) {
            return
        }

        this.last = this.last.prev

        if (!this.last) {
            return
        }

        this.last.next = null
    }

    step(dir: Direction) {
        this.extend(dir)
        this.removeLast()
    }
}
