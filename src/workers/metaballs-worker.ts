// Computes metaball iso bands off the main thread; the library call is the slow
// part at fine resolutions.

import { computeLayers, type MetaballsLayers, type MetaballsParams } from '../utils/metaballs'

export type MetaballsWorkerRequest = {
    key: string
    params: MetaballsParams
}

export type MetaballsWorkerResponse = {
    key: string
    params: MetaballsParams
    layers: MetaballsLayers
}

self.onmessage = (event: MessageEvent<MetaballsWorkerRequest>) => {
    const { key, params } = event.data
    const response: MetaballsWorkerResponse = { key, params, layers: computeLayers(params) }
    self.postMessage(response)
}
