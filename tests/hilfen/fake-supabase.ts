// Aufzeichnender Fake für den Supabase-Client (BE-13/BE-14): keine Instanz im Agentenlauf.
// Jede Abfrage wird als Aufruf protokolliert; Antworten liefert ein konfigurierbarer Handler.
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Aufruf {
  art: 'from' | 'rpc' | 'upload' | 'download';
  tabelle?: string;
  op?: 'select' | 'insert' | 'update' | 'delete';
  spalten?: string;
  werte?: unknown;
  filter: [string, string, unknown][];
  optionen?: unknown;
  name?: string;
  args?: unknown;
  pfad?: string;
  einzeln?: boolean;
  sortierung?: [string, unknown];
}
export type Antwort = { data?: unknown; error?: { code?: string; message?: string } | null; count?: number | null };

export function fakeSupabase(handler: (a: Aufruf) => Antwort = () => ({ data: [] })) {
  const aufrufe: Aufruf[] = [];
  const antworte = (a: Aufruf) => {
    aufrufe.push(a);
    const r = handler(a);
    return { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
  };
  const from = (tabelle: string) => {
    const a: Aufruf = { art: 'from', tabelle, filter: [] };
    const b = {
      select(spalten = '*') {
        a.op ??= 'select';
        a.spalten = spalten;
        return b;
      },
      insert(werte: unknown, optionen?: unknown) {
        a.op = 'insert';
        a.werte = werte;
        a.optionen = optionen;
        return b;
      },
      update(werte: unknown, optionen?: unknown) {
        a.op = 'update';
        a.werte = werte;
        a.optionen = optionen;
        return b;
      },
      delete(optionen?: unknown) {
        a.op = 'delete';
        a.optionen = optionen;
        return b;
      },
      eq(s: string, w: unknown) {
        a.filter.push(['eq', s, w]);
        return b;
      },
      in(s: string, w: unknown) {
        a.filter.push(['in', s, w]);
        return b;
      },
      is(s: string, w: unknown) {
        a.filter.push(['is', s, w]);
        return b;
      },
      order(s: string, o: unknown) {
        a.sortierung = [s, o];
        return b;
      },
      maybeSingle() {
        a.einzeln = true;
        return b;
      },
      then<T>(ok: (r: ReturnType<typeof antworte>) => T, fehl?: (e: unknown) => T) {
        return Promise.resolve(antworte(a)).then(ok, fehl);
      },
    };
    return b;
  };
  const client = {
    from,
    rpc: async (name: string, args: unknown) => antworte({ art: 'rpc', name, args, filter: [] }),
    storage: {
      from: (bucket: string) => ({
        upload: async (pfad: string, daten: unknown, optionen: unknown) =>
          antworte({ art: 'upload', tabelle: bucket, pfad, werte: daten, optionen, filter: [] }),
        download: async (pfad: string) => {
          const r = antworte({ art: 'download', tabelle: bucket, pfad, filter: [] });
          return { data: r.data as Blob | null, error: r.error };
        },
      }),
    },
  };
  return { client: client as unknown as SupabaseClient, aufrufe };
}
