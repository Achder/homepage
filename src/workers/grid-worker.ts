// Computes the noise displacement for a band of grid rows. The grid page splits
// each job across several of these workers.

import { computeDisplacement, type GridNoise } from '../utils/grid-field'

export type GridWorkerRequest = {
    job: number
    noise: GridNoise
    rowStart: number
    rowEnd: number
}

export type GridWorkerResponse = {
    job: number
    rowStart: number
    displacement: Float32Array
}

self.onmessage = (event: MessageEvent<GridWorkerRequest>) => {
    const { job, noise, rowStart, rowEnd } = event.data
    const displacement = computeDisplacement(noise, rowStart, rowEnd)
    const response: GridWorkerResponse = { job, rowStart, displacement }
    self.postMessage(response, { transfer: [displacement.buffer] })
}
