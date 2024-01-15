import { Snake } from "./snake";
import type { Field, Direction } from "./types";

export class Game {
  snake: Snake;
  field: Field;

  segmentSize = 20;
  segmentBorder = 2;

  lastTime = 0;
  counter = 0;
  maxCount = 100;

  nextDir: Direction = {
    x: 0,
    y: -1,
  };

  destruct = false;

  constructor(field: Field, segmentSize: number) {
    this.field = field;
    this.segmentSize = segmentSize;

    this.snake = new Snake(Math.ceil(field.width / 2), field.height - 4, field);
    this.snake.extend(this.nextDir);
    this.snake.extend(this.nextDir);
    this.snake.extend(this.nextDir);

    window.addEventListener("keydown", this.onChangeDirection.bind(this));
  }

  destructor() {
    this.destruct = true;
    window.removeEventListener("keydown", this.onChangeDirection);
  }

  onChangeDirection(event: KeyboardEvent) {
    let proposal;
    switch (event.key) {
      case "ArrowRight":
        proposal = {
          x: -this.nextDir.y,
          y: this.nextDir.x,
        };
        break;
      case "ArrowLeft":
        proposal = {
          x: this.nextDir.y,
          y: -this.nextDir.x,
        };
        break;
      default:
        proposal = null;
    }

    if (!proposal) {
      return;
    }

    const extended = this.snake.first?.getNext(proposal) ?? null;
    if (!this.snake.hit(extended)) {
      this.nextDir = proposal;
      this.draw();
    }
  }

  stepper() {
    let step = false;
    const curTime = Date.now();

    if (this.lastTime) {
      this.counter += curTime - this.lastTime;
      if (this.counter > this.maxCount) {
        step = true;
        this.counter %= this.maxCount;
      }
    }
    this.lastTime = curTime;
    return step;
  }

  update() {
    this.snake.step(this.nextDir);
  }

  draw() {
    const canvas = document.querySelector("canvas");
    const ctx = canvas?.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0);

    const docStyle = getComputedStyle(document.documentElement);
    const dark = docStyle.getPropertyValue("--dark");
    const light = docStyle.getPropertyValue("--light");

    // draw grid
    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;
    for (let x = 1; x < this.field.width; x++) {
      ctx.moveTo(x * this.segmentSize, 0);
      ctx.lineTo(x * this.segmentSize, this.field.height * this.segmentSize);
    }
    for (let y = 1; y < this.field.height; y++) {
      ctx.moveTo(0, y * this.segmentSize);
      ctx.lineTo(this.field.width * this.segmentSize, y * this.segmentSize);
    }
    ctx.stroke();
    ctx.closePath();

    // draw snake
    let segment = this.snake.first;
    while (segment) {
      ctx.fillStyle = dark;
      ctx.fillRect(
        segment.x * this.segmentSize,
        segment.y * this.segmentSize,
        this.segmentSize,
        this.segmentSize
      );
      ctx.strokeStyle = light;
      ctx.lineWidth = this.segmentBorder;
      ctx.strokeRect(
        segment.x * this.segmentSize,
        segment.y * this.segmentSize,
        this.segmentSize,
        this.segmentSize
      );
      segment = segment.next;
    }

    // draw direction
    const target = this.snake.first?.getNext(this.nextDir);
    if (!target) {
      return;
    }

    const radius = this.segmentSize / 2;
    ctx.fillStyle = "rgb(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(
      target.x * this.segmentSize + this.segmentSize / 2,
      target.y * this.segmentSize + this.segmentSize / 2,
      this.segmentSize / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.closePath();
  }

  loop() {
    if (this.stepper()) {
      this.update();
      this.draw();
    }

    if (this.destruct) {
      return;
    }

    requestAnimationFrame(() => this.loop());
  }
}
