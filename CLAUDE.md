# CLAUDE.md

Repo-wide guidance for Claude Code when working in this project.

## Project Overview

`@richardmcquiston01/gemini-icon-gen` is a standalone, TypeScript-agnostic
npm package that wraps Google's Gemini image-generation API to work the
same way a Gemini "Gem" does: give it system instructions plus one or
more reference images, and it generates a new image matching that style.
It was built to generate hundreds of consistently-styled flat icons for
a web app and is being extracted into a package others (and the author)
can reuse.

This is a **port** of working logic from the `crafterkit` monorepo
(`apps/admin/src/lib/gemini/{client,iconGenerator,types}.ts`), adapted
from an app-internal Next.js API route into a standalone library. See
"Ported API surface" below for the exact source shape.

## Tech Stack

| Concern | Choice |
|---|---|
| Language | TypeScript |
| Gemini SDK | `@google/genai` (^1.46.0 in the source app — confirm latest at scaffold time) |
| Build | `tsup` — dual ESM + CJS output with bundled `.d.ts` |
| Package manager (dev) | Bun |
| Test runner | TBD at scaffold time (Vitest is the natural fit for a Bun/tsup package) |

## Repo Layout

```
src/
  client.ts        # GoogleGenAI singleton, reads GEMINI_API_KEY
  iconGenerator.ts # generateIcon() — the package's core export
  types.ts         # IconGenerationRequest / IconGenerationResult
  index.ts         # public exports (re-exports the above)
examples/
  generate-icon.ts # runnable CLI demo — see "Examples" in README
assets/
  gem-instructions.txt   # copied verbatim from maker-toolkit
  icon-examples/*.png    # copied verbatim from maker-toolkit
demo/
  index.html, src/       # browser SPA demo (Vite + vanilla TS + Tailwind)
  server/                 # Bun.serve backend: builds a per-request temp
                           # assets dir (uploaded images + edited prompt)
                           # and calls generateIcon() via GEMINI_ASSETS_DIR
                           # — no changes to the package's public API.
                           # See "Demo" in README for how to run it.
```

`assets/`, `examples/`, and `demo/` all exist and ship in the git repo,
but are excluded from the published npm package via `package.json`'s
`"files"` allowlist (`["dist"]`).

## Commands

```bash
bun install         # install deps
bun run build        # tsup build → dist/ (ESM + CJS + .d.ts)
bun run test         # run the test suite (src/ and demo/server/)
bun run example       # run examples/generate-icon.ts against a live API key
bun run demo:build     # build the browser demo (Vite)
bun run demo:start     # run the demo server (build it first)
bun run demo:dev       # Vite dev server for demo frontend iteration
```

## Ported API Surface

Ported from crafterkit's `apps/admin/src/lib/gemini/`. Preserve this
shape — it's already proven in production:

**`client.ts`** — lazy singleton `GoogleGenAI` client:

```ts
import { GoogleGenAI } from '@google/genai';

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}
```

**`types.ts`**:

```ts
export interface IconGenerationRequest {
  /** Short label for the subject, e.g. "CO2 Laser Engraver" */
  subject: string;
  /** Optional additional style notes appended to the prompt */
  styleNotes?: string;
}

export interface IconGenerationResult {
  success: boolean;
  /** Base64-encoded image data (no disk write) */
  imageData?: string;
  mimeType?: string;
  error?: string;
}
```

**`iconGenerator.ts`** — `generateIcon(request): Promise<IconGenerationResult>`:

- Loads reference images from an assets dir's `icon-examples/`
  subdirectory (`.png`/`.jpg`/`.jpeg`/`.webp`), base64-encodes each as
  an `inlineData` part. Missing directory → warn and continue with no
  style references, not an error.
- Loads `gem-instructions.txt` from the same assets dir as plain text →
  `config.systemInstruction` (omitted entirely if the file is missing).
- Assets dir resolution: `GEMINI_ASSETS_DIR` env var if set, else default
  to this repo's own `assets/` directory (already populated with
  `gem-instructions.txt` and `icon-examples/*.png`, copied verbatim from
  maker-toolkit) — e.g. `path.join(__dirname, '../assets')` from `dist/`,
  or equivalent relative to `src/` in dev.
- Prompt: `Generate an icon for: ${subject}` + optional
  `Additional notes: ${styleNotes}` line.
- Request: `client.models.generateContent({ model, config: {
  systemInstruction?, responseModalities: ['IMAGE'] }, contents: [{
  role: 'user', parts: [...exampleImageParts, { text: promptText }] }]
  })`.
- Response: finds the first candidate's `content.parts` entry with an
  `inlineData.mimeType` starting with `image/`; returns
  `{ success: true, imageData, mimeType }`. No image part → `{ success:
  false, error }`. **The library never writes to disk** — callers
  (including the example script) are responsible for persisting
  `imageData`.

## Configuration

| Env var | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_IMAGE_MODEL` | No | Overrides the default image-generation model |
| `GEMINI_ASSETS_DIR` | No | Overrides where `gem-instructions.txt` / `icon-examples/` are read from |

**Gotcha carried forward from the port:** crafterkit had two disagreeing
default model names — `gemini-2.5-flash-image` in the generator itself
vs. `gemini-2.5-flash-preview-05-20` in an app-specific rate-limit check
that isn't being ported. This package should have exactly **one**
configurable default; don't reintroduce a second hardcoded model name
anywhere.

## Coding Conventions

Per the `typescript-style` skill — note this repo's conventions differ
from `maker-toolkit`'s (tabs/CRLF); this is an independent package:

- 2-space indent, LF line endings, trailing commas, ~80-char soft margin.
- JSDoc on all exported methods, types, and interfaces.
- Co-locate `*.test.ts` next to the file it tests.
- Prefer clear code over comments; use inline comments sparingly.

## Publishing (per the `npm-registry` skill)

- Scope: `@richardmcquiston01`. `package.json` author email:
  `richard.mcquiston01@gmail.com`.
- Keep `README.md` current with every feature addition (prerequisites,
  installation, usage).
- Update `CHANGELOG.md` before opening any PR.
- Final testing happens merged into `staging`.
- To publish: bump the version and update `CHANGELOG.md`, then PR into
  `release`.

## Status

The package (`src/`, tests, `tsup` build, `examples/generate-icon.ts`)
and the browser demo (`demo/`) are both built. The demo is also packaged
as a single container: a multi-stage `Dockerfile` (builds the Vite
frontend, then runs the Bun server in a slim runtime image), plus a
`.dockerignore` and a `docker-compose.yml` convenience wrapper — see
"Running the demo in Docker" in the README. Remaining: confirm the
container end to end with a live API key (blocked in CI environments that
can't reach Docker Hub to pull the `oven/bun` base images).
