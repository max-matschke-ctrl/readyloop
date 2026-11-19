// GET /api/nachweise/[id] – Nachweis-PDF (BE-6). Recht nachweis.lesen + Geltungsbereich; sonst 404.
import { holeNachweisPdf } from '@/server/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const pdf = await holeNachweisPdf(id);
  if (!pdf) return new Response('Nicht gefunden', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  const ascii = pdf.dateiname.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const body = new Uint8Array(pdf.inhalt).buffer;
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(pdf.dateiname)}`,
      'Content-Length': String(pdf.inhalt.byteLength),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
