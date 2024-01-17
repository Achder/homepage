import { Snake } from './snake'
import type { Field, Direction, Position, Item } from './types'

export class Game {
    numPlayers: number
    snakes: Snake[] = []
    field: Field
    items: Item[] = []

    segmentSize = 20
    segmentBorder = 2

    lastTime = 0
    counter = 0
    maxCount = 200

    destruct = false

    constructor(field: Field, segmentSize: number, numPlayers: number) {
        this.field = field
        this.segmentSize = segmentSize
        this.numPlayers = numPlayers

        this.reset()
    }

    setSpeed(speed: number) {
        this.maxCount = speed
    }

    reset() {
        this.snakes = []
        this.items = []

        this.spawnItem()
        this.spawnItem()

        const initSnake = (x: number, y: number, startDir: Direction) => {
            const snake = new Snake(x, y, this.field, startDir)
            snake.extend(snake.nextDir)
            snake.extend(snake.nextDir)
            snake.extend(snake.nextDir)
            return snake
        }

        const snake1 = initSnake(
            Math.ceil(this.field.width / (this.numPlayers === 1 ? 2 : 3)),
            this.field.height - 4,
            {
                x: 0,
                y: -1,
            }
        )

        this.onChangeDirection(snake1, 'ArrowLeft', 'ArrowRight')
        this.snakes.push(snake1)

        if (this.numPlayers < 2) {
            this.onChangeDirection(snake1, 'a', 'd')
            return
        }

        const snake2 = initSnake(
            Math.ceil((this.field.width / 3) * 2),
            this.field.height + 4,
            {
                x: 0,
                y: 1,
            }
        )

        this.onChangeDirection(snake2, 'a', 'd')
        this.snakes.push(snake2)
    }

    destructor() {
        this.destruct = true
        //window.removeEventListener('keydown', this.onChangeDirection)
    }

    spawnItem() {
        const genPosition = () => {
            return {
                x: Math.floor(Math.random() * this.field.width),
                y: Math.floor(Math.random() * this.field.height),
            }
        }

        let position = genPosition()
        while (this.snakes.some((snake) => snake.collidesWith(position))) {
            position = genPosition()
        }

        this.items.push({
            position,
        })
    }

    onChangeDirection(snake: Snake, leftKey: string, rightKey: string) {
        const onKeyDown = (event: KeyboardEvent) => {
            let proposal
            switch (event.key) {
                case leftKey:
                    proposal = {
                        x: snake.nextDir.y,
                        y: -snake.nextDir.x,
                    }
                    break
                case rightKey:
                    proposal = {
                        x: -snake.nextDir.y,
                        y: snake.nextDir.x,
                    }
                    break
                default:
                    proposal = null
            }

            if (!proposal) {
                return
            }

            const extended = snake.first?.getNext(proposal) ?? null
            if (extended && !snake.collidesWith(extended.position)) {
                snake.nextDir = proposal
                this.draw()
            }
        }

        window.addEventListener('keydown', onKeyDown)
    }

    stepper() {
        let step = false
        const curTime = Date.now()

        if (this.lastTime) {
            this.counter += curTime - this.lastTime
            if (this.counter > this.maxCount) {
                step = true
                this.counter %= this.maxCount
            }
        }
        this.lastTime = curTime
        return step
    }

    update() {
        for (const snake of this.snakes) {
            snake.extend(snake.nextDir)
            let removeLast = true

            // check self bite
            if (snake.first && snake.collidesWith(snake.first.position, 2)) {
                throw new Error("Damn, you've bit yourself!")
            }

            // check snake bite
            const hasSnakeBite = this.snakes.some((subSnake) => {
                return (
                    subSnake != snake &&
                    snake.first &&
                    subSnake.collidesWith(snake.first.position)
                )
            })
            if (hasSnakeBite) {
                throw new Error('Damn, somebody bit somebody!')
            }

            // check item grab
            for (const item of this.items) {
                if (snake.collidesWith(item.position)) {
                    this.items = this.items.filter((i) => i != item)
                    removeLast = false
                }
            }

            if (removeLast) {
                snake.removeLast()
            } else {
                this.spawnItem()
            }
        }
    }

    draw() {
        const canvas = document.querySelector('canvas')
        const ctx = canvas?.getContext('2d')

        if (!ctx) {
            return
        }

        ctx.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0)

        const docStyle = getComputedStyle(document.documentElement)
        const dark = docStyle.getPropertyValue('--dark')
        const light = docStyle.getPropertyValue('--light')
        const pink = docStyle.getPropertyValue('--pink')

        // draw grid
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.lineWidth = 1
        for (let x = 1; x < this.field.width; x++) {
            ctx.moveTo(x * this.segmentSize, 0)
            ctx.lineTo(
                x * this.segmentSize,
                this.field.height * this.segmentSize
            )
        }
        for (let y = 1; y < this.field.height; y++) {
            ctx.moveTo(0, y * this.segmentSize)
            ctx.lineTo(
                this.field.width * this.segmentSize,
                y * this.segmentSize
            )
        }
        ctx.stroke()
        ctx.closePath()

        // draw snakes
        for (const snake of this.snakes) {
            ctx.beginPath()
            let segment = snake.first
            while (segment) {
                ctx.fillStyle = dark
                ctx.roundRect(
                    segment.position.x * this.segmentSize + 4,
                    segment.position.y * this.segmentSize + 4,
                    this.segmentSize - 8,
                    this.segmentSize - 8,
                    2
                )
                segment = segment.next
            }
            ctx.fill()
            ctx.closePath()
        }

        // draw item
        ctx.beginPath()
        for (const item of this.items) {
            ctx.fillStyle = pink
            ctx.arc(
                item.position.x * this.segmentSize + this.segmentSize / 2,
                item.position.y * this.segmentSize + this.segmentSize / 2,
                this.segmentSize / 4,
                0,
                Math.PI * 2
            )
        }
        ctx.fill()
        ctx.closePath()

        // draw directions
        for (const snake of this.snakes) {
            const target = snake.first?.getNext(snake.nextDir)
            if (!target) {
                return
            }

            ctx.fillStyle = 'rgb(0, 0, 0, 0.3)'
            ctx.beginPath()
            ctx.arc(
                target.position.x * this.segmentSize + this.segmentSize / 2,
                target.position.y * this.segmentSize + this.segmentSize / 2,
                this.segmentSize / 4,
                0,
                Math.PI * 2
            )
            ctx.fill()
            ctx.closePath()
        }
    }

    loop() {
        try {
            if (this.stepper()) {
                this.update()
                this.draw()
            }

            if (this.destruct) {
                return
            }

            requestAnimationFrame(() => this.loop())
        } catch (error) {
            console.error(error)
            this.reset()
            this.loop()
        }
    }
}
