// BE-28: Mapping I3 (hin und zurück), Supabase-Repository I3 und Supabase-System-Repository gegen den Fake-Client.
import { describe, expect, it } from 'vitest';
import type { ErinnerungEinstellung } from '@/domain/types';
import { DEMO_BEREICH_IDS, DEMO_ORG_ID, erzeugeDemoStand } from '@/server/repo/demo/daten';
import {
  RepositoryFehler,
  vonErinnerungEinstellung,
  vonErinnerungPosten,
  vonMailVersand,
  vonProtokollRohdaten,
  zuErinnerungEinstellung,
  zuErinnerungPosten,
  zuMailVersand,
  zuProtokollRohdaten,
} from '@/server/repo/supabase/mapping';
import { supabaseRepository } from '@/server/repo/supabase/repository';
import { supabaseSystemRepository } from '@/server/repo/supabase/system-repository';
import type { ProtokollRohdaten } from '@/server/repo/types';
import { fakeSupabase } from './hilfen/fake-supabase';

const stand = erzeugeDemoStand('2026-11-30');
const ORG = DEMO_ORG_ID;
const einstellung = stand.erinnerungEinstellungen[0];

describe('Mapping I3', () => {
  it('ErinnerungEinstellung hin und zurück; standard wird berechnet', () => {
    expect(zuErinnerungEinstellung(vonErinnerungEinstellung(einstellung))).toEqual(einstellung);
    const std: ErinnerungEinstellung = {
      ...einstellung,
      staffelTage: [90, 60, 30],
      eskalationTage: { verantwortlicher: 0, sifa: 7, admin: 14 },
      sifaInKopie: true,
      sifaEmpfaengerIds: null,
      adminEmpfaengerIds: null,
      standard: true,
    };
    expect(zuErinnerungEinstellung({ ...vonErinnerungEinstellung(std), geaendert_am: '2026-11-25 09:15:00+00' }).standard).toBe(true);
  });
  it('MailVersand und ErinnerungPosten hin und zurück', () => {
    for (const v of stand.mailVersand) expect(zuMailVersand(vonMailVersand(v))).toEqual(v);
    for (const p of stand.erinnerungPosten) expect(zuErinnerungPosten(vonErinnerungPosten(p))).toEqual(p);
  });
  it('ProtokollRohdaten hin und zurück', () => {
    const r: ProtokollRohdaten = {
      versand: stand.mailVersand.map((v) => ({ ...v, empfaengerName: v.art === 'ma_hinweis' ? null : 'X', empfaengerRolle: v.art === 'ma_hinweis' ? null : 'sifa' })),
      posten: stand.erinnerungPosten.filter((p) => p.art !== 'ma_hinweis'),
      gesamt: 3,
      letzterLauf: { laufDatum: '2026-11-29', status: 'fertig', beendetAm: '2026-11-29T06:01:00.000Z' },
    };
    expect(zuProtokollRohdaten(vonProtokollRohdaten(r))).toEqual(r);
    expect(zuProtokollRohdaten({ gesamt: 0, versand: [], posten: [], letzter_lauf: null })).toEqual({ versand: [], posten: [], gesamt: 0, letzterLauf: null });
  });
});

