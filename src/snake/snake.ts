import type { Field, Direction } from './types'
import { Segment } from './segment'

export class Snake {

  first: Segment | null
  last: Segment | null
  field: Field

  constructor(x: number, y: number, field: Field) {
    this.first = new Segment(x, y, {
      maxWidth: field.width,
      maxHeight: field.height
    })

    this.last = this.first
    this.field = field
  }

  extend(dir: Direction) {
    if(!this.first) {
      return
    }

    const segment = this.first.getNext(dir)
    segment.next = this.first
    this.first.prev = segment
    this.first = segment
  }

  removeLast() {
    if(!this.last) {
      return
    }

    this.last = this.last.prev

    if(!this.last) {
      return 
    }

    this.last.next = null
  }

  step(dir: Direction) {
    this.extend(dir)
    this.removeLast()
  }

  hit(test: Segment | null) {
    if(!test) {
      return false
    }

    let segment = this.first
    while(segment) {
      if(test.x === segment.x && test.y === segment.y) {
        return true
      }
      segment = segment.next
    }
    return false
  }
}