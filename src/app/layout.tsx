import type { Metadata, Viewport } from 'next';
import { DemoBanner } from '@/components/DemoBanner';
import { istDemoModus } from '@/server/data';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Readyloop', template: '%s · Readyloop' },
  description: 'Prüffristen für Arbeitsmittel im Blick, Nachweise griffbereit.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#44546a',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="min-h-dvh bg-paper text-ink">
        <DemoBanner demo={istDemoModus()} />
        {children}
      </body>
    </html>
  );
}
