import type { Metadata, Viewport } from 'next';
import { DemoBanner } from '@/components/DemoBanner';
import { istDemoModus } from '@/server/data';
// Schriften aus Fontsource (OFL-1.1), vor globals.css: werden mitgebündelt, kein Netz beim Build, keine Fremd-Domain.
import '@fontsource-variable/space-grotesk';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
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
