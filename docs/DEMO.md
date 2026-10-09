# Demo Hosting Guide

The browser demo lives in `demo/`. It lets you enter your own Gemini API
key, upload reference images, edit the system prompt, and generate an icon.
Try the hosted version at
[gemini-icon-gen.vercel.app](https://gemini-icon-gen.vercel.app/), or host
your own copy using one of the options below.

## Running the demo in Docker

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

## Deploying the demo to Vercel

The demo also ships a Vercel-native variant so it can run without the Bun
server. `vercel.json` builds the Vite frontend (`demo:build` →
`demo/dist`) and serves it statically, and the `api/` directory holds two
serverless functions — `api/defaults.ts` (the default prompt) and
`api/generate.ts` (icon generation, reusing the same serialized
`generateWithUploads` as the Bun server). Import the repository at
[vercel.com/new](https://vercel.com/new) and deploy — `vercel.json`
supplies the build settings, so no manual configuration is needed. No
`GEMINI_API_KEY` env var is required: visitors enter their own key in the
page (set one on the project only if you want a server-side fallback). The
live deployment is at
[gemini-icon-gen.vercel.app](https://gemini-icon-gen.vercel.app/).
