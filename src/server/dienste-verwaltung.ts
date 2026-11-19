// Verwaltung (BE-10, F-17): Bereiche und Mitglieder. Nur admin (bereich.verwalten, mitglied.verwalten).
import { randomUUID } from 'node:crypto';
import { can } from '@/domain/rechte';
import type { BereichSpeichernEingabe, MitgliedAendernEingabe, MitgliedEinladenEingabe } from '@/domain/schemas';
import type { Bereich, BereichAnsicht, Benutzer, Id, Mitgliedschaft, MitgliedAnsicht, PrueferTyp, Sitzung } from '@/domain/types';
import { fehler, neuesEreignis, type DienstErgebnis } from './dienste-basis';
import type { Repository } from './repo/types';

export async function listeBereicheVerwaltung(sitzung: Sitzung, repo: Repository): Promise<BereichAnsicht[]> {
  if (!can(sitzung.rolle, 'bereich.verwalten')) return [];
  const org = sitzung.organisation.id;
  const [bereiche, geraete, mitglieder, benutzer] = await Promise.all([
    repo.listeBereiche(org),
    repo.listeGeraete(org),
    repo.listeMitgliedschaften(org),
    repo.listeBenutzer(org),
  ]);
  const name = new Map(benutzer.map((b) => [b.id, b.name]));
  return bereiche
    .map((bereich) => ({
      bereich,
      geraeteAnzahl: geraete.filter((g) => g.bereichId === bereich.id).length,
      verantwortliche: mitglieder
        .filter((m) => m.aktiv && m.rolle === 'verantwortlicher' && m.bereichIds.includes(bereich.id))
        .map((m) => ({ benutzerId: m.benutzerId, name: name.get(m.benutzerId) ?? '', rolle: m.rolle }))
        .sort((a, b) => a.name.localeCompare(b.name, 'de')),
    }))
    .sort((a, b) => a.bereich.name.localeCompare(b.bereich.name, 'de'));
}

function mitgliedAnsicht(sitzung: Sitzung, m: Mitgliedschaft, benutzer: Map<Id, Benutzer>, bereiche: Map<Id, string>): MitgliedAnsicht {
  const b = benutzer.get(m.benutzerId) ?? { id: m.benutzerId, name: '', email: '' };
  return {
    mitgliedschaftId: m.id,
    benutzer: b,
    rolle: m.rolle,
    bereichIds: m.bereichIds,
    bereichNamen: m.bereichIds.map((id) => bereiche.get(id) ?? '').filter((n) => n !== '').sort((x, y) => x.localeCompare(y, 'de')),
    prueferTypen: m.prueferTypen,
    aktiv: m.aktiv,
    istEigeneMitgliedschaft: m.id === sitzung.mitgliedschaftId,
  };
}

async function ladeMitglieder(sitzung: Sitzung, repo: Repository) {
  const org = sitzung.organisation.id;
  const [mitglieder, benutzer, bereiche] = await Promise.all([
    repo.listeMitgliedschaften(org),
    repo.listeBenutzer(org),
    repo.listeBereiche(org),
  ]);
  return {
    mitglieder,
    benutzer: new Map(benutzer.map((b) => [b.id, b])),
    bereiche: new Map(bereiche.map((b) => [b.id, b.name])),
  };
}

/** Aktive zuerst, dann alphabetisch. */
export async function listeMitglieder(sitzung: Sitzung, repo: Repository): Promise<MitgliedAnsicht[]> {
  if (!can(sitzung.rolle, 'mitglied.verwalten')) return [];
  const { mitglieder, benutzer, bereiche } = await ladeMitglieder(sitzung, repo);
  return mitglieder
    .map((m) => mitgliedAnsicht(sitzung, m, benutzer, bereiche))
    .sort((a, b) => Number(b.aktiv) - Number(a.aktiv) || a.benutzer.name.localeCompare(b.benutzer.name, 'de'));
}

export async function holeMitglied(sitzung: Sitzung, repo: Repository, mitgliedschaftId: Id): Promise<MitgliedAnsicht | null> {
  if (!can(sitzung.rolle, 'mitglied.verwalten')) return null;
  const { mitglieder, benutzer, bereiche } = await ladeMitglieder(sitzung, repo);
  const m = mitglieder.find((x) => x.id === mitgliedschaftId);
  return m ? mitgliedAnsicht(sitzung, m, benutzer, bereiche) : null;
}

