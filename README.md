# unofficial-gemini-api-gem-example

```
Disclaimer: This is an independent, unofficial project (see the "unofficial-" prefix in the name) and is not affiliated with, endorsed by, or sponsored by Google or Gemini. "Gemini" is a trademark of Google LLC, used here only in a descriptive, nominative sense to indicate compatibility — not to imply any official status.
```

[![CI](https://github.com/RichardMcQuiston01/unofficial-gemini-api-gem-example/actions/workflows/ci.yml/badge.svg)](https://github.com/RichardMcQuiston01/unofficial-gemini-api-gem-example/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@richardmcquiston01/gemini-icon-gen.svg)](https://www.npmjs.com/package/@richardmcquiston01/gemini-icon-gen)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/license/apache-2-0/)

## Overview

TypeScript agnostic NPM package that can be used to generate images using Google's Gemini API. Provide reference image(s) that demonstrate the desired style, colors, and composition. Use the provided sample prompt text as a base and modify as needed.

While building out a web application, I needed hundreds of icons for different electronics that needed to maintain the same look and feel. I started with creating a Gem in Gemini, which was instrumental in generating the initial batch of icons.

Wondering if this could be done via TypeScript and Gemini's API, I successfully added it to the web application. The results were surprisingly good, and I was able to generate hundreds of icons for the web application in a matter of minutes.

I then decided to turn this into a standalone NPM package that could be used by others along with myself.

## Prerequisites

- Node.js 24.19.0 (LTS)
- A Google Gemini API key ([ai.google.dev](https://ai.google.dev))

## Configuration

Set these as environment variables (e.g. in a `.env` file — see
`.env.example`):

| Variable             | Required | Purpose                                                                 |
| -------------------- | -------- | ----------------------------------------------------------------------- |
| `GEMINI_API_KEY`     | Yes      | Your Google Gemini API key                                              |
| `GEMINI_IMAGE_MODEL` | No       | Overrides the default image-generation model                            |
| `GEMINI_ASSETS_DIR`  | No       | Overrides where `gem-instructions.txt` / `icon-examples/` are read from |
| `DEMO_PORT`          | No       | Port the browser demo server listens on (default `3000`)               |

## Installation

```bash
bun add @richardmcquiston01/gemini-icon-gen
# or
npm install @richardmcquiston01/gemini-icon-gen
```

## Usage

Set `GEMINI_API_KEY` (see [Configuration](#configuration)), then:

```ts
import { generateIcon } from "@richardmcquiston01/gemini-icon-gen";
import { writeFile } from "node:fs/promises";

const result = await generateIcon({
  subject: "CO2 Laser Engraver",
  styleNotes: "Include a small flame icon in the corner", // optional
});

if (result.success) {
  // result.imageData is base64; the library never writes to disk itself.
  await writeFile("icon.png", Buffer.from(result.imageData ?? "", "base64"));
} else {
  console.error(result.error);
}
```

Reference images (style examples) and the system prompt
(`gem-instructions.txt`) are read from an assets directory — see
[Configuration](#configuration) for how to point at your own.

## API reference

### `generateIcon(request)`

```ts
function generateIcon(
  request: IconGenerationRequest,
): Promise<IconGenerationResult>;
```

Generates a single icon matching the style of the reference images and
system instructions in the configured assets directory. It never writes
to disk — persist `imageData` yourself.

**`IconGenerationRequest`**

| Field        | Type     | Required | Description                                                                        |
| ------------ | -------- | -------- | ---------------------------------------------------------------------------------- |
| `subject`    | `string` | Yes      | Short label for the subject, e.g. `"CO2 Laser Engraver"`.                           |
| `styleNotes` | `string` | No       | Extra style notes appended to the prompt, e.g. `"Include a small flame in the corner"`. |
| `apiKey`     | `string` | No       | Gemini API key for this call; overrides the `GEMINI_API_KEY` env var.               |

**`IconGenerationResult`**

| Field       | Type      | Description                                                     |
| ----------- | --------- | -------------------------------------------------------------- |
| `success`   | `boolean` | Whether an image was generated.                               |
| `imageData` | `string`  | Base64-encoded image bytes. Present on success.               |
| `mimeType`  | `string`  | MIME type of `imageData`, e.g. `"image/png"`. Present on success. |
| `error`     | `string`  | Failure reason. Present when `success` is `false`.            |

The reference images and system prompt are read from an assets directory,
and the model defaults to `gemini-2.5-flash-image` — both configurable via
the [environment variables above](#configuration).

## Examples

`examples/generate-icon.ts` is a runnable end-to-end demo: it loads the
committed `assets/gem-instructions.txt` and a few reference icons from
`assets/icon-examples/`, calls `generateIcon()`, and writes the
resulting image to disk. Run it with:

```bash
bun run example
```

## Demo

A browser-based SPA demo lives in `demo/`: enter your Gemini API key,
upload one or more reference images (or drag & drop them), edit the
system prompt, enter a subject, and generate an icon in the browser.
It's a separate consumer of this package — a temp assets directory is
built per request and passed to `generateIcon()` via `GEMINI_ASSETS_DIR`,
so the demo never touches the package's public API.

The API key can be entered in the page (kept only in the page and sent
with each request — it isn't stored, so re-enter it after a reload) — so
you don't need `GEMINI_API_KEY` set on the server. If the server _does_
have `GEMINI_API_KEY` set, leaving the field blank falls back to it.

```bash
bun run demo:build
bun run demo:start
```

Then open `http://localhost:3000` (or `$DEMO_PORT`, see Configuration
above). For frontend-only iteration with hot reload, run
`bun run demo:dev` alongside the server (`bun run demo:start`) — the
Vite dev server proxies `/api` and `/default-assets` requests to it.

Generation requests are processed one at a time (not concurrently, by
design — see `demo/server/generateQueue.ts`).

### Running the demo in Docker

The demo is also packaged as a single, self-contained container. The
image builds the frontend and runs the Bun server; no local Bun or
Node.js install is required — just Docker (and a Gemini API key, which
you can either pass in or enter in the page).

```bash
docker build -t gemini-icon-gen-demo .
docker run --rm -p 3000:3000 -e GEMINI_API_KEY=your-key gemini-icon-gen-demo
```

Or, with Docker Compose (loads `GEMINI_API_KEY` — and optionally
`GEMINI_IMAGE_MODEL` / `DEMO_PORT` — from a `.env` file automatically):

```bash
docker compose up --build
```

Then open `http://localhost:3000`. `GEMINI_API_KEY` is optional — omit it
and enter a key in the page instead; when supplied it is passed at run
time and never baked into the image. To expose the demo on a different
host port, set `DEMO_PORT` (Compose) or change the `-p` mapping, e.g.
`-p 8080:3000`.

## Troubleshooting

- **`GEMINI_API_KEY is not set`** — set the env var (see Configuration);
  the client throws immediately rather than making a doomed request.
- **`Gemini returned no image data...`** — the API responded without an
  image part. Check that your API key is valid and that the configured
  model supports image generation.
- **Style references are ignored** — only `.png`, `.jpg`, `.jpeg`, and
  `.webp` files under `icon-examples/` are read; other extensions are
  skipped silently.

## Releasing (maintainers)

The package is published to npm by the
[`Release` workflow](.github/workflows/release.yml) whenever a GitHub
Release is published. To cut a release:

1. Bump `version` in `package.json` and move the `CHANGELOG.md`
   `[Unreleased]` entries under the new version.
2. Create a GitHub Release with a tag matching that version, prefixed
   with `v` (e.g. `v0.1.0`). The workflow fails fast if the tag and
   `package.json` version disagree.
3. The workflow installs, runs the tests and build, then
   `npm publish --provenance --access public`.

**One-time setup:** add an npm automation token as the `NPM_TOKEN`
repository secret (Settings → Secrets and variables → Actions). The
package is scoped (`@richardmcquiston01`) and publishes publicly via
`publishConfig.access`. To publish manually instead, run `npm publish`
locally with the same token authenticated (`npm whoami` to confirm), but
drop `--provenance` — provenance can only be generated from CI.

## License

[Apache-2.0](https://opensource.org/license/apache-2-0/)

## Support

If this library saved you some reverse-engineering, consider [buying me
a coffee](https://www.paypal.com/ncp/payment/VDTESHTRR7684). ☕

## Contact

E-Mail: [richard.mcquiston01@gmail.com](mailto:richard.mcquiston01@gmail.com)

## Copyright

Copyright (c) 2026 Richard McQuiston

This copyright applies to the original code and content of this project only.
It does not extend to, and no license is granted for, use of the "Gemini"
name or any Google trademarks, which remain the property of Google LLC.
