# gemini-icon-gen

Generate style-consistent images and text with Google's Gemini API, the
same way a Gemini "Gem" does: give it instructions plus reference images,
get a new image that matches.

[![CI](https://github.com/RichardMcQuiston01/unofficial-gemini-api-gem-example/actions/workflows/ci.yml/badge.svg)](https://github.com/RichardMcQuiston01/unofficial-gemini-api-gem-example/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@richardmcquiston01/gemini-icon-gen.svg)](https://www.npmjs.com/package/@richardmcquiston01/gemini-icon-gen)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/license/apache-2-0/)

> **Disclaimer:** This is an independent, unofficial project and is not
> affiliated with, endorsed by, or sponsored by Google. "Gemini" is a
> trademark of Google LLC, used here only to indicate compatibility.

**[Try the live demo](https://gemini-icon-gen.vercel.app/)** · Bring your
own Gemini API key.

## Why

I needed hundreds of icons for a website that all looked like they
belonged together. I prototyped with a Gemini Gem, then wrote code to run
the same job automatically: hundreds of icons in a few minutes. This
package is that code.

## Features

- **`generateIcon()`**: new image in the style of your reference images
  and system instructions.
- **`generateText()`**: rewrite input text using a reusable base prompt.
- **`editImage()`**: change an existing image from a prompt.
- Typed API, shipped as both ESM and CommonJS.
- Never writes to disk. You decide where the output goes.

## Installation

Requires Node.js 20+ and a [Gemini API key](https://ai.google.dev).

```bash
npm install @richardmcquiston01/gemini-icon-gen
# or
bun add @richardmcquiston01/gemini-icon-gen
```

## Quick start

```ts
import { writeFile } from "node:fs/promises";
import { generateIcon } from "@richardmcquiston01/gemini-icon-gen";

const result = await generateIcon({
  subject: "CO2 Laser Engraver",
  styleNotes: "Include a small flame icon in the corner", // optional
});

if (result.success && result.imageData) {
  await writeFile("icon.png", Buffer.from(result.imageData, "base64"));
} else {
  console.error(result.error);
}
```

Set `GEMINI_API_KEY` first (see [Configuration](#configuration)). Without
your own assets directory, the bundled style references and instructions
are used.

## Usage

### Generate text

A base prompt acts like a Gem's instructions. The bundled default turns a
product description into a short Facebook post.

```ts
import { generateText } from "@richardmcquiston01/gemini-icon-gen";

const result = await generateText({
  input: "Handmade soy candle, 8oz, lavender and cedarwood scent.",
});

console.log(result.success ? result.text : result.error);
```

### Edit an image

`editImage()` reads nothing from the assets directory: pass the image
(base64) and a prompt.

```ts
import { readFile, writeFile } from "node:fs/promises";
import { editImage } from "@richardmcquiston01/gemini-icon-gen";

const photo = await readFile("product.jpg");
const result = await editImage({
  image: { data: photo.toString("base64"), mimeType: "image/jpeg" },
  prompt: "Place the product on a light oak table in soft daylight.",
  instructions: "Keep the product exactly as it is. Do not add text.",
});

if (result.success && result.imageData) {
  await writeFile("edited.png", Buffer.from(result.imageData, "base64"));
} else {
  console.error(result.error);
}
```

## Configuration

Set environment variables directly or in a `.env` file (see
`.env.example`).

| Variable             | Required | Purpose                                                              |
| -------------------- | -------- | -------------------------------------------------------------------- |
| `GEMINI_API_KEY`     | Yes\*    | Your Gemini API key. \*Not needed if you pass `apiKey` per call.      |
| `GEMINI_IMAGE_MODEL` | No       | Overrides the image model (`generateIcon`, `editImage`).             |
| `GEMINI_TEXT_MODEL`  | No       | Overrides the text model (`generateText`).                           |
| `GEMINI_ASSETS_DIR`  | No       | Directory to read the files listed below from.                       |
| `DEMO_PORT`          | No       | Port for the browser demo server (default `3000`).                   |

Default models: `gemini-2.5-flash-image` (image) and `gemini-3.8-flash`
(text).

### Assets directory

`generateIcon()` and `generateText()` read from `GEMINI_ASSETS_DIR`, or the
package's bundled `assets/` if unset:

```
assets/
  gem-instructions.txt    # system instruction for generateIcon()
  text-instructions.txt   # base prompt for generateText()
  icon-examples/          # style references (.png .jpg .jpeg .webp)
```

A missing `icon-examples/` logs a warning and continues without
references. A missing instructions file is simply omitted.

## API reference

Each function returns a result object; check `success` before using it.

### `generateIcon(request)`

```ts
function generateIcon(
  request: IconGenerationRequest,
): Promise<IconGenerationResult>;
```

| Field        | Type     | Required | Description                                          |
| ------------ | -------- | -------- | ---------------------------------------------------- |
| `subject`    | `string` | Yes      | Short label for the subject, e.g. `"CO2 Laser"`.     |
| `styleNotes` | `string` | No       | Extra style notes appended to the prompt.            |
| `apiKey`     | `string` | No       | Overrides `GEMINI_API_KEY` for this call.            |

Returns `{ success: true, imageData, mimeType }` (base64 image bytes and
MIME type such as `image/png`) or `{ success: false, error }`.

### `generateText(request)`

```ts
function generateText(
  request: TextGenerationRequest,
): Promise<TextGenerationResult>;
```

| Field          | Type     | Required | Description                                       |
| -------------- | -------- | -------- | ------------------------------------------------- |
| `input`        | `string` | Yes      | The text to transform.                            |
| `instructions` | `string` | No       | Base prompt; overrides `text-instructions.txt`.   |
| `model`        | `string` | No       | Overrides `GEMINI_TEXT_MODEL` for this call.      |
| `apiKey`       | `string` | No       | Overrides `GEMINI_API_KEY` for this call.         |

Returns `{ success: true, text }` or `{ success: false, error }`.

### `editImage(request)`

```ts
function editImage(request: ImageEditRequest): Promise<ImageEditResult>;
```

| Field             | Type            | Required | Description                                             |
| ----------------- | --------------- | -------- | ------------------------------------------------------- |
| `image`           | `InlineImage`   | Yes      | Image to edit: `{ data, mimeType }`, base64 PNG/JPEG/WebP. |
| `prompt`          | `string`        | Yes      | What to change.                                         |
| `instructions`    | `string`        | No       | System instruction, e.g. rules the edit must keep.      |
| `referenceImages` | `InlineImage[]` | No       | Extra images sent after `image`, e.g. a background.     |
| `model`           | `string`        | No       | Overrides `GEMINI_IMAGE_MODEL` for this call.           |
| `apiKey`          | `string`        | No       | Overrides `GEMINI_API_KEY` for this call.               |

Returns `{ success: true, imageData, mimeType, text? }` (`text` is any note
Gemini sent with the image) or `{ success: false, error }`. If Gemini
replies without an image, the error includes its finish reason and text.

## Examples and demo

Runnable scripts live in `examples/` and need `GEMINI_API_KEY`:

```bash
bun run example        # generateIcon() with the bundled assets
bun run example:text   # generateText() on a sample product description
```

The `demo/` directory is a browser app where you enter your own API key,
upload reference images, edit the prompt, and generate an icon. See the
[demo hosting guide](docs/DEMO.md) for Docker and Vercel instructions.

## Development

```bash
bun install
bun run typecheck   # tsc --noEmit
bun run test        # vitest
bun run build       # tsup → dist/ (ESM + CJS + .d.ts)
```

## Troubleshooting

- **`GEMINI_API_KEY is not set`**: set the variable or pass `apiKey`. The
  client fails immediately rather than sending a doomed request.
- **`Gemini returned no image data...`**: the API replied without an image.
  Check that your key is valid and the model supports image output.
- **Style references ignored**: only `.png`, `.jpg`, `.jpeg` and `.webp`
  files in `icon-examples/` are read; other files are skipped silently.
- **Model not found (404)**: Google retires models over time. Set
  `GEMINI_IMAGE_MODEL` or `GEMINI_TEXT_MODEL` to a currently available one.

## License

[Apache-2.0](LICENSE). Copyright (c) 2026 Richard McQuiston. This
copyright covers the original code and content of this project only; it
grants no rights to the "Gemini" name or any Google trademarks, which
remain the property of Google LLC.

## Author

Richard McQuiston · [richardmcquiston.com](https://richardmcquiston.com/) ·
[richard.mcquiston01@gmail.com](mailto:richard.mcquiston01@gmail.com)

## Buy Me a Coffee

If this app, code, or repository has helped you or someone you know, please consider donating. I appreciate any help to offset the costs of development and/or AI Credits.

[**Donate via Stripe**](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800), or scan:

[![Donate via Stripe](./donate.svg)](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800)
