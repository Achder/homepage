# AGENTS.md

## Cursor Cloud specific instructions

This is a single Astro application (not a monorepo) — a personal portfolio/homepage with interactive SVG art playgrounds, a Snake game, and an OG image preview endpoint.

### Key commands

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Type check | `npm run check` (runs `astro check`) |
| Build | `npm run build` (runs `astro check && astro build`) |
| Dev server | `npm run dev` (serves on `http://localhost:4321`, binds to `--host`) |
| Prettier | `npx prettier --check .` / `npx prettier --write .` |

### Caveats

- **Node.js 24 required** — `package.json` engines and `mise.toml` both specify Node >= 24. Use `nvm install 24 && nvm alias default 24` if the default version is older.
- **Puppeteer / Chromium** — The `/preview/[...name]` SSR endpoint launches headless Chrome via Puppeteer. The browser binary is downloaded automatically during `npm install`. In the Cloud Agent VM, Chrome needs `--no-sandbox` (already set in the codebase). D-Bus warnings in stderr are harmless.
- **No `.env` required** — The app has no required environment variables for local development.
- **Static output with SSR adapter** — The Astro config uses `output: 'static'` with `@astrojs/node` adapter solely for the dynamic OG preview route (`prerender = false`).
- **Font warnings** — Build may emit a CSS warning about `@color-profile` at-rule; this is expected and harmless.
