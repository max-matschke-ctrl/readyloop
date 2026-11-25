// GET/POST /api/cron/erinnerungen – Erinnerungslauf (F-36). Auslöser Vercel Cron (GET) und pg_cron + pg_net (POST),
// beide mit Authorization: Bearer {CRON_SECRET}. Logik: src/server/erinnerungen/routen.ts.
import { cronErinnerungen } from '@/server/erinnerungen/routen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request): Promise<Response> {
  return cronErinnerungen(request);
}

export async function POST(request: Request): Promise<Response> {
  return cronErinnerungen(request);
}
