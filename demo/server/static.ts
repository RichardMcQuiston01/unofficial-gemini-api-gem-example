import fs from 'fs/promises';
import path from 'path';

/**
 * Resolves `pathname` against `root`, returning the resolved absolute path
 * only if it stays within `root`. Guards static file serving against
 * path-traversal requests (e.g. `/../../etc/passwd`-style pathnames) by
 * always treating the decoded pathname as relative before resolving, then
 * verifying the result didn't escape `root`.
 */
export function resolveSafePath(root: string, pathname: string): string | null {
  const decoded = decodeURIComponent(pathname);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, `.${decoded}`);

  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    return null;
  }
  return resolved;
}

/** Serves a single file from `root` for the given request pathname, or null if it's missing, unsafe, or not a file. */
export async function serveStaticFile(root: string, pathname: string): Promise<Response | null> {
  const filePath = resolveSafePath(root, pathname);
  if (!filePath) return null;

  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat || !stat.isFile()) return null;

  return new Response(Bun.file(filePath));
}
