import fs from 'fs/promises';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGenerateIcon } = vi.hoisted(() => ({ mockGenerateIcon: vi.fn() }));

vi.mock('../../src/iconGenerator', () => ({
  generateIcon: mockGenerateIcon,
}));

import { generateWithUploads } from './generateQueue';

function makeImageFile(name: string, type: string): File {
  return new File(['fake-image-bytes'], name, { type });
}

describe('generateWithUploads', () => {
  beforeEach(() => {
    mockGenerateIcon.mockReset();
  });

  it('writes the prompt and images to a temp dir, then cleans it up', async () => {
    let capturedDir = '';
    let capturedPrompt = '';
    let capturedFiles: string[] = [];

    mockGenerateIcon.mockImplementation(async () => {
      capturedDir = process.env.GEMINI_ASSETS_DIR ?? '';
      capturedPrompt = await fs.readFile(path.join(capturedDir, 'gem-instructions.txt'), 'utf-8');
      capturedFiles = await fs.readdir(path.join(capturedDir, 'icon-examples'));
      return { success: true, imageData: 'abc', mimeType: 'image/png' };
    });

    const result = await generateWithUploads({
      subject: 'Widget',
      prompt: 'Flat icon style',
      images: [makeImageFile('a.png', 'image/png'), makeImageFile('b.webp', 'image/webp')],
    });

    expect(result).toEqual({ success: true, imageData: 'abc', mimeType: 'image/png' });
    expect(capturedPrompt).toBe('Flat icon style');
    expect(capturedFiles.sort()).toEqual(['img-0.png', 'img-1.webp']);
    await expect(fs.stat(capturedDir)).rejects.toThrow();
  });

  it('cleans up the temp dir even when generateIcon rejects', async () => {
    let capturedDir = '';
    mockGenerateIcon.mockImplementation(async () => {
      capturedDir = process.env.GEMINI_ASSETS_DIR ?? '';
      throw new Error('Gemini boom');
    });

    await expect(
      generateWithUploads({ subject: 'Widget', prompt: 'x', images: [] }),
    ).rejects.toThrow('Gemini boom');

    await expect(fs.stat(capturedDir)).rejects.toThrow();
  });

  it('serializes concurrent calls', async () => {
    const order: string[] = [];
    let resolveFirst: () => void = () => {};
    const firstGate = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });

    mockGenerateIcon
      .mockImplementationOnce(async () => {
        order.push('first-start');
        await firstGate;
        order.push('first-end');
        return { success: true, imageData: 'a', mimeType: 'image/png' };
      })
      .mockImplementationOnce(async () => {
        order.push('second-start');
        return { success: true, imageData: 'b', mimeType: 'image/png' };
      });

    const firstCall = generateWithUploads({ subject: 'A', prompt: 'x', images: [] });
    const secondCall = generateWithUploads({ subject: 'B', prompt: 'x', images: [] });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(order).toEqual(['first-start']);

    resolveFirst();
    await Promise.all([firstCall, secondCall]);

    expect(order).toEqual(['first-start', 'first-end', 'second-start']);
  });

  it('does not poison the queue after a rejected task', async () => {
    mockGenerateIcon
      .mockImplementationOnce(async () => {
        throw new Error('first fails');
      })
      .mockImplementationOnce(async () => ({
        success: true,
        imageData: 'ok',
        mimeType: 'image/png',
      }));

    await expect(
      generateWithUploads({ subject: 'A', prompt: 'x', images: [] }),
    ).rejects.toThrow('first fails');

    const result = await generateWithUploads({ subject: 'B', prompt: 'x', images: [] });
    expect(result).toEqual({ success: true, imageData: 'ok', mimeType: 'image/png' });
  });
});
