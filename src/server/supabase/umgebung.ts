// Supabase-Umgebung (BE-12). Öffentliche Werte; der Service-Role-Schlüssel wird nur in admin.ts gelesen.
export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL fehlt');
  return url;
}

export function supabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt');
  return key;
}

/** Basis-URL für Links in Mails (Einladung, Passwort), ohne abschließenden Schrägstrich. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

/** Ziel in Einladungs- und Reset-Mails (Vorlagen in supabase/config.toml nutzen token_hash statt redirectTo). */
export function bestaetigungsUrl(): string {
  return `${siteUrl()}/api/auth/confirm?next=/passwort-neu`;
}
