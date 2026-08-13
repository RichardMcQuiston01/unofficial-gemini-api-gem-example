import { GoogleGenAI } from '@google/genai';

let _client: GoogleGenAI | null = null;

/**
 * Returns a {@link GoogleGenAI} client.
 *
 * With no argument, a process-wide client built from the `GEMINI_API_KEY`
 * environment variable is lazily created and memoized. When an explicit
 * `apiKey` is passed, a fresh (non-memoized) client is returned for that
 * key, so callers can use different keys across calls.
 *
 * @param apiKey Optional API key that overrides `GEMINI_API_KEY`.
 * @throws {Error} If no `apiKey` is given and `GEMINI_API_KEY` is not set.
 */
export function getGeminiClient(apiKey?: string): GoogleGenAI {
  if (apiKey) return new GoogleGenAI({ apiKey });

  if (!_client) {
    const envKey = process.env.GEMINI_API_KEY;
    if (!envKey) throw new Error('GEMINI_API_KEY is not set.');
    _client = new GoogleGenAI({ apiKey: envKey });
  }
  return _client;
}
