import fs from 'fs/promises';
import os from 'os';
import path from 'path';
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

/** Re-imports iconGenerator fresh so client.ts's module-level singleton
 * doesn't leak GEMINI_API_KEY state between tests. */
async function freshGenerateIcon() {
  vi.resetModules();
  const mod = await import('./iconGenerator');
  return mod.generateIcon;
}

describe('generateIcon', () => {
  let tmpDir: string;

  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV, GEMINI_API_KEY: 'test-key' };
    mockGenerateContent.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gemini-icon-gen-test-'));
  });

  afterEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    // clearAllMocks (not restoreAllMocks): restoring would also wipe the
    // mockImplementation set on the GoogleGenAI constructor mock itself,
    // since it's a vi.fn() living inside the mocked @google/genai module.
    vi.clearAllMocks();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('throws when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY;
    const generateIcon = await freshGenerateIcon();

    await expect(generateIcon({ subject: 'Widget' })).rejects.toThrow(
      'GEMINI_API_KEY is not set.',
    );
  });

  it('warns and continues with no reference images when icon-examples/ is missing', async () => {
    process.env.GEMINI_ASSETS_DIR = tmpDir;
    mockGenerateContent.mockResolvedValue({
      candidates: [
        { content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'abc' } }] } },
      ],
    });
    const generateIcon = await freshGenerateIcon();

    const result = await generateIcon({ subject: 'Widget' });

    expect(result).toEqual({ success: true, imageData: 'abc', mimeType: 'image/png' });
    const requestArg = mockGenerateContent.mock.calls[0][0];
    expect(requestArg.contents[0].parts).toHaveLength(1);
  });

  it('omits systemInstruction when gem-instructions.txt is missing', async () => {
    process.env.GEMINI_ASSETS_DIR = tmpDir;
    mockGenerateContent.mockResolvedValue({
      candidates: [
        { content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'abc' } }] } },
      ],
    });
    const generateIcon = await freshGenerateIcon();

    await generateIcon({ subject: 'Widget' });

    const requestArg = mockGenerateContent.mock.calls[0][0];
    expect(requestArg.config).not.toHaveProperty('systemInstruction');
  });

  it('returns imageData and mimeType on a successful response', async () => {
    process.env.GEMINI_ASSETS_DIR = tmpDir;
    mockGenerateContent.mockResolvedValue({
      candidates: [
        { content: { parts: [{ inlineData: { mimeType: 'image/webp', data: 'xyz' } }] } },
      ],
    });
    const generateIcon = await freshGenerateIcon();

    const result = await generateIcon({
      subject: 'Widget',
      styleNotes: 'flat, minimal',
    });

    expect(result).toEqual({ success: true, imageData: 'xyz', mimeType: 'image/webp' });
  });

  it('returns a failure result when the response has no image part', async () => {
    process.env.GEMINI_ASSETS_DIR = tmpDir;
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: 'no image here' }] } }],
    });
    const generateIcon = await freshGenerateIcon();

    const result = await generateIcon({ subject: 'Widget' });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no image data/i);
  });
});
