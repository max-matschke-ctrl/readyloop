// BE-16: Demo-Daten und Demo-Repository I3M (Abnahme docs/backlog.md §6 BE-16).
import { beforeEach, describe, expect, it } from 'vitest';
import { istTokenFormat } from '@/domain/nutzung';
import { DEMO_BENUTZER_IDS, DEMO_ORG2_ID, DEMO_ORG_ID, DEMO_ROLLE_BENUTZER } from '@/server/repo/demo/daten';
import { erzeugeDemoRepository, type DemoRepository } from '@/server/repo/demo/repository';
import { alleUebernahmen } from './hilfen/demo-stand';

const HEUTE = '2026-11-19';
let repo: DemoRepository;
beforeEach(() => {
  repo = erzeugeDemoRepository(HEUTE);
});
const idVon = async (inv: string, org = DEMO_ORG_ID) => {
  const g = (await repo.listeGeraete(org)).find((x) => x.inventarnummer === inv);
  if (!g) throw new Error(inv);
  return g.id;
};

describe('Demo-Daten I3M', () => {
  it('Geräteanzahl unverändert (20 + 2 in Org 2)', async () => {
    expect(await repo.listeGeraete(DEMO_ORG_ID)).toHaveLength(20);
    expect(await repo.listeGeraete(DEMO_ORG2_ID)).toHaveLength(2);
  });

  it('Jonas (Demo-Rolle Mitarbeiter) und Aylin sind aktive Mitarbeiter in Elbtal', async () => {
    expect(DEMO_ROLLE_BENUTZER.mitarbeiter).toBe(DEMO_BENUTZER_IDS.jonas);
    const m = (await repo.listeMitgliedschaften(DEMO_ORG_ID)).filter((x) => x.rolle === 'mitarbeiter');
    expect(m.map((x) => x.benutzerId).sort()).toEqual([DEMO_BENUTZER_IDS.jonas, DEMO_BENUTZER_IDS.aylin].sort());
    expect(m.every((x) => x.aktiv && x.bereichIds.length === 0)).toBe(true);
    expect((await repo.holeBenutzer(DEMO_BENUTZER_IDS.jonas))?.name).toBe('Jonas Richter');
  });

  it('Jonas hat 1 Zuordnung (P-008) und 2 offene Übernahmen (L-002, L-008)', async () => {
    const zugeordnet = (await repo.listeGeraete(DEMO_ORG_ID)).filter((g) => g.zugeordnetAn === DEMO_BENUTZER_IDS.jonas);
    expect(zugeordnet.map((g) => g.inventarnummer)).toEqual(['P-008']);
    const offen = (await alleUebernahmen(repo, DEMO_ORG_ID)).filter((u) => u.bis === null && u.benutzerId === DEMO_BENUTZER_IDS.jonas);
    expect(offen.map((u) => u.geraetId).sort()).toEqual([await idVon('L-002'), await idVon('L-008')].sort());
  });

  it('abgeschlossene Übernahmen: L-006 Aylin (rueckgabe), P-004 pseudonymisiert', async () => {
    const u = await alleUebernahmen(repo, DEMO_ORG_ID);
    const l006 = u.find((x) => x.bis !== null && x.benutzerId === DEMO_BENUTZER_IDS.aylin);
    expect(l006).toMatchObject({ endeArt: 'rueckgabe', benutzerName: 'Aylin Demir', geraetId: await idVon('L-006') });
    const p004 = u.find((x) => x.benutzerId === null);
    expect(p004).toMatchObject({ geraetId: await idVon('P-004'), benutzerName: null, beendetVon: null, endeArt: 'rueckgabe' });
  });

  it('je Gerät genau ein aktiver Token im Format; L-001 zusätzlich deaktivierter Token', async () => {
    for (const org of [DEMO_ORG_ID, DEMO_ORG2_ID]) {
      const tokens = await repo.listeTokens(org);
      for (const g of await repo.listeGeraete(org)) {
        const aktiv = tokens.filter((t) => t.geraetId === g.id && t.aktiv);
        expect(aktiv, g.inventarnummer ?? '').toHaveLength(1);
        expect(istTokenFormat(aktiv[0].token)).toBe(true);
      }
    }
    expect((await repo.holeTokenRohdaten('demoL001xxxxxxxxxxxxxx', null))?.geraet.bezeichnung).toBe('Gabelstapler Linde H25');
    expect((await repo.holeTokenRohdaten('demoM001xxxxxxxxxxxxxx', null))?.organisationName).toBe('Muster Metallbau GmbH');
    expect(await repo.holeTokenRohdaten('demoL001altxxxxxxxxxxx', null)).toBeNull();
    expect(await repo.holeTokenRohdaten('unbekannt0000000000000', null)).toBeNull();
  });
});

