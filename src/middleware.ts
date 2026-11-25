// Middleware (BE-12, BE-18, BE-26): Session-Refresh im Modus supabase (F-8) und Kopfzeilen der öffentlichen QR-Seite (F-24)
// und der Abmeldeseite (F-40). Keine Zugriffsentscheidung hier – Rechte prüfen data.ts/actions.ts und RLS.
// /g/*, /abmelden und /api/* werden nie auf /login umgeleitet.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { setzeQrKopfzeilen } from './server/kopfzeilen';

function mitQrKopfzeilen(request: NextRequest, antwort: NextResponse): NextResponse {
  setzeQrKopfzeilen(request.nextUrl.pathname, antwort.headers);
  return antwort;
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return mitQrKopfzeilen(request, NextResponse.next({ request }));

  let antwort = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (liste) => {
        for (const { name, value } of liste) request.cookies.set(name, value);
        antwort = NextResponse.next({ request });
        for (const { name, value, options } of liste) antwort.cookies.set(name, value, options);
      },
    },
  });
  // Erneuert abgelaufene Access-Tokens; Ergebnis wird hier nicht ausgewertet.
  await client.auth.getUser();
  return mitQrKopfzeilen(request, antwort);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