export async function bereichSpeichern(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: BereichSpeichernEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ id: Id }>> {
  if (!can(sitzung.rolle, 'bereich.verwalten')) return fehler('Keine Berechtigung, Bereiche zu verwalten.');
  const bereiche = await repo.listeBereiche(sitzung.organisation.id);
  const alt = eingabe.bereichId ? bereiche.find((b) => b.id === eingabe.bereichId) : undefined;
  if (eingabe.bereichId && !alt) return fehler('Bereich nicht gefunden.');
  const name = eingabe.name.trim();
  if (bereiche.some((b) => b.id !== alt?.id && b.name.toLocaleLowerCase('de') === name.toLocaleLowerCase('de'))) {
    return fehler('Ein Bereich mit diesem Namen existiert bereits.', 'name');
  }
  const bereich: Bereich = {
    id: alt?.id ?? randomUUID(),
    organisationId: sitzung.organisation.id,
    // Pilot: ein Standort; ein neuer Bereich übernimmt den Standort der vorhandenen ('' = Repository wählt).
    standortId: alt?.standortId ?? bereiche[0]?.standortId ?? '',
    name,
    einsatzort: eingabe.einsatzort,
  };
  if (alt && alt.name === bereich.name && alt.einsatzort === bereich.einsatzort) return { ok: true, id: alt.id };
  await repo.speichereBereich({
    bereich,
    neu: !alt,
    ereignis: neuesEreignis(
      sitzung,
      null,
      'bereich_gespeichert',
      { bereichId: bereich.id, name: bereich.name, einsatzortAlt: alt?.einsatzort ?? null, einsatzort: bereich.einsatzort },
      jetzt,
    ),
  });
  return { ok: true, id: bereich.id };
}

/** Bereiche nur bei VER, Prüfertypen nur bei Prüfern. Bereiche müssen zur Organisation gehören. */
async function normalisiere(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: { rolle: Mitgliedschaft['rolle']; bereichIds: string[]; prueferTypen: PrueferTyp[] },
): Promise<DienstErgebnis<{ bereichIds: Id[]; prueferTypen: PrueferTyp[] }>> {
  const bereichIds = eingabe.rolle === 'verantwortlicher' ? [...new Set(eingabe.bereichIds)] : [];
  const prueferTypen = eingabe.rolle === 'pruefer' ? [...new Set(eingabe.prueferTypen)] : [];
  if (eingabe.rolle === 'verantwortlicher' && bereichIds.length === 0) {
    return fehler('Verantwortliche brauchen mindestens einen Bereich.', 'bereichIds');
  }
  const vorhanden = new Set((await repo.listeBereiche(sitzung.organisation.id)).map((b) => b.id));
  if (bereichIds.some((id) => !vorhanden.has(id))) return fehler('Unbekannter Bereich.', 'bereichIds');
  return { ok: true, bereichIds, prueferTypen };
}

function mitgliedEreignis(sitzung: Sitzung, m: Mitgliedschaft, name: string, eingeladen: boolean, jetzt: Date) {
  return neuesEreignis(
    sitzung,
    null,
    'mitglied_gespeichert',
    { mitgliedschaftId: m.id, name, rolle: m.rolle, bereichIds: [...m.bereichIds].sort(), aktiv: m.aktiv, eingeladen },
    jetzt,
  );
}

/** Review I2 (Befund 6): Konto angelegt, Mitgliedschaft aber nicht gespeichert. */
export const MITGLIED_NACH_EINLADUNG_FEHLER = 'Konto angelegt, Zugang bitte erneut speichern.';