describe('Demo-Repository I3M', () => {
  it('holeTokenRohdaten enthält keine Personennamen außer dem Prüfernamen des neuesten Nachweises', async () => {
    const roh = (await repo.holeTokenRohdaten('demoL008xxxxxxxxxxxxxx', null))!;
    // kein Verlauf: L-008 hat zwei Nachweise, öffentlich nur der neueste
    expect(roh.nachweise).toHaveLength(1);
    expect(roh.nachweise[0].prueferName).toBe('Marco Lindner');
    // P-001: offener Anlass enthalten; L-001 ohne Anlass
    expect((await repo.holeTokenRohdaten('demoP001xxxxxxxxxxxxxx', null))!.anlaesse).toHaveLength(1);
    expect((await repo.holeTokenRohdaten('demoL001xxxxxxxxxxxxxx', null))!.anlaesse).toEqual([]);
    const text = JSON.stringify(roh);
    for (const name of ['Jonas Richter', 'Katrin Vogel', 'Dr. Jens Hartmann', 'Rutschhemmende']) expect(text).not.toContain(name);
    expect(Object.keys(roh).sort()).toEqual(['anlaesse', 'eigeneOrganisation', 'geraet', 'nachweise', 'offeneMaengel', 'organisationName', 'pruefarten']);
    expect(roh.eigeneOrganisation).toBeNull();
    // F-24 (Review I3M): keine internen IDs in den öffentlichen Rohdaten
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });

  it('listeKurzRohdaten meine/suche/ids', async () => {
    const meine = await repo.listeKurzRohdaten(DEMO_ORG_ID, { art: 'meine' }, DEMO_BENUTZER_IDS.jonas);
    expect(meine.map((r) => r.geraet.inventarnummer).sort()).toEqual(['L-002', 'L-008', 'P-008']);
    expect(meine.find((r) => r.geraet.inventarnummer === 'P-008')).toMatchObject({ zugeordnetMir: true, offeneUebernahme: null });
    expect(meine.find((r) => r.geraet.inventarnummer === 'L-002')?.offeneUebernahme).toMatchObject({ vonMir: true });

    const suche = await repo.listeKurzRohdaten(DEMO_ORG_ID, { art: 'suche', suche: 'BOHR' }, DEMO_BENUTZER_IDS.jonas);
    expect(suche.map((r) => r.geraet.inventarnummer)).toEqual(['P-003']);
    expect(suche[0].offeneUebernahme).toEqual({ vonMir: false, seit: null });
    expect(await repo.listeKurzRohdaten(DEMO_ORG_ID, { art: 'suche', suche: 'a' }, DEMO_BENUTZER_IDS.jonas)).toEqual([]);
    const sortiert = await repo.listeKurzRohdaten(DEMO_ORG_ID, { art: 'suche', suche: 'pa' }, DEMO_BENUTZER_IDS.jonas);
    expect(sortiert.map((r) => r.geraet.bezeichnung)).toEqual([...sortiert.map((r) => r.geraet.bezeichnung)].sort((a, b) => a.localeCompare(b, 'de')));

    const fremd = await repo.listeKurzRohdaten(DEMO_ORG_ID, { art: 'ids', geraetIds: [await idVon('M-001', DEMO_ORG2_ID)] }, DEMO_BENUTZER_IDS.jonas);
    expect(fremd).toEqual([]);
  });

  it('starteUebernahme beendet vorherige; zweite offene ohne vorherige → Fehler', async () => {
    const p003 = await idVon('P-003');
    const alt = (await alleUebernahmen(repo, DEMO_ORG_ID, p003)).find((u) => u.bis === null)!;
    const jetzt = '2026-11-19T10:00:00.000Z';
    const neu = { id: 'u-neu', organisationId: DEMO_ORG_ID, geraetId: p003, benutzerId: DEMO_BENUTZER_IDS.jonas, benutzerName: 'Jonas Richter', von: jetzt, bis: null, endeArt: null, beendetVon: null };
    await expect(repo.starteUebernahme({ uebernahme: neu, vorherige: null })).rejects.toThrow();
    await repo.starteUebernahme({ uebernahme: neu, vorherige: { ...alt, bis: jetzt, endeArt: 'uebergabe', beendetVon: DEMO_BENUTZER_IDS.jonas } });
    const danach = await alleUebernahmen(repo, DEMO_ORG_ID, p003);
    expect(danach.filter((u) => u.bis === null).map((u) => u.benutzerId)).toEqual([DEMO_BENUTZER_IDS.jonas]);
    expect(danach.find((u) => u.id === alt.id)).toMatchObject({ endeArt: 'uebergabe', bis: jetzt });
  });

  it('erneuereToken deaktiviert den alten Token sofort', async () => {
    const l002 = await idVon('L-002');
    const t = await repo.erneuereToken({
      geraetId: l002,
      neu: { id: 't-neu', organisationId: DEMO_ORG_ID, geraetId: l002, token: 'neuerTokenAbcdefghijkl', aktiv: true, erstelltAm: '2026-11-19T10:00:00.000Z', deaktiviertAm: null },
      ereignis: { id: 'e1', organisationId: DEMO_ORG_ID, geraetId: l002, typ: 'etikett_erneuert', akteurId: 'x', akteurName: 'x', zeitpunkt: '2026-11-19T10:00:00.000Z', daten: {} },
    });
    expect(t).toBe('neuerTokenAbcdefghijkl');
    expect(await repo.holeTokenRohdaten('demoL002xxxxxxxxxxxxxx', null)).toBeNull();
    expect((await repo.holeTokenRohdaten(t, null))?.eigeneOrganisation).toBeNull();
    expect((await repo.holeTokenRohdaten(t, { benutzerId: DEMO_BENUTZER_IDS.jonas, organisationId: DEMO_ORG_ID }))?.eigeneOrganisation).toEqual({ geraetId: l002 });
  });

  it('loeseNutzungen: Zuordnung gelöst, offene Übernahmen austritt', async () => {
    await repo.loeseNutzungen({ organisationId: DEMO_ORG_ID, benutzerId: DEMO_BENUTZER_IDS.jonas, jetzt: '2026-11-19T10:00:00.000Z' });
    expect((await repo.holeGeraet(await idVon('P-008')))?.zugeordnetAn).toBeNull();
    const u = (await alleUebernahmen(repo, DEMO_ORG_ID)).filter((x) => x.benutzerId === DEMO_BENUTZER_IDS.jonas);
    expect(u.every((x) => x.bis !== null && x.endeArt === 'austritt')).toBe(true);
  });
});
