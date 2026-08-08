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
