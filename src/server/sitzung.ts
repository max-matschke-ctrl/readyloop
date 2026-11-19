// Sitzung, Betriebsmodus und Repository-Auswahl (BE-6/BE-11). Nur serverseitig verwenden.
import { cookies } from 'next/headers';
import { heuteBerlin } from '@/domain/datum';
import { DEMO_ROLLEN, type Betriebsmodus, type DemoRolle, type Sitzung } from '@/domain/types';
import { sitzungFuerDemoRolle } from './dienste';
import { demoRepository } from './repo/demo/repository';
import type { Repository } from './repo/types';

export const DEMO_COOKIE = 'rl_demo_rolle';
export const ORG_COOKIE = 'rl_org';

export const DEMO_COOKIE_OPTIONEN = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
} as const;
export const ORG_COOKIE_OPTIONEN = DEMO_COOKIE_OPTIONEN;

/**
 * F-8 (Q-9): 'supabase' bei URL und Anon-Key; 'demo', wenn beide fehlen und (NODE_ENV ≠ production oder
 * READYLOOP_DEMO = '1'); sonst 'unkonfiguriert' (auch bei nur einer der beiden Variablen).
 */
export function betriebsmodus(): Betriebsmodus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) return 'supabase';
  if (!url && !key && (process.env.NODE_ENV !== 'production' || process.env.READYLOOP_DEMO === '1')) return 'demo';
  return 'unkonfiguriert';
}

export function istDemoModus(): boolean {
  return betriebsmodus() === 'demo';
}

export function heute(): string {
  return heuteBerlin();
}

/** Demo: In-Memory-Singleton. Supabase: Benutzer-Client der Anfrage (RLS) für die gewählte Organisation. */
export async function holeRepository(sitzung?: Pick<Sitzung, 'organisation'> | null): Promise<Repository> {
  const modus = betriebsmodus();
  if (modus === 'demo') return demoRepository(heute());
  if (modus === 'supabase') {
    const { supabaseRepositoryFuerAnfrage } = await import('./supabase/sitzung');
    return supabaseRepositoryFuerAnfrage(sitzung?.organisation.id ?? null);
  }
  throw new Error('Readyloop ist nicht konfiguriert');
}

function istDemoRolle(wert: string | undefined): wert is DemoRolle {
  return wert !== undefined && (DEMO_ROLLEN as readonly string[]).includes(wert);
}

/** Demo: Rolle aus Cookie, Organisation aus rl_org. Supabase: Auth-Benutzer + aktive Mitgliedschaft. Sonst null. */
export async function leseSitzung(): Promise<Sitzung | null> {
  // cookies() immer aufrufen: macht jede Seite mit Sitzung dynamisch, auch im Modus 'unkonfiguriert' beim Build.
  // Sonst würde z. B. /geraete beim Build als statische Weiterleitung eingefroren (Env wirkt erst zur Laufzeit).
  const jar = await cookies();
  const modus = betriebsmodus();
  if (modus === 'demo') {
    const rolle = jar.get(DEMO_COOKIE)?.value;
    if (!istDemoRolle(rolle)) return null;
    return sitzungFuerDemoRolle(await holeRepository(), rolle, jar.get(ORG_COOKIE)?.value ?? null);
  }
  if (modus === 'supabase') {
    const { leseSupabaseSitzung } = await import('./supabase/sitzung');
    return leseSupabaseSitzung();
  }
  return null;
}
