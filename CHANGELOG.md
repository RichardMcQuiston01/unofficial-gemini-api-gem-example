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
