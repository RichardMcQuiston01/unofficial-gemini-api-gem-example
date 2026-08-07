import fs from 'fs/promises';
import path from 'path';
import { generateIcon } from '../src/index';

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

async function main() {
  const result = await generateIcon({
    subject: 'CO2 Laser Engraver',
    styleNotes: 'Include a small flame icon in the corner',
  });

  if (!result.success) {
    console.error(`Icon generation failed: ${result.error}`);
    process.exitCode = 1;
    return;
  }

  const extension = EXTENSION_BY_MIME_TYPE[result.mimeType ?? ''] ?? 'bin';
  const outputPath = path.join(__dirname, `generated-icon.${extension}`);
  await fs.writeFile(outputPath, Buffer.from(result.imageData ?? '', 'base64'));

  console.log(`Icon written to ${outputPath}`);
}

main().catch((err) => {
  console.error(`Icon generation failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
