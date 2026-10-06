// 3D simplex noise, a scalar port of the Ashima / webgl-noise GLSL version (MIT).
// The hash and the gradients only depend on small integers, so both are tables.
// The tables copy the 32-bit float rounding of the GPU: exact math gives a
// different hash and flips some gradients, and the grid would lose its look for
// a given seed.

const f32 = Math.fround

// table index = hash value + offset; the float32 hash can go a little below 0
const offset = 8

// permute(x) = mod289((x * 34 + 1) * x) in float32, for every input the hash can produce
const perm = new Int16Array(offset + 289 * 3 + 1)
for (let idx = 0; idx < perm.length; idx++) {
    const x = idx - offset
    const product = f32(f32(x * 34 + 1) * x)
    perm[idx] = f32(product - f32(Math.floor(f32(product * f32(1 / 289))) * 289))
}

// float32 and exact math agree here for all cells closer than 1e6 to the origin
function mod289(x: number) {
    return x - Math.floor(x / 289) * 289
}

function hash(x: number, y: number, z: number) {
    return perm[offset + perm[offset + perm[offset + z] + y] + x]
}

// normalized gradient for every hash value, with the float32 steps of the shader:
// many gradients sit exactly on the `h = 0` edge, and the rounding decides the side
const grad = new Float64Array((offset + 289) * 3)
const n = f32(0.142857142857)
const nsx = f32(n * 2)
const nsy = f32(n * 0.5 - 1)
for (let idx = 0; idx < offset + 289; idx++) {
    const p = idx - offset
    const j = f32(p - f32(49 * Math.floor(f32(f32(p * n) * n))))
    const xi = Math.floor(f32(j * n))
    const yi = Math.floor(f32(j - f32(7 * xi)))

    let gx = f32(f32(xi * nsx) + nsy)
    let gy = f32(f32(yi * nsx) + nsy)
    const gz = f32(f32(1 - Math.abs(gx)) - Math.abs(gy))
    if (gz <= 0) {
        gx = f32(gx - f32(Math.floor(gx) * 2 + 1))
        gy = f32(gy - f32(Math.floor(gy) * 2 + 1))
    }

    // taylorInvSqrt from the shader, not the exact inverse square root
    const norm = 1.79284291400159 - 0.85373472095314 * (gx * gx + gy * gy + gz * gz)
    grad[idx * 3] = gx * norm
    grad[idx * 3 + 1] = gy * norm
    grad[idx * 3 + 2] = gz * norm
}

function corner(x: number, y: number, z: number, hash: number) {
    let m = 0.6 - (x * x + y * y + z * z)
    if (m <= 0) {
        return 0
    }

    m *= m
    const g = (hash + offset) * 3
    return m * m * (grad[g] * x + grad[g + 1] * y + grad[g + 2] * z)
}

export function simplex3(x: number, y: number, z: number) {
    // skew to the simplex grid
    const s = (x + y + z) / 3
    const ix = Math.floor(x + s)
    const iy = Math.floor(y + s)
    const iz = Math.floor(z + s)

    const t = (ix + iy + iz) / 6
    const x0 = x - ix + t
    const y0 = y - iy + t
    const z0 = z - iz + t

    // find the simplex: offsets of the second (i1) and third (i2) corner
    const gx = x0 >= y0 ? 1 : 0
    const gy = y0 >= z0 ? 1 : 0
    const gz = z0 >= x0 ? 1 : 0
    const i1x = gx & (1 - gz)
    const i1y = gy & (1 - gx)
    const i1z = gz & (1 - gy)
    const i2x = gx | (1 - gz)
    const i2y = gy | (1 - gx)
    const i2z = gz | (1 - gy)

    const mx = mod289(ix)
    const my = mod289(iy)
    const mz = mod289(iz)

    return (
        42 *
        (corner(x0, y0, z0, hash(mx, my, mz)) +
            corner(
                x0 - i1x + 1 / 6,
                y0 - i1y + 1 / 6,
                z0 - i1z + 1 / 6,
                hash(mx + i1x, my + i1y, mz + i1z)
            ) +
            corner(
                x0 - i2x + 1 / 3,
                y0 - i2y + 1 / 3,
                z0 - i2z + 1 / 3,
                hash(mx + i2x, my + i2y, mz + i2z)
            ) +
            corner(x0 - 0.5, y0 - 0.5, z0 - 0.5, hash(mx + 1, my + 1, mz + 1)))
    )
}
