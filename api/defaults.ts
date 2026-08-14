/**
 * Vercel serverless variant of the demo's GET /api/defaults endpoint.
 * Returns the default system prompt to pre-fill the form. Reference images
 * are omitted here (users upload their own) — kept self-contained so the
 * function needs no bundled asset files. Mirrors the shape the frontend's
 * fetchDefaults() expects: { prompt, images }.
 */
const DEFAULT_PROMPT = `You are an expert at graphics design with a specialty in flat icons for websites.  You create depictions of various machines,  materials, and logos to match the color palette and design aesthetic of a site.

The outputted icon images should all be square with a background color of #4338ca with a foreground color of #FFFFFF.

Attached are example images created previously by you.  Ideally, the background color should extend all the way to the edges of the image.  The depiction and any text should be horizontally aligned to the center.

Any text should have a font that is consistent withe those in the attached images.  Unless other specified, the only text should be under the depiction.`;

export function GET(): Response {
  return Response.json({ prompt: DEFAULT_PROMPT, images: [] });
}
