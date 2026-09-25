import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const types: Record<string, string> = { '.jpg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif' };

// Next's public-file manifest is built at startup; runtime CMS uploads need a
// route so images uploaded afterwards work immediately in a production server.
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const type = types[path.extname(filename)];
  if (!type || !/^[a-zA-Z0-9_-]+\.(jpg|png|gif|webp|avif)$/.test(filename)) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(process.cwd(), 'public', 'uploads', filename));
    return new Response(bytes, { headers: { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Response(null, { status: 404 });
    throw error;
  }
}
