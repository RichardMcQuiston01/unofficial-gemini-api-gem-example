import { GoogleGenAI } from '@google/genai';

let _client: GoogleGenAI | null = null;

/**
 * Returns a lazily-initialized, process-wide {@link GoogleGenAI} client
 * built from the `GEMINI_API_KEY` environment variable.
 *
 * @throws {Error} If `GEMINI_API_KEY` is not set.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}
