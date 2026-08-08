# unofficial-gemini-api-gem-example

```
Disclaimer: This is an independent, unofficial project (see the "unofficial-" prefix in the name) and is not affiliated with, endorsed by, or sponsored by Google or Gemini. "Gemini" is a trademark of Google LLC, used here only in a descriptive, nominative sense to indicate compatibility — not to imply any official status.
```

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

```ts
import { generateIcon } from "@richardmcquiston01/gemini-icon-gen";

const result = await generateIcon({
  subject: "CO2 Laser Engraver",
  styleNotes: "Include a small flame icon in the corner",
});

if (result.success) {
  // result.imageData is base64-encoded; result.mimeType e.g. "image/png"
  // the library never writes to disk — persist it yourself
} else {
  console.error(result.error);
}
```

Reference images (style examples) and the system prompt
(`gem-instructions.txt`) are read from an assets directory — see
Configuration above for how to point at your own.

## Examples

`examples/generate-icon.ts` is a runnable end-to-end demo: it loads the
committed `assets/gem-instructions.txt` and a few reference icons from
`assets/icon-examples/`, calls `generateIcon()`, and writes the
resulting image to disk. Run it with:

```bash
bun run example
```

## Demo

A browser-based SPA demo lives in `demo/`: upload one or more reference
images (or drag & drop them), edit the system prompt, enter a subject,
and generate an icon in the browser. It's a separate consumer of this
package — a temp assets directory is built per request and passed to
`generateIcon()` via `GEMINI_ASSETS_DIR`, so the demo never touches the
package's public API.

```bash
bun run demo:build
bun run demo:start
```

Then open `http://localhost:3000` (or `$DEMO_PORT`, see Configuration
above). For frontend-only iteration with hot reload, run
`bun run demo:dev` alongside the server (`bun run demo:start`) — the
Vite dev server proxies `/api` and `/default-assets` requests to it.

Generation requests are processed one at a time (not concurrently, by
design — see `demo/server/generateQueue.ts`). Docker packaging for the
demo is planned but not yet implemented.

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
