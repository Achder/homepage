import type { Direction } from './types'

type SegmentOptions = {
  maxWidth: number
  maxHeight: number
}

export class Segment {
  next: Segment | null = null
  prev: Segment | null = null
  x: number
  y: number
  options: SegmentOptions

  constructor(x: number, y: number, options: SegmentOptions) {
    this.x = x
    this.y = y
    this.options = options
  }

  getNext(dir: Direction) {
    const { maxWidth, maxHeight } = this.options
    let nextX = this.x + dir.x

    if(nextX < 0) {
      nextX = maxWidth - 1
    } else if(nextX >= maxWidth) {
      nextX = 0
    }

    let nextY = this.y + dir.y
    if(nextY < 0) {
      nextY = maxHeight - 1
    } else if(nextY >= maxHeight) {
      nextY = 0
    }

    return new Segment(nextX, nextY, this.options)
  }
}