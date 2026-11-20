// Etiketten und Token (BE-17, F-24, F-25): Druckdaten mit QR und Prüfplakette, Aufkleber erneuern.
import { randomUUID } from 'node:crypto';
import { can } from '@/domain/rechte';
import type { EtikettErneuernEingabe } from '@/domain/schemas';
import { naechsteFaelligkeit } from '@/domain/status';
import { ETIKETTEN_MAX, type Etikett, type EtikettenFilter, type Id, type Sitzung } from '@/domain/types';
import {
  baueAnsicht,
  fehler,
  geraetGesamt,
  geraetImBereich,
  ladeKontext,
  neuesEreignis,
  type DienstErgebnis,
  type Zeit,
} from './dienste-basis';
import { qrMatrix } from './qr';
import type { Repository } from './repo/types';
import { kurzUrl, neuerToken, tokenUrl } from './token';

const vergleiche = (a: string | null, b: string | null) => (a ?? '').localeCompare(b ?? '', 'de', { numeric: true });

/**
 * etikett.verwalten. F-25: nur Geräte im Geltungsbereich (andere werden ignoriert), höchstens ETIKETTEN_MAX;
 * geraetIds hat Vorrang; ohne geraetIds und ohne kategorie gilt 'wechselnd'. Sortierung Bereich, Inventarnummer, Bezeichnung.
 * Plakette: Gesamtstatus nach F-9 über alle Prüfarten und offenen Mängel zum Druckzeitpunkt. Drucken erzeugt kein Ereignis.
 */
export async function holeEtiketten(sitzung: Sitzung, repo: Repository, zeit: Zeit, filter: EtikettenFilter): Promise<Etikett[]> {
  if (!can(sitzung.rolle, 'etikett.verwalten')) return [];
  const [ctx, tokens] = await Promise.all([ladeKontext(sitzung, repo), repo.listeTokens(sitzung.organisation.id)]);
  const aktiv = new Map(tokens.filter((t) => t.aktiv).map((t) => [t.geraetId, t.token]));
  const ids = filter.geraetIds && filter.geraetIds.length > 0 ? new Set(filter.geraetIds) : null;
  const kategorie = filter.kategorie ?? 'wechselnd';

  const auswahl = [...ctx.geraete.values()].filter((g) => {
    if (!geraetImBereich(sitzung, g) || !aktiv.has(g.id)) return false;
    if (ids) return ids.has(g.id);
    return (!filter.bereichId || g.bereichId === filter.bereichId) && g.kategorie === kategorie;
  });
  const bereichName = (id: Id) => ctx.bereiche.get(id)?.name ?? '';
  auswahl.sort(
    (a, b) =>
      bereichName(a.bereichId).localeCompare(bereichName(b.bereichId), 'de') ||
      vergleiche(a.inventarnummer, b.inventarnummer) ||
      a.bezeichnung.localeCompare(b.bezeichnung, 'de'),
  );

  return auswahl.slice(0, ETIKETTEN_MAX).map((g) => {
    const ansichten = ctx.pruefarten.filter((p) => p.geraetId === g.id).map((p) => baueAnsicht(p, g, ctx, zeit.heute));
    const gesamt = geraetGesamt(
      ansichten,
      ctx.maengel.filter((m) => m.geraetId === g.id),
    );
    const url = tokenUrl(aktiv.get(g.id)!);
    return {
      geraetId: g.id,
      bezeichnung: g.bezeichnung,
      inventarnummer: g.inventarnummer,
      organisationName: sitzung.organisation.name,
      url,
      kurzUrl: kurzUrl(url),
      qr: qrMatrix(url),
      status: gesamt.status,
      faelligAm: naechsteFaelligkeit(ansichten.map((a) => a.status)),
      stand: zeit.heute,
    };
  });
}

/** F-24: etikett.verwalten + Geltungsbereich. Alter Token sofort ungültig, neuer aus neuerToken(); Ereignis etikett_erneuert. */
export async function etikettErneuern(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: EtikettErneuernEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ geraetId: Id; token: string }>> {
  if (!can(sitzung.rolle, 'etikett.verwalten')) return fehler('Keine Berechtigung, Aufkleber zu erneuern.');
  if (eingabe.bestaetigung !== 'on') return fehler('Bitte bestätigen, dass der alte Aufkleber ungültig wird.', 'bestaetigung');
  const geraet = await repo.holeGeraet(eingabe.geraetId);
  if (!geraet || !geraetImBereich(sitzung, geraet)) return fehler('Gerät nicht gefunden.');
  const token = await repo.erneuereToken({
    geraetId: geraet.id,
    neu: {
      id: randomUUID(),
      organisationId: geraet.organisationId,
      geraetId: geraet.id,
      token: neuerToken(),
      aktiv: true,
      erstelltAm: jetzt.toISOString(),
      deaktiviertAm: null,
    },
    ereignis: neuesEreignis(sitzung, geraet.id, 'etikett_erneuert', {}, jetzt),
  });
  return { ok: true, geraetId: geraet.id, token };
}
