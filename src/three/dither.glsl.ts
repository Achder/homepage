// Fragment + vertex shaders for the black & white dithering tool.
//
// One full-screen quad colorizes the result for every mode. Ordered/noise
// modes (Bayer 2/4/8, blue-noise via interleaved gradient noise, white noise)
// compute the 1-bit value directly from the source image — fully parallel, so
// they run in real time. Error-diffusion modes (Floyd–Steinberg, Atkinson) are
// sequential and computed on the CPU in a worker; the shader then just samples
// the resulting 1-bit mask. `uMode` selects between the two paths.
//
// Bayer thresholds use the well-known recursive `fract` formulation so we avoid
// dynamic const-array indexing (unsupported in GLSL ES 1.00).

export const ditherVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const ditherFragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform sampler2D uImage;
uniform sampler2D uMask;
uniform vec2 uImageSize;
uniform vec2 uCanvasSize;

uniform float uHasImage;   // 0 = nothing loaded yet
uniform int uMode;         // 0 = compute dither, 1 = sample precomputed mask
uniform int uAlgorithm;    // 0 bayer2, 1 bayer4, 2 bayer8, 3 blue, 4 white

uniform float uBrightness; // -1..1 added to luminance
uniform float uContrast;   // 0..2, 1 = unchanged
uniform float uGamma;      // exponent applied to luminance
uniform float uInvert;     // 0 or 1

uniform float uThreshold;  // 0..1 cut point
uniform float uAmount;     // 0 = pure threshold, 1 = full dither spread
uniform float uPixelScale; // dither cell size in canvas pixels (>= 1)

uniform vec3 uInk;
uniform vec3 uPaper;

// --- ordered/noise threshold patterns ---
float bayer2f(vec2 a) {
    a = floor(a);
    return fract(a.x * 0.5 + a.y * a.y * 0.75);
}
float bayer4f(vec2 a) { return bayer2f(0.5 * a) * 0.25 + bayer2f(a); }
float bayer8f(vec2 a) { return bayer4f(0.5 * a) * 0.25 + bayer2f(a); }

// Interleaved gradient noise — a cheap, texture-free blue-noise-like pattern.
float ign(vec2 p) {
    p = floor(p);
    return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
}

float whiteNoise(vec2 p) {
    p = floor(p);
    vec2 q = fract(p * vec2(123.34, 456.21));
    q += dot(q, q + 45.32);
    return fract(q.x * q.y);
}

float patternValue(vec2 cell) {
    if (uAlgorithm == 0) return bayer2f(cell);
    if (uAlgorithm == 1) return bayer4f(cell);
    if (uAlgorithm == 2) return bayer8f(cell);
    if (uAlgorithm == 3) return ign(cell);
    return whiteNoise(cell);
}

float adjustLuminance(vec3 rgb) {
    float l = dot(rgb, vec3(0.299, 0.587, 0.114));
    l += uBrightness;
    l = (l - 0.5) * uContrast + 0.5;
    l = clamp(l, 0.0, 1.0);
    l = pow(l, uGamma);
    l = mix(l, 1.0 - l, uInvert);
    return clamp(l, 0.0, 1.0);
}

void main() {
    if (uHasImage < 0.5) {
        gl_FragColor = vec4(uPaper, 1.0);
        return;
    }

    // Letterbox-fit the image inside the (A4) canvas, preserving aspect.
    vec2 p = vUv * uCanvasSize;
    float fitScale = min(uCanvasSize.x / uImageSize.x, uCanvasSize.y / uImageSize.y);
    vec2 drawSize = uImageSize * fitScale;
    vec2 offset = (uCanvasSize - drawSize) * 0.5;

    // Quantize to dither cells (pixelation / dot size).
    vec2 cell = floor(p / uPixelScale);
    vec2 sampleP = (cell + 0.5) * uPixelScale;
    vec2 imageUV = (sampleP - offset) / drawSize;

    if (imageUV.x < 0.0 || imageUV.x > 1.0 || imageUV.y < 0.0 || imageUV.y > 1.0) {
        gl_FragColor = vec4(uPaper, 1.0);
        return;
    }

    float bit;
    if (uMode == 1) {
        // Precomputed error-diffusion mask: already 1-bit, just read it.
        // DataTexture ignores flipY, so flip V here to match the image texture.
        bit = step(0.5, texture2D(uMask, vec2(imageUV.x, 1.0 - imageUV.y)).r);
    } else {
        float l = adjustLuminance(texture2D(uImage, imageUV).rgb);
        float t = uThreshold + (patternValue(cell) - 0.5) * uAmount;
        bit = step(t, l); // 1 = light -> paper, 0 = dark -> ink
    }

    gl_FragColor = vec4(mix(uInk, uPaper, bit), 1.0);
}
`
