// Sitzung und Repository-Auswahl (BE-6). Nur serverseitig verwenden.
import { cookies } from 'next/headers';
import { heuteBerlin } from '@/domain/datum';
import { DEMO_ROLLEN, type DemoRolle, type Sitzung } from '@/domain/types';
import { sitzungFuerDemoRolle } from './dienste';
import { demoRepository } from './repo/demo/repository';
import type { Repository } from './repo/types';

export const DEMO_COOKIE = 'rl_demo_rolle';

export const DEMO_COOKIE_OPTIONEN = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
} as const;

/** true, wenn NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt. */
export function istDemoModus(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function heute(): string {
  return heuteBerlin();
}

/** Demo: In-Memory-Singleton. Mit Supabase-Variablen: noch nicht implementiert (I2). */
export function holeRepository(): Repository {
  if (!istDemoModus()) throw new Error('Supabase-Adapter folgt in I2');
  return demoRepository(heute());
}

function istDemoRolle(wert: string | undefined): wert is DemoRolle {
  return wert !== undefined && (DEMO_ROLLEN as readonly string[]).includes(wert);
}

/** Demo: Rolle aus Cookie. Ohne Supabase-Login (I2) gibt es außerhalb des Demo-Modus keine Sitzung. */
export async function leseSitzung(): Promise<Sitzung | null> {
  if (!istDemoModus()) return null;
  const rolle = (await cookies()).get(DEMO_COOKIE)?.value;
  if (!istDemoRolle(rolle)) return null;
  return sitzungFuerDemoRolle(holeRepository(), rolle);
}
