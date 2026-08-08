import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { generateIcon } from '../../src/iconGenerator';
import type { IconGenerationRequest, IconGenerationResult } from '../../src/types';

const TEMP_DIR_PREFIX = path.join(os.tmpdir(), 'gemini-icon-gen-demo-');

/** Maps an uploaded file's MIME type to the on-disk extension iconGenerator.ts recognizes. */
const SUPPORTED_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

/**
 * Structural subset of the Fetch API `File`/`Blob` shape we actually use.
 * Deliberately not the ambient `File` type: `@types/bun` and `@types/node`
 * both declare a global `File`, and depending on module resolution order
 * they don't always agree — this sidesteps that entirely.
 */
export interface UploadedImage {
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface GenerateWithUploadsInput extends IconGenerationRequest {
  prompt: string;
  images: UploadedImage[];
}

let tail: Promise<unknown> = Promise.resolve();

/**
 * Runs `task` only after every previously-enqueued task has settled
 * (success or failure), one at a time. A rejection never poisons later
 * calls: the shared tail always resolves via `.catch()`, while the
 * caller's own returned promise still carries the real outcome.
 */
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = tail.then(task, task);
  tail = result.catch(() => {});
  return result;
}

/** Best-effort cleanup of temp dirs left behind by a prior crashed run. */
export async function sweepStaleTempDirs(): Promise<void> {
  const dir = os.tmpdir();
  const prefix = path.basename(TEMP_DIR_PREFIX);
  const entries = await fs.readdir(dir).catch(() => [] as string[]);

  await Promise.all(
    entries
      .filter((entry) => entry.startsWith(prefix))
      .map((entry) =>
        fs.rm(path.join(dir, entry), { recursive: true, force: true }).catch(() => {}),
      ),
  );
}

async function buildTempAssetsDir(prompt: string, images: UploadedImage[]): Promise<string> {
  const dir = await fs.mkdtemp(TEMP_DIR_PREFIX);
  const iconExamplesDir = path.join(dir, 'icon-examples');
  await fs.mkdir(iconExamplesDir);
  await fs.writeFile(path.join(dir, 'gem-instructions.txt'), prompt, 'utf-8');

  await Promise.all(
    images.map(async (image, index) => {
      const extension = SUPPORTED_EXTENSIONS[image.type];
      if (!extension) return; // unsupported type — skipped silently, same as the library's own behavior
      const buffer = Buffer.from(await image.arrayBuffer());
      await fs.writeFile(path.join(iconExamplesDir, `img-${index}${extension}`), buffer);
    }),
  );

  return dir;
}

/**
 * Generates one icon from uploaded reference images and an edited system
 * prompt, without changing the published package's public API: writes a
 * per-request temp assets directory (server-generated filenames only —
 * never the browser-supplied name, which isn't safe to trust for an
 * on-disk path), points `GEMINI_ASSETS_DIR` at it for the duration of the
 * call, and always cleans up. Serialized via {@link enqueue} — only one
 * generation runs at a time, since `GEMINI_ASSETS_DIR` is process-wide
 * state that `generateIcon()` re-reads on every call.
 */
export function generateWithUploads(input: GenerateWithUploadsInput): Promise<IconGenerationResult> {
  return enqueue(async () => {
    const dir = await buildTempAssetsDir(input.prompt, input.images);
    try {
      process.env.GEMINI_ASSETS_DIR = dir;
      return await generateIcon({ subject: input.subject, styleNotes: input.styleNotes });
    } finally {
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    }
  });
}
