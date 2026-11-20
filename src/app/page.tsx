import { redirect } from 'next/navigation';
import { holeAnmeldestatus, holeSitzung } from '@/server/data';

export const dynamic = 'force-dynamic';

export default async function Startseite() {
  const status = await holeAnmeldestatus();
  if (status === 'unkonfiguriert' || status === 'abgemeldet') redirect('/login');
  if (status === 'ohne_mitgliedschaft') redirect('/kein-zugang');
  const sitzung = await holeSitzung();
  if (!sitzung) redirect('/login');
  if (sitzung.rolle === 'mitarbeiter') redirect('/meine-geraete');
  redirect(sitzung.rolle === 'pruefer' ? '/pruefer' : '/geraete');
}
