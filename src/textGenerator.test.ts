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

async function freshGenerateText() {
  vi.resetModules();
  const mod = await import('./textGenerator');
  return mod.generateText;
}

function textResponse(text: string) {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

describe('generateText', () => {
  let tmpDir: string;

  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV, GEMINI_API_KEY: 'test-key' };
    mockGenerateContent.mockReset();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gemini-text-gen-test-'));
    process.env.GEMINI_ASSETS_DIR = tmpDir;
  });

  afterEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    vi.clearAllMocks();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns an error for empty input without calling the API', async () => {
    const generateText = await freshGenerateText();

    const result = await generateText({ input: '   ' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Input text is empty');
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('uses text-instructions.txt as the system instruction', async () => {
    await fs.writeFile(path.join(tmpDir, 'text-instructions.txt'), 'Be brief.');
    mockGenerateContent.mockResolvedValue(textResponse('Short post'));
    const generateText = await freshGenerateText();

    const result = await generateText({ input: 'A candle' });

    expect(result).toEqual({ success: true, text: 'Short post' });
    const args = mockGenerateContent.mock.calls[0][0];
    expect(args.model).toBe('gemini-2.5-flash');
    expect(args.config.systemInstruction).toBe('Be brief.');
    expect(args.contents[0].parts).toEqual([{ text: 'A candle' }]);
  });

  it('prefers request.instructions over the file and honors GEMINI_TEXT_MODEL', async () => {
    await fs.writeFile(path.join(tmpDir, 'text-instructions.txt'), 'From file.');
    process.env.GEMINI_TEXT_MODEL = 'custom-model';
    mockGenerateContent.mockResolvedValue(textResponse('ok'));
    const generateText = await freshGenerateText();

    await generateText({ input: 'x', instructions: 'Inline prompt.' });

    const args = mockGenerateContent.mock.calls[0][0];
    expect(args.model).toBe('custom-model');
    expect(args.config.systemInstruction).toBe('Inline prompt.');
  });

  it('omits systemInstruction when none is available', async () => {
    mockGenerateContent.mockResolvedValue(textResponse('ok'));
    const generateText = await freshGenerateText();

    await generateText({ input: 'x' });

    expect(mockGenerateContent.mock.calls[0][0].config).toEqual({});
  });

  it('returns an error when the API throws', async () => {
    mockGenerateContent.mockRejectedValue(new Error('boom'));
    const generateText = await freshGenerateText();

    const result = await generateText({ input: 'x' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Gemini API error');
  });

  it('returns an error when the response has no text', async () => {
    mockGenerateContent.mockResolvedValue({ candidates: [] });
    const generateText = await freshGenerateText();

    const result = await generateText({ input: 'x' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('no text');
  });
});
