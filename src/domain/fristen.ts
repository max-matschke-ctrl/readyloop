// Vertrag §3.4 – Implementierung folgt in BE-2.
import type {
  Bereich,
  Einsatzort,
  FristFestlegungEingabe,
  FristFestlegungErgebnis,
  FristVorschlag,
  Geraet,
  GeraetPruefart,
  KatalogEintrag,
} from './types';

const NI = 'nicht implementiert (BE-2)';

export function wirksamerEinsatzort(
  geraet: Pick<Geraet, 'einsatzort'>,
  bereich: Pick<Bereich, 'einsatzort'>,
): Einsatzort {
  void geraet;
  void bereich;
  throw new Error(NI);
}

export function waehleKatalogEintrag(
  katalog: readonly KatalogEintrag[],
  schluessel: string,
  einsatzort: Einsatzort,
  status: 'freigegeben' | 'entwurf',
): KatalogEintrag | null {
  void katalog;
  void schluessel;
  void einsatzort;
  void status;
  throw new Error(NI);
}

export function ermittleFristVorschlag(eingabe: {
  pruefart: Pick<GeraetPruefart, 'katalogSchluessel' | 'herstellerfristMonate' | 'herstellerfristQuelle'>;
  einsatzort: Einsatzort;
  katalog: readonly KatalogEintrag[];
}): FristVorschlag {
  void eingabe;
  throw new Error(NI);
}

export function legeFristFest(
  eingabe: FristFestlegungEingabe,
  kontext: {
    vorschlag: FristVorschlag;
    pruefart: Pick<GeraetPruefart, 'katalogSchluessel' | 'herstellerfristMonate'>;
    einsatzort: Einsatzort;
    katalog: readonly KatalogEintrag[];
  },
): FristFestlegungErgebnis {
  void eingabe;
  void kontext;
  throw new Error(NI);
}
