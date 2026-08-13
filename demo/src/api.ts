import type { IconGenerationRequest, IconGenerationResult } from '../../src/types';

/** Bundled default reference images and system prompt, for prefilling the demo on load. */
export interface DefaultAssets {
  prompt: string;
  images: Array<{ name: string; url: string }>;
}

/** Fetches the bundled default prompt text and reference-image URLs. */
export async function fetchDefaults(): Promise<DefaultAssets> {
  const response = await fetch('/api/defaults');
  if (!response.ok) {
    throw new Error(`Failed to load defaults (${response.status})`);
  }
  return response.json();
}

/** Input to {@link generate}: the library's own request shape, plus the edited prompt and current reference images. */
export interface GenerateInput extends IconGenerationRequest {
  prompt: string;
  images: File[];
}

/** Calls the demo's generate endpoint, returning the same shape the package's generateIcon() returns. */
export async function generate(input: GenerateInput): Promise<IconGenerationResult> {
  const formData = new FormData();
  formData.set('subject', input.subject);
  if (input.styleNotes) formData.set('styleNotes', input.styleNotes);
  if (input.apiKey) formData.set('apiKey', input.apiKey);
  formData.set('prompt', input.prompt);
  for (const image of input.images) {
    formData.append('images', image, image.name);
  }

  const response = await fetch('/api/generate', { method: 'POST', body: formData });
  const body = (await response.json().catch(() => null)) as IconGenerationResult | null;
  return body ?? { success: false, error: `Request failed (${response.status})` };
}
