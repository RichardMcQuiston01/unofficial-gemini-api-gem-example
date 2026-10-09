import path from 'path';

/**
 * Resolves the directory the package reads its assets from
 * (`gem-instructions.txt`, `icon-examples/`, `text-instructions.txt`):
 * `GEMINI_ASSETS_DIR` if set, else this package's own bundled `assets/`
 * directory (one level up from this module, in both `src/` during
 * development and `dist/` after build).
 */
export function assetsDir(): string {
  const env = process.env.GEMINI_ASSETS_DIR;
  return env ? path.resolve(env) : path.join(__dirname, '../assets');
}
