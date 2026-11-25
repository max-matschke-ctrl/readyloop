// POST /api/mail/webhook – Zustellstatus von Resend (F-37), Svix-Signatur mit RESEND_WEBHOOK_SECRET.
import { resendWebhook } from '@/server/erinnerungen/routen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  return resendWebhook(request);
}
