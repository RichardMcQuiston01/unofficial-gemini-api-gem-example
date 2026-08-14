# CHANGELOG

## [Unreleased]

### Added

- Vercel deployment for the browser demo: web-handler serverless functions
  (`api/defaults.ts`, `api/generate.ts`) that reuse the demo's serialized
  `generateWithUploads` (writing per-request temp assets under `/tmp`), plus
  a `vercel.json` that builds the Vite frontend and serves it statically.
  The user-entered API key means no server-side `GEMINI_API_KEY` is
  required.

### Changed

- Refreshed the demo's floating donation card to a horizontal layout — QR
  code on the left, message on the right, and a "Donate via Stripe →" link.

## [0.1.0] - 2026-08-13

### Added

- Initial package scaffold: `generateIcon()` ported from crafterkit's
  `apps/admin/src/lib/gemini/` as a standalone, dual ESM/CJS package
  (`src/client.ts`, `src/iconGenerator.ts`, `src/types.ts`, `src/index.ts`).
- `package.json`, `tsconfig.json`, and a `tsup` build config producing
  ESM + CJS + bundled `.d.ts` output in `dist/`.
- `vitest` test suite covering `generateIcon()`, and a runnable
  `examples/generate-icon.ts` demo script that writes the generated icon
  to disk.
- Browser SPA demo (`demo/`): upload or drag-and-drop reference images,
  edit the system prompt, and generate an icon in the browser. Vanilla
  TS + Tailwind CSS frontend (Vite), single-process Bun backend that
  builds a per-request temp assets directory and calls `generateIcon()`
  via `GEMINI_ASSETS_DIR` — no changes to the package's public API.
  Requests are serialized (one generation at a time). Run with
  `bun run demo:build && bun run demo:start`.
- Docker packaging for the browser demo: a multi-stage `Dockerfile`
  (builds the Vite frontend, then runs the Bun server in a slim runtime
  image) plus a `.dockerignore` and a `docker-compose.yml` convenience
  wrapper. Run with `docker build -t gemini-icon-gen-demo . && docker run
  --rm -p 3000:3000 -e GEMINI_API_KEY=... gemini-icon-gen-demo`, or
  `docker compose up --build`. `GEMINI_API_KEY` is supplied at run time
  and never baked into the image.
- Continuous integration via GitHub Actions (`.github/workflows/ci.yml`):
  on every pull request and push to `main`, installs with a frozen
  lockfile and runs the tests, both typechecks, and the package and demo
  builds on Bun. Tests run without a `GEMINI_API_KEY` since the suite
  mocks the Gemini client.
- npm publish readiness: `publishConfig.access: "public"` so the scoped
  package publishes publicly, a `prepublishOnly` build hook, `homepage` /
  `bugs` / `keywords` metadata, `sideEffects: false` for consumer
  tree-shaking, and a `Release` workflow (`.github/workflows/release.yml`)
  that verifies the tag matches `package.json`, runs tests and build, and
  publishes to npm with provenance on a published GitHub Release. A
  "Releasing" section in the README documents the flow and the required
  `NPM_TOKEN` secret.
- Dismissible floating donation card in the browser demo: an inline,
  scannable QR code (generated from the donation URL) and a clickable
  card linking to the Stripe donation page, with a close button.
- Optional per-request `apiKey` on `IconGenerationRequest`, overriding the
  `GEMINI_API_KEY` env var (an explicit key yields a fresh, non-memoized
  client). The browser demo uses this to let users enter their own Gemini
  API key in the page — kept only in the page (not stored) and sent with
  each request — so the server no longer needs `GEMINI_API_KEY` set. If the
  server does have one configured, leaving the field blank falls back to
  it; `docker-compose.yml` now treats the key as optional too.

### Changed

- README polish: added npm-version and license badges, a `generateIcon()`
  API reference (request/result field tables and the default model name),
  and a tightened quickstart with a runnable persist-to-disk snippet and
  cross-links to Configuration.
