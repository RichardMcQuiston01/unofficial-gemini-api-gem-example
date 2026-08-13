import fs from 'fs/promises';
import path from 'path';
import { getGeminiClient } from './client';
import type { IconGenerationRequest, IconGenerationResult } from './types';

const DEFAULT_MODEL = 'gemini-2.5-flash-image';

const SUPPORTED_IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/**
 * Resolves the directory `gem-instructions.txt` and `icon-examples/` are
 * read from: `GEMINI_ASSETS_DIR` if set, else this package's own bundled
 * `assets/` directory (one level up from this module, in both `src/`
 * during development and `dist/` after build).
 */
function assetsDir(): string {
  const env = process.env.GEMINI_ASSETS_DIR;
  return env ? path.resolve(env) : path.join(__dirname, '../assets');
}

async function loadExampleImageParts(dir: string) {
  let entries: string[];
  try {
    entries = await fs.readdir(path.join(dir, 'icon-examples'));
  } catch {
    console.warn(
      'No icon-examples directory found — generating without style references.',
    );
    return [];
  }

  const parts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
  for (const entry of entries) {
    const ext = path.extname(entry).toLowerCase();
    const mimeType = SUPPORTED_IMAGE_TYPES[ext];
    if (!mimeType) continue;
    try {
      const buffer = await fs.readFile(path.join(dir, 'icon-examples', entry));
      parts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
    } catch {
      console.warn(`Skipping example image "${entry}"`);
    }
  }
  return parts;
}

async function loadGemInstructions(dir: string): Promise<string> {
  try {
    return await fs.readFile(path.join(dir, 'gem-instructions.txt'), 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Generates an icon matching the style of the reference images and
 * system instructions found in the configured assets directory (see
 * {@link assetsDir}). The library never writes the resulting image to
 * disk — callers are responsible for persisting `imageData`.
 */
export async function generateIcon(
  request: IconGenerationRequest,
): Promise<IconGenerationResult> {
  const client = getGeminiClient(request.apiKey);
  const model = process.env.GEMINI_IMAGE_MODEL ?? DEFAULT_MODEL;
  const dir = assetsDir();

  const [systemInstruction, exampleParts] = await Promise.all([
    loadGemInstructions(dir),
    loadExampleImageParts(dir),
  ]);

  const promptText = [
    `Generate an icon for: ${request.subject}`,
    request.styleNotes ? `Additional notes: ${request.styleNotes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const contents = [
    {
      role: 'user' as const,
      parts: [...exampleParts, { text: promptText }],
    },
  ];

  let response: Awaited<ReturnType<typeof client.models.generateContent>>;
  try {
    response = await client.models.generateContent({
      model,
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        responseModalities: ['IMAGE'],
      },
      contents,
    });
  } catch (err) {
    return { success: false, error: `Gemini API error: ${String(err)}` };
  }

  const imagePart = response.candidates
    ?.at(0)
    ?.content?.parts?.find((part) => part.inlineData?.mimeType?.startsWith('image/'));

  if (!imagePart?.inlineData?.data) {
    return {
      success: false,
      error: 'Gemini returned no image data. Check your API key and model availability.',
    };
  }

  return {
    success: true,
    imageData: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}
