// Betriebsmodus (F-8) ohne Next-Abhängigkeit, damit auch Mail-Modus (F-37) und Routen ihn nutzen können.
import type { Betriebsmodus } from '@/domain/types';

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
