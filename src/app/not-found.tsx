import Link from 'next/link';

export default function NichtGefunden() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold">Nicht gefunden</h1>
      <p className="mt-2 text-sm">Die Seite existiert nicht oder Sie haben keinen Zugriff.</p>
      <p className="mt-4">
        <Link href="/" className="link">
          Zur Startseite
        </Link>
      </p>
    </main>
  );
}