/** F-17/Q-23: unbekannte E-Mail → Einladung; bekannte → nur Mitgliedschaft. Doppelte Mitgliedschaft → Feld email. */
export async function mitgliedEinladen(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: MitgliedEinladenEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ id: Id; neu: boolean; meldung: string }>> {
  if (!can(sitzung.rolle, 'mitglied.verwalten')) return fehler('Keine Berechtigung, Mitglieder zu verwalten.');
  const email = eingabe.email.trim().toLowerCase();
  const org = sitzung.organisation.id;
  const [mitglieder, benutzer] = await Promise.all([repo.listeMitgliedschaften(org), repo.listeBenutzer(org)]);
  const istMitglied = (benutzerId: Id) => mitglieder.some((m) => m.benutzerId === benutzerId);
  if (benutzer.some((b) => b.email.toLowerCase() === email && istMitglied(b.id))) {
    return fehler('Diese E-Mail-Adresse ist bereits Mitglied dieser Organisation.', 'email');
  }
  const norm = await normalisiere(sitzung, repo, eingabe);
  if (!norm.ok) return norm;

  const eingeladen = await repo.ladeBenutzerEin({ email, name: eingabe.name });
  if (istMitglied(eingeladen.benutzerId)) {
    return fehler('Diese E-Mail-Adresse ist bereits Mitglied dieser Organisation.', 'email');
  }
  const mitgliedschaft: Mitgliedschaft = {
    id: randomUUID(),
    organisationId: org,
    benutzerId: eingeladen.benutzerId,
    rolle: eingabe.rolle,
    bereichIds: norm.bereichIds,
    prueferTypen: norm.prueferTypen,
    aktiv: true,
  };
  try {
    await repo.speichereMitgliedschaft({
      mitgliedschaft,
      benutzer: { id: eingeladen.benutzerId, name: eingabe.name, email },
      neu: true,
      ereignis: mitgliedEreignis(sitzung, mitgliedschaft, eingabe.name, eingeladen.neu, jetzt),
    });
  } catch (e) {
    // Konto (und ggf. Einladungsmail) existiert bereits; erneutes Speichern findet das Konto und legt nur den Zugang an.
    console.error('mitgliedEinladen: Mitgliedschaft nach Einladung nicht gespeichert', e);
    return fehler(MITGLIED_NACH_EINLADUNG_FEHLER);
  }
  return {
    ok: true,
    id: mitgliedschaft.id,
    neu: eingeladen.neu,
    meldung: eingeladen.neu
      ? `Einladung an ${email} versendet.`
      : `${eingabe.name} hat bereits ein Konto; Zugang angelegt.`,
  };
}

/** F-17: Name, Rolle, Bereiche, Prüfertypen, aktiv. Letzter aktiver Admin und eigene Mitgliedschaft geschützt. */
export async function mitgliedAendern(
  sitzung: Sitzung,
  repo: Repository,
  eingabe: MitgliedAendernEingabe,
  jetzt: Date,
): Promise<DienstErgebnis<{ id: Id }>> {
  if (!can(sitzung.rolle, 'mitglied.verwalten')) return fehler('Keine Berechtigung, Mitglieder zu verwalten.');
  const org = sitzung.organisation.id;
  const mitglieder = await repo.listeMitgliedschaften(org);
  const alt = mitglieder.find((m) => m.id === eingabe.mitgliedschaftId);
  if (!alt) return fehler('Mitglied nicht gefunden.');
  const eigen = alt.id === sitzung.mitgliedschaftId;
  if (eigen && eingabe.rolle !== alt.rolle) return fehler('Die eigene Rolle kann nicht geändert werden.', 'rolle');
  if (eigen && eingabe.aktiv !== alt.aktiv) return fehler('Die eigene Mitgliedschaft kann nicht deaktiviert werden.', 'aktiv');
  const andereAdmins = mitglieder.some((m) => m.id !== alt.id && m.rolle === 'admin' && m.aktiv);
  if (alt.rolle === 'admin' && alt.aktiv && !andereAdmins) {
    if (eingabe.rolle !== 'admin') return fehler('Der letzte aktive Admin kann nicht herabgestuft werden.', 'rolle');
    if (!eingabe.aktiv) return fehler('Der letzte aktive Admin kann nicht deaktiviert werden.', 'aktiv');
  }
  const norm = await normalisiere(sitzung, repo, eingabe);
  if (!norm.ok) return norm;
  const benutzer = await repo.holeBenutzer(alt.benutzerId);
  if (!benutzer) return fehler('Mitglied nicht gefunden.');
  const mitgliedschaft: Mitgliedschaft = {
    ...alt,
    rolle: eingabe.rolle,
    bereichIds: norm.bereichIds,
    prueferTypen: norm.prueferTypen,
    aktiv: eingabe.aktiv,
  };
  await repo.speichereMitgliedschaft({
    mitgliedschaft,
    benutzer: { ...benutzer, name: eingabe.name },
    neu: false,
    ereignis: mitgliedEreignis(sitzung, mitgliedschaft, eingabe.name, false, jetzt),
  });
  return { ok: true, id: alt.id };
}
