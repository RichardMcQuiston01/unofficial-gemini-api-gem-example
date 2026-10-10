import { getGeminiClient } from './client';
import { DEFAULT_IMAGE_MODEL } from './iconGenerator';
import type { ImageEditRequest, ImageEditResult, InlineImage } from './types';

const SUPPORTED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function checkImage(image: InlineImage, label: string): string | null {
  if (!SUPPORTED_MIME_TYPES.has(image.mimeType)) {
    return `${label} has an unsupported type "${image.mimeType}"; use PNG, JPEG or WebP.`;
  }
  if (!image.data.trim()) return `${label} is empty.`;
  return null;
}

/**
 * Edits an image according to a prompt: the image (and any reference
 * images) plus the prompt go to Gemini's image model, and the first image
 * in the reply comes back. Unlike {@link generateIcon} it reads nothing from
 * the assets directory. The library never writes to disk.
 */
export async function editImage(request: ImageEditRequest): Promise<ImageEditResult> {
  if (!request.prompt.trim()) {
    return { success: false, error: 'Edit prompt is empty — say what to change.' };
  }
  const problem =
    checkImage(request.image, 'The image') ??
    (request.referenceImages ?? [])
      .map((image, index) => checkImage(image, `Reference image ${index + 1}`))
      .find((message) => message !== null) ??
    null;
  if (problem) return { success: false, error: problem };

  const client = getGeminiClient(request.apiKey);
  const model =
    request.model?.trim() || process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
  const instructions = request.instructions?.trim();

  const imageParts = [request.image, ...(request.referenceImages ?? [])].map(
    (image) => ({ inlineData: { mimeType: image.mimeType, data: image.data } }),
  );

  let response: Awaited<ReturnType<typeof client.models.generateContent>>;
  try {
    response = await client.models.generateContent({
      model,
      config: {
        ...(instructions ? { systemInstruction: instructions } : {}),
        responseModalities: ['IMAGE', 'TEXT'],
      },
      contents: [
        { role: 'user', parts: [...imageParts, { text: request.prompt }] },
      ],
    });
  } catch (err) {
    return { success: false, error: `Gemini API error (model ${model}): ${String(err)}` };
  }

  const parts = response.candidates?.at(0)?.content?.parts ?? [];
  const imagePart = parts.find((part) =>
    part.inlineData?.mimeType?.startsWith('image/'),
  );
  const text = parts
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!imagePart?.inlineData?.data) {
    const finish = response.candidates?.at(0)?.finishReason;
    return {
      success: false,
      error:
        `Gemini (model ${model}) returned no edited image` +
        (finish ? ` (finish reason: ${finish})` : '') +
        (text ? `: ${text}` : '. Check your API key and model availability.'),
    };
  }

  return {
    success: true,
    imageData: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
    ...(text ? { text } : {}),
  };
}
