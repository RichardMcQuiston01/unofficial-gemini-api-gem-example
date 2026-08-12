# CHANGELOG

## [Unreleased]

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

### Changed

- README polish: added npm-version and license badges, a `generateIcon()`
  API reference (request/result field tables and the default model name),
  and a tightened quickstart with a runnable persist-to-disk snippet and
  cross-links to Configuration.