describe('Supabase-Repository I3 (Benutzer-Client, RLS)', () => {
  it('Einstellungen lesen mit organisation_id; speichern als Upsert ohne geaendert_*', async () => {
    const { client, aufrufe } = fakeSupabase((a) => (a.tabelle === 'erinnerung_einstellung' && a.op === 'select' ? { data: [vonErinnerungEinstellung(einstellung)] } : { data: null }));
    const repo = supabaseRepository(client, ORG);
    expect(await repo.listeErinnerungEinstellungen(ORG)).toEqual([einstellung]);
    expect(aufrufe[0].filter).toEqual([['eq', 'organisation_id', ORG]]);
    await repo.speichereErinnerungEinstellung({ einstellung, ereignis: stand.ereignisse[0] });
    const upsert = aufrufe.at(-1)!;
    expect(upsert).toMatchObject({ tabelle: 'erinnerung_einstellung', op: 'upsert', optionen: { onConflict: 'bereich_id' } });
    expect(Object.keys(upsert.werte as object)).not.toContain('geaendert_von');
    expect(upsert.werte).toMatchObject({ bereich_id: DEMO_BEREICH_IDS.produktion, staffel_tage: [60, 30, 14], admin_empfaenger: einstellung.adminEmpfaengerIds });
  });
  it('Abmeldungen: nur eigene abgemeldete Arten; Upsert auf (organisation_id, benutzer_id, art)', async () => {
    const { client, aufrufe } = fakeSupabase((a) => (a.tabelle === 'mail_abmeldung' && a.op === 'select' ? { data: [{ art: 'pruefer_woche' }] } : { data: null }));
    const repo = supabaseRepository(client, ORG);
    expect(await repo.listeEigeneAbmeldungen(ORG, 'u1')).toEqual(['pruefer_woche']);
    expect(aufrufe[0].filter).toEqual([['eq', 'organisation_id', ORG], ['eq', 'benutzer_id', 'u1'], ['eq', 'abgemeldet', true]]);
    await repo.setzeEigeneAbmeldung({ organisationId: ORG, benutzerId: 'u1', art: 'pruefer_woche', abgemeldet: false, jetzt: '' });
    expect(aufrufe.at(-1)).toMatchObject({
      op: 'upsert',
      werte: { organisation_id: ORG, benutzer_id: 'u1', art: 'pruefer_woche', abgemeldet: false },
      optionen: { onConflict: 'organisation_id,benutzer_id,art' },
    });
  });
  it('Protokoll über RPC mail_protokoll mit Seite → Offset; 42501 → RepositoryFehler', async () => {
    const { client, aufrufe } = fakeSupabase(() => ({ data: { gesamt: 0, versand: [], posten: [], letzter_lauf: null } }));
    const repo = supabaseRepository(client, ORG);
    await repo.listeMailProtokoll(ORG, { von: '2026-11-01', bis: '2026-11-30', status: 'probleme', seite: 3 });
    expect(aufrufe[0]).toMatchObject({
      art: 'rpc',
      name: 'mail_protokoll',
      args: { p_org: ORG, p_von: '2026-11-01', p_bis: '2026-11-30', p_status: 'probleme', p_art: null, p_bereich: null, p_limit: 50, p_offset: 100 },
    });
    const verboten = fakeSupabase(() => ({ error: { code: '42501', message: 'Keine Berechtigung' } }));
    await expect(supabaseRepository(verboten.client, ORG).listeMailProtokoll(ORG, { von: 'a', bis: 'b' })).rejects.toBeInstanceOf(RepositoryFehler);
  });
});

