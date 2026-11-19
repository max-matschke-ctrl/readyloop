import { redirect } from 'next/navigation';
import { holeSitzung } from '@/server/data';

export const dynamic = 'force-dynamic';

export default async function Startseite() {
  const sitzung = await holeSitzung();
  if (!sitzung) redirect('/login');
  redirect(sitzung.rolle === 'pruefer' ? '/pruefer' : '/geraete');
}
