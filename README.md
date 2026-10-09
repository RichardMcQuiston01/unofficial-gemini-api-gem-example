# unofficial-gemini-api-gem-example

- Author: Richard McQuiston
- Website: [https://richardmcquiston.com/](https://richardmcquiston.com/)
- Demo: [https://gemini-icon-gen.vercel.app/](https://gemini-icon-gen.vercel.app/)
- Email: [richard.mcquiston01@gmail.com](mailto:richard.mcquiston01@gmail.com)

```
Disclaimer: This is an independent, unofficial project (see the "unofficial-" prefix in the name) and is not affiliated with, endorsed by, or sponsored by Google or Gemini. "Gemini" is a trademark of Google LLC, used here only in a descriptive, nominative sense to indicate compatibility — not to imply any official status.
```

[![CI](https://github.com/RichardMcQuiston01/unofficial-gemini-api-gem-example/actions/workflows/ci.yml/badge.svg)](https://github.com/RichardMcQuiston01/unofficial-gemini-api-gem-example/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@richardmcquiston01/gemini-icon-gen.svg)](https://www.npmjs.com/package/@richardmcquiston01/gemini-icon-gen)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/license/apache-2-0/)

## Overview

This package makes images with Google's Gemini AI. You give it a few
example pictures and some written instructions. Gemini then draws a new
image that matches the look of your examples.

I needed hundreds of icons for a website, and they all had to look like
they belonged together. I first used a Gemini "Gem" to make them. Then I
wrote code so the same job could run automatically. It made hundreds of
icons in just a few minutes.

Now I've turned that code into a package so you can use it too.

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

## Hosting the Demo

Want to run the browser demo yourself? See the
[demo hosting guide](docs/DEMO.md) for Docker and Vercel instructions.

## Troubleshooting

- **`GEMINI_API_KEY is not set`** — set the env var (see Configuration);
  the client throws immediately rather than making a doomed request.
- **`Gemini returned no image data...`** — the API responded without an
  image part. Check that your API key is valid and that the configured
  model supports image generation.
- **Style references are ignored** — only `.png`, `.jpg`, `.jpeg`, and
  `.webp` files under `icon-examples/` are read; other extensions are
  skipped silently.

## License

[Apache-2.0](https://opensource.org/license/apache-2-0/)

## Copyright

Copyright (c) 2026 Richard McQuiston

This copyright applies to the original code and content of this project only.
It does not extend to, and no license is granted for, use of the "Gemini"
name or any Google trademarks, which remain the property of Google LLC.

## Buy Me a Coffee

If this app, code, or repository has helped you or someone you know, please consider donating. I appreciate any help to offset the costs of development and/or AI Credits.

[**Donate via Stripe**](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800), or scan:

[![Donate via Stripe](./donate.svg)](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800)