describe('Supabase-System-Repository (Service-Role)', () => {
  it('holeLaufDaten: jede Fachabfrage mit organisation_id (außer Katalog), Posten nur erfolgreiche mit Empfänger', async () => {
    const { client, aufrufe } = fakeSupabase((a) => {
      if (a.tabelle === 'organisation') return { data: [{ id: ORG, name: 'Elbtal', bg: null }] };
      if (a.tabelle === 'mitgliedschaft')
        return { data: [{ id: 'm1', organisation_id: ORG, benutzer_id: 'u1', anzeigename: 'Person', email: 'p@example.org', rolle: 'verantwortlicher', aktiv: true, pruefer_typen: [] }] };
      if (a.tabelle === 'bereich_verantwortung') return { data: [{ mitgliedschaft_id: 'm1', bereich_id: 'b1' }] };
      if (a.tabelle === 'erinnerung_posten')
        return {
          data: [
            { ...vonErinnerungPosten({ ...stand.erinnerungPosten[0], bezugDatum: '2026-12-20' }), mail_versand: { status: 'versendet' } },
            { ...vonErinnerungPosten({ ...stand.erinnerungPosten[0], id: 'alt', bezugDatum: '2024-01-01' }), mail_versand: { status: 'versendet' } },
          ],
        };
      return { data: [] };
    });
    const repo = supabaseSystemRepository(client);
    const d = await repo.holeLaufDaten(ORG, '2026-11-30');
    expect(d.organisation.name).toBe('Elbtal');
    expect(d.benutzer).toEqual([{ id: 'u1', name: 'Person', email: 'p@example.org' }]);
    expect(d.mitgliedschaften[0].bereichIds).toEqual(['b1']);
    expect(d.bisherigePosten.map((p) => p.bezugDatum)).toEqual(['2026-12-20']); // frist älter als 730 Tage entfällt
    for (const a of aufrufe.filter((x) => x.art === 'from')) {
      if (a.tabelle === 'katalog_eintrag') continue;
      const orgFilter = a.filter.some(([op, s, w]) => op === 'eq' && (s === 'organisation_id' || (a.tabelle === 'organisation' && s === 'id')) && w === ORG);
      expect(orgFilter, a.tabelle).toBe(true);
    }
    const posten = aufrufe.find((a) => a.tabelle === 'erinnerung_posten')!;
    expect(posten.spalten).toContain('mail_versand!inner(status)');
    // F-33: im Supabase-Modus zählt vorschau NICHT als erinnert (Vorschau ist dort ein Trockenlauf)
    expect(posten.filter).toContainEqual(['in', 'mail_versand.status', ['versendet', 'zugestellt', 'bounce', 'beschwerde']]);
    expect(posten.filter).toContainEqual(['not', 'empfaenger_benutzer_id.is', null]);
    expect(aufrufe.filter((a) => a.art === 'from').every((a) => a.op === 'select')).toBe(true);
  });

  it('Schreiben nur über System-RPCs', async () => {
    const antworten: Record<string, unknown> = {
      erinnerung_lauf_starten: { ergebnis: 'gestartet', lauf: { id: 'l1', lauf_datum: '2026-11-30', ausloeser: 'pg_cron', status: 'laeuft', gestartet_am: '2026-11-30 05:00:00+00', beendet_am: null } },
      erinnerung_versand_reservieren: false,
      erinnerung_status_per_anbieter: true,
      mail_abmelden_system: true,
    };
    const { client, aufrufe } = fakeSupabase((a) => ({ data: a.art === 'rpc' ? (antworten[a.name!] ?? null) : [] }));
    const repo = supabaseSystemRepository(client);
    expect(await repo.starteLauf({ laufDatum: '2026-11-30', ausloeser: 'pg_cron', erzwingen: false, jetzt: '' })).toEqual({
      ergebnis: 'gestartet',
      lauf: { id: 'l1', laufDatum: '2026-11-30', ausloeser: 'pg_cron', status: 'laeuft', gestartetAm: '2026-11-30T05:00:00.000Z', beendetAm: null },
    });
    const v = stand.mailVersand[0];
    const p = stand.erinnerungPosten.filter((x) => x.versandId === v.id);
    expect(await repo.reserviereVersand({ versand: v, posten: p })).toBe(false);
    const reservieren = aufrufe.find((a) => a.name === 'erinnerung_versand_reservieren')!.args as { p_versand: Record<string, unknown>; p_posten: Record<string, unknown>[] };
    expect(reservieren.p_versand).toEqual({ id: v.id, organisation_id: v.organisationId, lauf_id: v.laufId, lauf_datum: v.laufDatum, art: v.art, empfaenger_benutzer_id: v.empfaengerBenutzerId });
    expect(reservieren.p_posten[0]).toMatchObject({ schluessel: p[0].schluessel, stufe: p[0].stufe, geraet_id: p[0].geraetId });
    await repo.setzeVersandStatus({ versandId: v.id, status: 'versendet', versuche: 2, anbieterId: 're-1', fehlerCode: null, jetzt: '' });
    await repo.beendeLauf({ laufId: 'l1', status: 'fertig', jetzt: '' });
    expect(await repo.setzeStatusPerAnbieterId({ anbieterId: 're-1', status: 'bounce', jetzt: '' })).toBe(true);
    expect(await repo.setzeAbmeldungSystem({ organisationId: ORG, benutzerId: 'u', art: 'ma_hinweis', abgemeldet: true, jetzt: '' })).toBe(true);
    await repo.pseudonymisiereMaHinweise(new Date());
    expect(aufrufe.filter((a) => a.art === 'from')).toEqual([]);
    expect(aufrufe.map((a) => a.name)).toEqual([
      'erinnerung_lauf_starten',
      'erinnerung_versand_reservieren',
      'erinnerung_versand_status',
      'erinnerung_lauf_beenden',
      'erinnerung_status_per_anbieter',
      'mail_abmelden_system',
    ]);
  });

  it('holeAbmeldeKontext: nur aktives Mitglied mit passender Rolle, Abfragen mit organisation_id', async () => {
    const rolle = { value: 'pruefer' };
    const { client, aufrufe } = fakeSupabase((a) => {
      if (a.tabelle === 'mitgliedschaft') return { data: [{ rolle: rolle.value }] };
      if (a.tabelle === 'organisation') return { data: [{ name: 'Elbtal' }] };
      if (a.tabelle === 'mail_abmeldung') return { data: [{ abgemeldet: true }] };
      return { data: [] };
    });
    const repo = supabaseSystemRepository(client);
    expect(await repo.holeAbmeldeKontext({ organisationId: ORG, benutzerId: 'u', art: 'pruefer_woche' })).toEqual({ organisationName: 'Elbtal', abgemeldet: true });
    expect(aufrufe[0].filter).toEqual([['eq', 'organisation_id', ORG], ['eq', 'benutzer_id', 'u'], ['eq', 'aktiv', true]]);
    rolle.value = 'verantwortlicher';
    expect(await repo.holeAbmeldeKontext({ organisationId: ORG, benutzerId: 'u', art: 'pruefer_woche' })).toBeNull();
  });
});
