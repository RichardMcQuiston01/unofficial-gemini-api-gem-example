import fs from 'fs/promises';
import path from 'path';
import { assetsDir } from './assetsDir';
import { getGeminiClient } from './client';
import type { TextGenerationRequest, TextGenerationResult } from './types';

const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash';

async function loadTextInstructions(dir: string): Promise<string> {
  try {
    return await fs.readFile(path.join(dir, 'text-instructions.txt'), 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Transforms `request.input` according to a base prompt, the same way a
 * Gemini "Gem" does. The base prompt is `request.instructions` if given,
 * else `text-instructions.txt` from the configured assets directory (see
 * {@link assetsDir}); it is sent as the system instruction and omitted if
 * neither exists. The library never writes to disk.
 */
export async function generateText(
  request: TextGenerationRequest,
): Promise<TextGenerationResult> {
  if (!request.input.trim()) {
    return { success: false, error: 'Input text is empty — nothing to transform.' };
  }

  const client = getGeminiClient(request.apiKey);
  const model = process.env.GEMINI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL;
  const systemInstruction =
    request.instructions?.trim() || (await loadTextInstructions(assetsDir()));

  let response: Awaited<ReturnType<typeof client.models.generateContent>>;
  try {
    response = await client.models.generateContent({
      model,
      config: systemInstruction ? { systemInstruction } : {},
      contents: [{ role: 'user', parts: [{ text: request.input }] }],
    });
  } catch (err) {
    return { success: false, error: `Gemini API error: ${String(err)}` };
  }

  const text = response.candidates
    ?.at(0)
    ?.content?.parts?.map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    return {
      success: false,
      error: 'Gemini returned no text. Check your API key and model availability.',
    };
  }

  return { success: true, text };
}
