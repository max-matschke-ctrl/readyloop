// GET /api/auth/confirm?token_hash&type&next (BE-12, Review I2 Befund 7): Einladungs- und Reset-Links.
// Kein verifyOtp beim GET (Mail-Scanner/Link-Vorschauen würden den Token verbrauchen). Stattdessen Weiterleitung auf
// die Bestätigungsseite /auth/bestaetigen; dort löst ein Klick die Server Action bestaetigeOtp aus.
import { NextResponse, type NextRequest } from 'next/server';
import { otpBestaetigenSchema } from '@/domain/schemas';
import { BESTAETIGEN_SEITE, NACH_BESTAETIGUNG, sichererRuecksprung } from '@/server/pfade';
import { betriebsmodus } from '@/server/sitzung';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const fehler = NextResponse.redirect(new URL('/login?fehler=link', url));
  if (betriebsmodus() !== 'supabase') return fehler;
  const geprueft = otpBestaetigenSchema.safeParse({
    token_hash: url.searchParams.get('token_hash') ?? '',
    type: url.searchParams.get('type'),
    next: url.searchParams.get('next'),
  });
  if (!geprueft.success) return fehler;
  const ziel = new URL(BESTAETIGEN_SEITE, url);
  ziel.searchParams.set('token_hash', geprueft.data.token_hash);
  ziel.searchParams.set('type', geprueft.data.type);
  ziel.searchParams.set('next', sichererRuecksprung(geprueft.data.next, NACH_BESTAETIGUNG));
  return NextResponse.redirect(ziel);
}
