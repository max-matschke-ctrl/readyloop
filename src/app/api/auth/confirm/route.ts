// GET /api/auth/confirm?token_hash&type&next (BE-12): Einladungs- und Reset-Links bestätigen.
import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { sichererRuecksprung } from '@/server/pfade';
import { betriebsmodus } from '@/server/sitzung';

const ERLAUBT: readonly EmailOtpType[] = ['invite', 'recovery'];

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const fehler = NextResponse.redirect(new URL('/login?fehler=link', url));
  if (betriebsmodus() !== 'supabase') return fehler;
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = sichererRuecksprung(url.searchParams.get('next'), '/passwort-neu');
  if (!tokenHash || !type || !ERLAUBT.includes(type)) return fehler;
  const { erzeugeServerClient } = await import('@/server/supabase/server');
  const { error } = await (await erzeugeServerClient()).auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) return fehler;
  return NextResponse.redirect(new URL(next, url));
}
