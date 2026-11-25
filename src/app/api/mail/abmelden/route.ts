// POST /api/mail/abmelden?t= – One-Click-Abmeldung (RFC 8058, F-40). Öffentlich; GET ändert nie etwas (405).
import { oneClickAbmelden } from '@/server/erinnerungen/routen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  return oneClickAbmelden(request);
}

export async function GET(): Promise<Response> {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
