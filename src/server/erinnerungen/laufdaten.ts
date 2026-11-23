// Laufdaten → Plan-Eingabe (BE-25). Statusberechnung wie in den Diensten (F-9, F-21), keine zweite Statuslogik.
import { anlassErledigtDurch } from '@/domain/anlass';
import { zustandsKennung, type PlanEingabe, type PlanMaGeraet, type PlanMitglied, type PlanPruefart } from '@/domain/erinnerungen';
import { istMangelOffen } from '@/domain/maengel';
import { nutzungAus } from '@/domain/nutzung';
import { berechneStatusImKontext } from '@/domain/status';
import {
  BETRIEBSSTATUS_LABEL,
  STATUS_LABEL,
  VOR_NUTZUNG_GRUND_LABEL,
  type Id,
  type IsoDate,
  type Nachweis,
  type StatusErgebnis,
} from '@/domain/types';
import { gesamtMitGrund, nachNeuestem } from '../dienste-basis';
import type { LaufDaten } from '../repo/types';

export function planEingabeAus(daten: LaufDaten, heute: IsoDate): PlanEingabe {
  const org = daten.organisation.id;
  const benutzer = new Map(daten.benutzer.map((b) => [b.id, b]));
  const aktive = daten.mitgliedschaften.filter((m) => m.aktiv && m.organisationId === org);
  const mitglieder: PlanMitglied[] = aktive
    .map((m) => ({ m, b: benutzer.get(m.benutzerId) }))
    .filter(({ b }) => b !== undefined && b.email.trim() !== '')
    .map(({ m, b }) => ({
      benutzerId: m.benutzerId,
      name: b!.name,
      email: b!.email,
      rolle: m.rolle,
      bereichIds: m.rolle === 'verantwortlicher' ? [...m.bereichIds] : [],
    }));
  const aktiveMa = new Set(aktive.filter((m) => m.rolle === 'mitarbeiter').map((m) => m.benutzerId));
  const freigegeben = new Set(daten.katalog.filter((k) => k.freigabestatus === 'freigegeben').map((k) => k.schluessel));

  const nachweiseJe = new Map<Id, Nachweis[]>();
  for (const n of daten.nachweise) nachweiseJe.set(n.geraetPruefartId, [...(nachweiseJe.get(n.geraetPruefartId) ?? []), n]);
  for (const liste of nachweiseJe.values()) liste.sort(nachNeuestem);

  const geraete = new Map(daten.geraete.map((g) => [g.id, g]));
  const statusJe = new Map<Id, StatusErgebnis>();
  const pruefarten: PlanPruefart[] = [];
  for (const pa of daten.pruefarten) {
    const g = geraete.get(pa.geraetId);
    if (!g) continue;
    const offeneAnlaesse = daten.anlaesse.filter((a) => a.geraetPruefartId === pa.id && anlassErledigtDurch(a, daten.nachweise).offen);
    const letzter = nachweiseJe.get(pa.id)?.[0];
    const status = berechneStatusImKontext(pa, heute, {
      betriebsstatus: g.betriebsstatus,
      anlassOffen: offeneAnlaesse.length > 0,
      nichtBestanden: letzter?.ergebnis === 'nicht_bestanden',
    });
    statusJe.set(pa.id, status);
    pruefarten.push({
      geraetPruefartId: pa.id,
      geraetId: g.id,
      bereichId: g.bereichId,
      geraetBezeichnung: g.bezeichnung,
      inventarnummer: g.inventarnummer,
      pruefartBezeichnung: pa.bezeichnung,
      betriebsstatus: g.betriebsstatus,
      status,
      frist: pa.frist ? { monate: pa.frist.monate, quelle: pa.frist.quelle, stufe: pa.frist.stufe, fundstelle: pa.frist.fundstelle } : null,
      zugewiesenerPrueferId: pa.zugewiesenerPrueferId,
      katalogEntwurf: pa.katalogSchluessel !== null && !freigegeben.has(pa.katalogSchluessel),
    });
  }

  const maGeraete: PlanMaGeraet[] = [];
  for (const g of daten.geraete) {
    const zugeordnetAn = g.zugeordnetAn !== null && aktiveMa.has(g.zugeordnetAn) ? g.zugeordnetAn : null;
    const offen = daten.offeneUebernahmen.find((u) => u.geraetId === g.id && u.bis === null);
    const uebernommenVon = offen?.benutzerId && aktiveMa.has(offen.benutzerId) ? offen.benutzerId : null;
    if (zugeordnetAn === null && uebernommenVon === null) continue;

    const eigene = daten.pruefarten.filter((p) => p.geraetId === g.id);
    const ergebnisse = eigene.map((p) => statusJe.get(p.id)!).filter(Boolean);
    const gefaehrlich = daten.maengel
      .filter((m) => m.geraetId === g.id && m.schwere === 'gefaehrlich' && istMangelOffen(m))
      .sort((a, b) => a.erfasstAm.localeCompare(b.erfasstAm) || a.id.localeCompare(b.id));
    const gesamt = gesamtMitGrund(ergebnisse, gefaehrlich.length > 0);
    const nutzung = nutzungAus(gesamt.status, g.betriebsstatus);
    const ueberschritten = ergebnisse
      .filter((e) => e.status === 'ueberfaellig' && e.faelligAm !== null)
      .map((e) => e.faelligAm as IsoDate)
      .sort();
    const offeneAnlaesse = daten.anlaesse
      .filter((a) => a.geraetId === g.id && anlassErledigtDurch(a, daten.nachweise).offen)
      .sort((a, b) => a.erfasstAm.localeCompare(b.erfasstAm) || a.id.localeCompare(b.id));
    const nichtBestanden = eigene
      .map((p) => nachweiseJe.get(p.id)?.[0])
      .filter((n): n is Nachweis => n !== undefined && n.ergebnis === 'nicht_bestanden')
      .sort((a, b) => nachNeuestem(a, b) || a.id.localeCompare(b.id));
    const letztesBetrieb = daten.betriebsstatusEreignisse
      .filter((e) => e.geraetId === g.id)
      .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt) || b.id.localeCompare(a.id))[0];
    const grundText =
      g.betriebsstatus !== 'in_betrieb'
        ? BETRIEBSSTATUS_LABEL[g.betriebsstatus]
        : gesamt.status === 'ueberfaellig'
          ? 'Überfällig'
          : gesamt.status === 'vor_nutzung_pruefen' && gesamt.grund
            ? VOR_NUTZUNG_GRUND_LABEL[gesamt.grund]
            : STATUS_LABEL[gesamt.status];
    maGeraete.push({
      geraetId: g.id,
      bereichId: g.bereichId,
      bezeichnung: g.bezeichnung,
      inventarnummer: g.inventarnummer,
      kategorie: g.kategorie,
      zugeordnetAn,
      uebernommenVon,
      nutzung,
      grundText,
      zustandsKennung: zustandsKennung({
        nutzung,
        betriebsstatus: g.betriebsstatus,
        letztesBetriebsstatusEreignisId: letztesBetrieb?.id ?? null,
        gesamtStatus: gesamt.status,
        gesamtStatusGrund: gesamt.grund,
        fruehestesUeberschrittenesFaelligAm: ueberschritten[0] ?? null,
        aeltesterGefaehrlicherMangelId: gefaehrlich[0]?.id ?? null,
        aeltesterOffenerAnlassId: offeneAnlaesse[0]?.id ?? null,
        letzterNichtBestandenNachweisId: nichtBestanden[0]?.id ?? null,
      }),
    });
  }

  return {
    heute,
    organisationId: org,
    bereiche: daten.bereiche.map((b) => ({ id: b.id, name: b.name })),
    einstellungen: daten.einstellungen,
    mitglieder,
    pruefarten,
    maGeraete,
    abmeldungen: daten.abmeldungen,
    bisherige: daten.bisherigePosten,
  };
}
