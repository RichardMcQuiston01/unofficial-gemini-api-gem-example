import path from 'path';
import { generateWithUploads, sweepStaleTempDirs } from './generateQueue';
import type { UploadedImage } from './generateQueue';
import { serveStaticFile } from './static';

const PORT = Number(process.env.DEMO_PORT ?? 3000);
const REPO_ROOT = path.join(import.meta.dirname, '..', '..');
const DIST_DIR = path.join(import.meta.dirname, '..', 'dist');
const DEFAULT_ASSETS_DIR = path.join(REPO_ROOT, 'assets', 'icon-examples');
const DEFAULT_PROMPT_PATH = path.join(REPO_ROOT, 'assets', 'gem-instructions.txt');

if (!process.env.GEMINI_API_KEY) {
  console.error(
    'GEMINI_API_KEY is not set. Set it in your .env file before starting the demo server.',
  );
  process.exit(1);
}

if (!(await Bun.file(path.join(DIST_DIR, 'index.html')).exists())) {
  console.error(`${DIST_DIR} has not been built yet. Run "bun run demo:build" first.`);
  process.exit(1);
}

await sweepStaleTempDirs();

async function handleDefaults(): Promise<Response> {
  const promptFile = Bun.file(DEFAULT_PROMPT_PATH);
  const prompt = (await promptFile.exists()) ? await promptFile.text() : '';

  const images: Array<{ name: string; url: string }> = [];
  const glob = new Bun.Glob('*.{png,jpg,jpeg,webp}');
  for await (const name of glob.scan({ cwd: DEFAULT_ASSETS_DIR })) {
    images.push({ name, url: `/default-assets/${name}` });
  }

  return Response.json({ prompt, images });
}

async function handleGenerate(req: Request): Promise<Response> {
  // No explicit `FormData` annotation here: @types/bun and @types/node both
  // declare a global `FormData` and don't always agree — let TS infer the
  // type from req.formData() itself instead of naming it.
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return Response.json(
      { success: false, error: 'Request body must be multipart/form-data.' },
      { status: 400 },
    );
  }

  const subject = formData.get('subject');
  const styleNotes = formData.get('styleNotes');
  const prompt = formData.get('prompt');

  if (typeof subject !== 'string' || !subject.trim() || typeof prompt !== 'string') {
    return Response.json(
      { success: false, error: 'subject and prompt are required.' },
      { status: 400 },
    );
  }

  // Not `value is File`: @types/bun and @types/node both declare a global
  // `File` and don't always agree, so we narrow structurally instead.
  const images = formData
    .getAll('images')
    .filter((value) => typeof value !== 'string') as unknown as UploadedImage[];

  const result = await generateWithUploads({
    subject,
    styleNotes: typeof styleNotes === 'string' && styleNotes.trim() ? styleNotes : undefined,
    prompt,
    images,
  }).catch((err) => ({
    success: false as const,
    error: err instanceof Error ? err.message : String(err),
  }));

  return Response.json(result);
}

const server = Bun.serve({
  port: PORT,
  idleTimeout: 180, // Gemini round-trips with several reference images can run long
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === 'GET' && url.pathname === '/api/defaults') {
      return handleDefaults();
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      return handleGenerate(req);
    }

    if (req.method === 'GET' && url.pathname.startsWith('/default-assets/')) {
      const response = await serveStaticFile(
        DEFAULT_ASSETS_DIR,
        url.pathname.slice('/default-assets'.length),
      );
      return response ?? new Response('Not found', { status: 404 });
    }

    if (req.method === 'GET') {
      const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
      const response = await serveStaticFile(DIST_DIR, pathname);
      if (response) return response;
    }

    return new Response('Not found', { status: 404 });
  },
});

console.log(`gemini-icon-gen demo running at http://localhost:${server.port}`);
