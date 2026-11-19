import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PasswortVergessenForm } from '@/components/PasswortVergessenForm';
import { betriebsmodus } from '@/server/data';

export const metadata: Metadata = { title: 'Passwort vergessen' };
export const dynamic = 'force-dynamic';

export default function PasswortVergessenSeite() {
  if (betriebsmodus() !== 'supabase') redirect('/login');
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Readyloop</h1>
      <div className="karte mt-6 space-y-4 p-5">
        <h2 className="text-lg font-semibold">Passwort vergessen</h2>
        <p className="text-sm text-steel">
          Geben Sie Ihre E-Mail-Adresse ein. Sie erhalten einen Link, mit dem Sie ein neues Passwort setzen.
        </p>
        <PasswortVergessenForm />
        <p className="text-sm">
          <Link href="/login" className="link">
            ← Zur Anmeldung
          </Link>
        </p>
      </div>
    </main>
  );
}
