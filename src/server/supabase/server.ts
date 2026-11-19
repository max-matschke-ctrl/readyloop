// Supabase-Benutzer-Client je Anfrage (BE-12). Fachdaten laufen immer hierüber, damit RLS greift (F-8).
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabaseAnonKey, supabaseUrl } from './umgebung';

export async function erzeugeServerClient(): Promise<SupabaseClient> {
  const jar = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (liste) => {
        try {
          for (const { name, value, options } of liste) jar.set(name, value, options);
        } catch {
          // Server Components dürfen keine Cookies setzen; die Middleware erneuert die Sitzung.
        }
      },
    },
  });
}
