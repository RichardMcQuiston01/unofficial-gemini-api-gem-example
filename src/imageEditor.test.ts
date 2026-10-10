import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function (this: {
    models: { generateContent: typeof mockGenerateContent };
  }) {
    this.models = { generateContent: mockGenerateContent };
  }),
}));

const ORIGINAL_ENV = { ...process.env };
const PHOTO = { data: 'cGhvdG8=', mimeType: 'image/jpeg' };

async function freshEditImage() {
  vi.resetModules();
  const mod = await import('./imageEditor');
  return mod.editImage;
}

function imageResponse(text?: string) {
  return {
    candidates: [
      {
        content: {
          parts: [
            ...(text ? [{ text }] : []),
            { inlineData: { mimeType: 'image/png', data: 'ZWRpdGVk' } },
          ],
        },
      },
    ],
  };
}

describe('editImage', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, GEMINI_API_KEY: 'test-key' };
    delete process.env.GEMINI_IMAGE_MODEL;
    mockGenerateContent.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.clearAllMocks();
  });

  it('returns an error for an empty prompt without calling the API', async () => {
    const editImage = await freshEditImage();

    const result = await editImage({ image: PHOTO, prompt: '  ' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Edit prompt is empty');
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('rejects an unsupported image type', async () => {
    const editImage = await freshEditImage();

    const result = await editImage({
      image: { data: 'eA==', mimeType: 'image/gif' },
      prompt: 'Brighten it',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('unsupported type "image/gif"');
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('rejects an empty reference image and names it', async () => {
    const editImage = await freshEditImage();

    const result = await editImage({
      image: PHOTO,
      prompt: 'Match this background',
      referenceImages: [PHOTO, { data: '', mimeType: 'image/png' }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Reference image 2 is empty.');
  });

  it('sends the image, references and prompt in order', async () => {
    mockGenerateContent.mockResolvedValue(imageResponse());
    const editImage = await freshEditImage();
    const reference = { data: 'cmVm', mimeType: 'image/webp' };

    const result = await editImage({
      image: PHOTO,
      prompt: 'Put it on a wooden table',
      instructions: 'Keep the product unchanged.',
      referenceImages: [reference],
    });

    expect(result).toEqual({
      success: true,
      imageData: 'ZWRpdGVk',
      mimeType: 'image/png',
    });
    const args = mockGenerateContent.mock.calls[0][0];
    expect(args.model).toBe('gemini-2.5-flash-image');
    expect(args.config).toEqual({
      systemInstruction: 'Keep the product unchanged.',
      responseModalities: ['IMAGE', 'TEXT'],
    });
    expect(args.contents[0].parts).toEqual([
      { inlineData: PHOTO },
      { inlineData: reference },
      { text: 'Put it on a wooden table' },
    ]);
  });

  it('prefers request.model over GEMINI_IMAGE_MODEL', async () => {
    process.env.GEMINI_IMAGE_MODEL = 'env-model';
    mockGenerateContent.mockResolvedValue(imageResponse());
    const editImage = await freshEditImage();

    await editImage({ image: PHOTO, prompt: 'x', model: 'request-model' });
    await editImage({ image: PHOTO, prompt: 'x' });

    expect(mockGenerateContent.mock.calls[0][0].model).toBe('request-model');
    expect(mockGenerateContent.mock.calls[1][0].model).toBe('env-model');
  });

  it('returns any text Gemini sent with the image', async () => {
    mockGenerateContent.mockResolvedValue(imageResponse('Here you go.'));
    const editImage = await freshEditImage();

    const result = await editImage({ image: PHOTO, prompt: 'x' });

    expect(result.text).toBe('Here you go.');
  });

  it('explains a reply with no image using the finish reason and text', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          finishReason: 'IMAGE_SAFETY',
          content: { parts: [{ text: 'I cannot edit this image.' }] },
        },
      ],
    });
    const editImage = await freshEditImage();

    const result = await editImage({ image: PHOTO, prompt: 'x' });

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      'Gemini (model gemini-2.5-flash-image) returned no edited image ' +
        '(finish reason: IMAGE_SAFETY): I cannot edit this image.',
    );
  });

  it('returns an error naming the model when the API throws', async () => {
    mockGenerateContent.mockRejectedValue(new Error('quota exceeded'));
    const editImage = await freshEditImage();

    const result = await editImage({ image: PHOTO, prompt: 'x' });

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      'Gemini API error (model gemini-2.5-flash-image): Error: quota exceeded',
    );
  });
});
