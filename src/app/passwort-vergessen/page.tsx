import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthRahmen } from '@/components/AuthRahmen';
import { PasswortVergessenForm } from '@/components/PasswortVergessenForm';
import { betriebsmodus } from '@/server/data';

export const metadata: Metadata = { title: 'Passwort vergessen' };
export const dynamic = 'force-dynamic';

export default function PasswortVergessenSeite() {
  if (betriebsmodus() !== 'supabase') redirect('/login');
  return (
    <AuthRahmen
      titel="Passwort vergessen"
      text="Geben Sie Ihre E-Mail-Adresse ein. Sie erhalten einen Link, mit dem Sie ein neues Passwort setzen."
    >
      <PasswortVergessenForm />
      <p className="text-sm">
        <Link href="/login" className="link">
          Zur Anmeldung
        </Link>
      </p>
    </AuthRahmen>
  );
}
