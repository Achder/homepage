# Lessons

- Generative pages draw through `src/vector/` (`initPlayground` + `VectorTarget`). Live view = Canvas2D, export = SVG string. Do not build SVG DOM per frame; it is the main cost.
- Expensive color work (colorjs mix, soft proof) goes through `colorRamp` lookup tables, never per shape per frame.
- Heavy CPU geometry (e.g. marching squares) goes to a Web Worker with "latest request wins"; keep a sync path for export.
- Puppeteer's bundled Chrome is not installed locally; set `PUPPETEER_EXECUTABLE_PATH` to system Chrome to test `/preview/*`.
- When porting GLSL to JS, emulate float32 (`Math.fround`) wherever the result is discrete (hashes, sign tests, floor). Float64 math gave a different hash and flipped gradients in the grid noise.
