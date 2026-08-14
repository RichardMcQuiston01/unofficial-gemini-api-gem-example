import { generateWithUploads } from '../demo/server/generateQueue';
import type { UploadedImage } from '../demo/server/generateQueue';

/**
 * Vercel serverless variant of the demo's POST /api/generate endpoint.
 * Uses the web-standard `Request`/`Response` handler signature, so
 * `request.formData()` parses the multipart upload exactly like the Bun
 * demo server. Generation is delegated to the shared, serialized
 * `generateWithUploads` (writes a per-request temp assets dir under the
 * function's writable `/tmp`, then calls the package's `generateIcon`).
 */
export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return Response.json(
      { success: false, error: 'Request body must be multipart/form-data.' },
      { status: 400 },
    );
  }

  const subject = formData.get('subject');
  const styleNotes = formData.get('styleNotes');
  const prompt = formData.get('prompt');
  const apiKeyField = formData.get('apiKey');

  if (typeof subject !== 'string' || !subject.trim() || typeof prompt !== 'string') {
    return Response.json(
      { success: false, error: 'subject and prompt are required.' },
      { status: 400 },
    );
  }

  // A key entered in the page wins; otherwise fall back to a server-side
  // GEMINI_API_KEY if the deployment configured one.
  const apiKey =
    typeof apiKeyField === 'string' && apiKeyField.trim() ? apiKeyField.trim() : undefined;
  if (!apiKey && !process.env.GEMINI_API_KEY) {
    return Response.json(
      { success: false, error: 'A Gemini API key is required. Enter one in the form.' },
      { status: 400 },
    );
  }

  const images = formData
    .getAll('images')
    .filter((value) => typeof value !== 'string') as unknown as UploadedImage[];

  const result = await generateWithUploads({
    subject,
    styleNotes: typeof styleNotes === 'string' && styleNotes.trim() ? styleNotes : undefined,
    prompt,
    images,
    apiKey,
  }).catch((err) => ({
    success: false as const,
    error: err instanceof Error ? err.message : String(err),
  }));

  return Response.json(result);
}
