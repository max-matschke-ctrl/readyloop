-- Readyloop Inkrement I3: E-Mail-Erinnerungen (BE-27)
-- Grundlage: docs/requirements.md §3c (F-30 bis F-43), §5, §6 „RLS I3“; docs/backlog.md §8 BE-27, §9.
-- Frühere Migrationen bleiben unverändert.
-- Grundsätze:
--   * RLS auf allen fünf Tabellen. mail_versand, erinnerung_posten, erinnerung_lauf: KEINE Policy für
--     authenticated/anon – Lesen nur über mail_protokoll (ADM/SIF, maskiert), Schreiben nur über System-RPCs,
--     die ausschließlich service_role ausführen darf (F-43).
--   * Versandprotokoll ohne Betreff, Inhalt, E-Mail-Adresse (F-41). Posten nur INSERT; Versand nur Statusfortschritt.
--     Unveränderlichkeit per Trigger, gilt auch für service_role. Kein DELETE.
--   * MA-Hinweise: Empfänger nach 90 Tagen entfernt (pg_cron, wie F-27).
--   * Auslöser: pg_cron + pg_net ruft /api/cron/erinnerungen (gleichwertig zu Vercel Cron, F-36).

-- =====================================================================
-- Ereignis-Typen (F-42)
-- =====================================================================

alter table public.ereignis drop constraint ereignis_typ_check;
alter table public.ereignis add constraint ereignis_typ_check check (typ in (
  'geraet_angelegt', 'frist_freigegeben', 'nachweis_erfasst', 'pruefer_zugewiesen', 'gbu_dokument_gesetzt',
  'geraet_verschoben', 'betriebsstatus_geaendert', 'anlass_erfasst', 'anlass_aufgehoben', 'mangel_erfasst',
  'mangel_kenntnis', 'mangel_behoben', 'bereich_gespeichert', 'mitglied_gespeichert',
  'zuordnung_geaendert', 'etikett_erneuert', 'erinnerung_einstellung_gespeichert'));

-- =====================================================================
-- Hilfsfunktionen
-- =====================================================================

-- F-31: 1–3 Werte, je 1–365, verschieden, absteigend gespeichert.
create or replace function app.staffel_gueltig(p_staffel int[])
returns boolean language sql immutable set search_path = pg_temp as $$
  select p_staffel is not null
    and coalesce(array_length(p_staffel, 1), 0) between 1 and 3
    and array_ndims(p_staffel) = 1
    and not exists (select 1 from unnest(p_staffel) w where w is null or w < 1 or w > 365)
    and not exists (
      select 1 from generate_series(2, coalesce(array_length(p_staffel, 1), 0)) i where p_staffel[i] >= p_staffel[i - 1]
    );
$$;

-- Rollen, die eine abbestellbare Mailart erhalten (MAIL_ART_FUER_ROLLE).
create or replace function app.rollen_fuer_mailart(p_art text)
returns text[] language sql immutable set search_path = pg_temp as $$
  select case p_art
    when 'frist_digest' then array['admin', 'sifa', 'verantwortlicher']
    when 'pruefer_woche' then array['pruefer']
    when 'ma_hinweis' then array['mitarbeiter']
    else array[]::text[]
  end;
$$;

-- Unveränderliche Protokolltabellen: kein DELETE, auch nicht für service_role.
create or replace function app.verbiete_loeschen()
returns trigger language plpgsql set search_path = pg_temp as $$
begin
  raise exception '%: Löschen nicht erlaubt (F-41)', tg_table_name using errcode = '42501';
end;
$$;

-- =====================================================================
-- Tabellen
-- =====================================================================

create table public.erinnerung_einstellung (
  bereich_id uuid primary key,
  organisation_id uuid not null references public.organisation (id),
  staffel_tage int[] not null default array[90, 60, 30] check (app.staffel_gueltig(staffel_tage)),
  eskalation_verantwortlicher int not null default 0,
  eskalation_sifa int not null default 7,
  eskalation_admin int not null default 14,
  sifa_in_kopie boolean not null default true,
  sifa_empfaenger uuid[] check (sifa_empfaenger is null or cardinality(sifa_empfaenger) between 1 and 50),
  admin_empfaenger uuid[] check (admin_empfaenger is null or cardinality(admin_empfaenger) between 1 and 50),
  geaendert_von uuid references auth.users (id),
  geaendert_von_name text,
  geaendert_am timestamptz not null default now(),
  constraint erinnerung_eskalation_reihenfolge check (
    0 <= eskalation_verantwortlicher and eskalation_verantwortlicher <= eskalation_sifa
    and eskalation_sifa <= eskalation_admin and eskalation_admin <= 90),
  foreign key (bereich_id, organisation_id) references public.bereich (id, organisation_id)
);

create table public.mail_abmeldung (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  benutzer_id uuid not null references auth.users (id),
  art text not null check (art in ('pruefer_woche', 'ma_hinweis')),
  abgemeldet boolean not null,
  geaendert_am timestamptz not null default now(),
  unique (organisation_id, benutzer_id, art)
);

-- Global (ohne Betriebsbezug): ein Lauf gilt für alle Organisationen.
create table public.erinnerung_lauf (
  id uuid primary key default gen_random_uuid(),
  lauf_datum date not null,
  ausloeser text not null check (ausloeser in ('vercel_cron', 'pg_cron', 'manuell')),
  -- teilweise: Zeitbudget erschöpft, der nächste Auslöser (05:20 UTC) setzt fort (F-36)
  status text not null default 'laeuft' check (status in ('laeuft', 'fertig', 'teilweise', 'fehler')),
  gestartet_am timestamptz not null default now(),
  beendet_am timestamptz,
  check ((status = 'laeuft') = (beendet_am is null))
);
create unique index erinnerung_lauf_ein_laufender on public.erinnerung_lauf (lauf_datum) where status = 'laeuft';
create index on public.erinnerung_lauf (lauf_datum, status);

create table public.mail_versand (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  lauf_id uuid not null references public.erinnerung_lauf (id),
  lauf_datum date not null,
  art text not null check (art in ('frist_digest', 'pruefer_woche', 'ma_hinweis')),
  empfaenger_benutzer_id uuid references auth.users (id),
  status text not null default 'vorbereitet'
    check (status in ('vorbereitet', 'versendet', 'zugestellt', 'fehler', 'bounce', 'beschwerde', 'vorschau')),
  versuche int not null default 0 check (versuche between 0 and 3),
  anbieter_id text check (anbieter_id is null or length(anbieter_id) between 1 and 200),
  fehler_code text check (fehler_code in ('netzwerk', 'rate_limit', 'anbieter_fehler', 'abgelehnt', 'ungueltige_adresse', 'konfiguration',
    'abgebrochen')),
  posten_anzahl int not null check (posten_anzahl >= 0),
  erstellt_am timestamptz not null default now(),
  versendet_am timestamptz,
  status_am timestamptz not null default now(),
  pseudonymisiert_am timestamptz,
  -- bewusst KEIN Betreff, KEIN Inhalt, KEINE E-Mail-Adresse (F-41)
  unique (organisation_id, empfaenger_benutzer_id, lauf_datum),
  unique (id, organisation_id),
  check (empfaenger_benutzer_id is not null or art = 'ma_hinweis')
);
create index on public.mail_versand (organisation_id, lauf_datum desc, erstellt_am desc);
create index on public.mail_versand (anbieter_id) where anbieter_id is not null;

create table public.erinnerung_posten (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  versand_id uuid not null,
  schluessel text not null check (length(schluessel) between 1 and 300),
  art text not null check (art in ('frist', 'pruefer_woche', 'ma_hinweis')),
  stufe text not null check (stufe ~ '^(v[1-9][0-9]{0,2}|e_(verantwortlicher|sifa|admin)|woche|nicht_verwenden)$'),
  geraet_id uuid not null,
  geraet_pruefart_id uuid,
  bereich_id uuid not null,
  bezug_datum date,
  rolle text not null check (rolle in ('zustaendig', 'kopie')),
  empfaenger_benutzer_id uuid references auth.users (id),
  -- F-33 (BE-24b): wegen MAIL_MAX_POSTEN nicht einzeln in der Mail, nur in Summe genannt; gilt trotzdem als erinnert.
  in_summe boolean not null default false,
  erstellt_am timestamptz not null default now(),
  unique (versand_id, schluessel),
  foreign key (versand_id, organisation_id) references public.mail_versand (id, organisation_id),
  foreign key (geraet_id, organisation_id) references public.geraet (id, organisation_id),
  foreign key (geraet_pruefart_id, geraet_id, organisation_id) references public.geraet_pruefart (id, geraet_id, organisation_id),
  foreign key (bereich_id, organisation_id) references public.bereich (id, organisation_id),
  check ((art = 'ma_hinweis') = (geraet_pruefart_id is null)),
  check (empfaenger_benutzer_id is not null or art = 'ma_hinweis')
);
create index on public.erinnerung_posten (versand_id);
create index on public.erinnerung_posten (organisation_id, empfaenger_benutzer_id, art);

-- =====================================================================
-- Rechte (Grants) – RLS greift zusätzlich
-- =====================================================================

revoke all on public.erinnerung_einstellung, public.mail_abmeldung, public.erinnerung_lauf, public.mail_versand,
  public.erinnerung_posten from anon;
revoke all on public.erinnerung_lauf, public.mail_versand, public.erinnerung_posten from authenticated;
revoke delete, truncate on public.erinnerung_einstellung, public.mail_abmeldung from authenticated;
grant select, insert, update on public.erinnerung_einstellung, public.mail_abmeldung to authenticated;
-- service_role (F-43): lesen ja, schreiben nur über die System-RPCs (security definer).
grant select on public.erinnerung_einstellung, public.mail_abmeldung, public.erinnerung_lauf, public.mail_versand,
  public.erinnerung_posten to service_role;
revoke insert, update, delete, truncate on public.erinnerung_einstellung, public.mail_abmeldung,
  public.erinnerung_lauf, public.mail_versand, public.erinnerung_posten from service_role;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.erinnerung_einstellung enable row level security;
alter table public.mail_abmeldung enable row level security;
alter table public.erinnerung_lauf enable row level security;
alter table public.mail_versand enable row level security;
alter table public.erinnerung_posten enable row level security;

-- F-39: ADM/SIF alle Bereiche, VER eigene Bereiche lesend; schreiben nur ADM. Kein DELETE.
create policy erinnerung_einstellung_select on public.erinnerung_einstellung
  for select to authenticated using (
    app.hat_rolle(organisation_id, array['admin', 'sifa'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_bereich(bereich_id))
  );
create policy erinnerung_einstellung_insert on public.erinnerung_einstellung
  for insert to authenticated with check (app.hat_rolle(organisation_id, array['admin']));
create policy erinnerung_einstellung_update on public.erinnerung_einstellung
  for update to authenticated
  using (app.hat_rolle(organisation_id, array['admin']))
  with check (app.hat_rolle(organisation_id, array['admin']));

-- F-40: nur eigene Zeilen, nur als aktives Mitglied, nur die zur eigenen Rolle passende Art. Kein DELETE.
create policy mail_abmeldung_select on public.mail_abmeldung
  for select to authenticated using (benutzer_id = auth.uid() and app.ist_mitglied(organisation_id));
create policy mail_abmeldung_insert on public.mail_abmeldung
  for insert to authenticated with check (
    benutzer_id = auth.uid() and app.hat_rolle(organisation_id, app.rollen_fuer_mailart(art))
  );
create policy mail_abmeldung_update on public.mail_abmeldung
  for update to authenticated
  using (benutzer_id = auth.uid() and app.ist_mitglied(organisation_id))
  with check (benutzer_id = auth.uid() and app.hat_rolle(organisation_id, app.rollen_fuer_mailart(art)));

-- =====================================================================
-- erinnerung_einstellung: Stempel, Empfängerprüfung, Ereignis (F-39, F-42)
-- =====================================================================

-- JSON in der Form von ErinnerungEinstellung (src/domain/types.ts).
create or replace function app.erinnerung_einstellung_json(e public.erinnerung_einstellung)
returns jsonb language sql stable set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'organisationId', e.organisation_id,
    'bereichId', e.bereich_id,
    'staffelTage', to_jsonb(e.staffel_tage),
    'eskalationTage', jsonb_build_object(
      'verantwortlicher', e.eskalation_verantwortlicher, 'sifa', e.eskalation_sifa, 'admin', e.eskalation_admin),
    'sifaInKopie', e.sifa_in_kopie,
    'sifaEmpfaengerIds', to_jsonb(e.sifa_empfaenger),
    'adminEmpfaengerIds', to_jsonb(e.admin_empfaenger),
    'standard', e.staffel_tage = array[90, 60, 30] and e.eskalation_verantwortlicher = 0 and e.eskalation_sifa = 7
      and e.eskalation_admin = 14 and e.sifa_in_kopie and e.sifa_empfaenger is null and e.admin_empfaenger is null,
    'geaendertVon', e.geaendert_von,
    'geaendertVonName', e.geaendert_von_name,
    'geaendertAm', e.geaendert_am
  );
$$;

create or replace function app.erinnerung_einstellung_pruefen()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and (new.bereich_id, new.organisation_id) is distinct from (old.bereich_id, old.organisation_id) then
    raise exception 'Bereich einer Erinnerungseinstellung ist unveränderlich' using errcode = '42501';
  end if;
  if new.sifa_empfaenger is not null and exists (
    select 1 from unnest(new.sifa_empfaenger) x
    where x is null or not app.aktives_mitglied_mit_rolle(new.organisation_id, x, array['sifa'])
  ) then
    raise exception 'Sifa-Auswahl: nur aktive Sifa dieser Organisation' using errcode = '23514';
  end if;
  if new.admin_empfaenger is not null and exists (
    select 1 from unnest(new.admin_empfaenger) x
    where x is null or not app.aktives_mitglied_mit_rolle(new.organisation_id, x, array['admin'])
  ) then
    raise exception 'Admin-Auswahl: nur aktive Admins dieser Organisation' using errcode = '23514';
  end if;
  new.geaendert_von := auth.uid();
  new.geaendert_von_name := app.akteur_name(new.organisation_id);
  new.geaendert_am := now();
  return new;
end;
$$;

create trigger erinnerung_einstellung_pruefen before insert or update on public.erinnerung_einstellung
  for each row execute function app.erinnerung_einstellung_pruefen();

create or replace function app.erinnerung_einstellung_ereignis()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
  values (
    new.organisation_id, null, 'erinnerung_einstellung_gespeichert', auth.uid(), app.akteur_name(new.organisation_id),
    jsonb_build_object(
      'bereichId', new.bereich_id,
      'bereich', (select b.name from public.bereich b where b.id = new.bereich_id),
      'alt', case when tg_op = 'UPDATE' then app.erinnerung_einstellung_json(old) else null end,
      'neu', app.erinnerung_einstellung_json(new)
    )
  );
  return new;
end;
$$;

create trigger erinnerung_einstellung_ereignis after insert or update on public.erinnerung_einstellung
  for each row execute function app.erinnerung_einstellung_ereignis();

-- =====================================================================
-- mail_abmeldung: Schlüsselspalten unveränderlich, Zeitstempel aus der DB
-- =====================================================================

create or replace function app.mail_abmeldung_pruefen()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and (new.organisation_id, new.benutzer_id, new.art) is distinct from (old.organisation_id, old.benutzer_id, old.art) then
    raise exception 'Abmeldung: Organisation, Person und Art sind unveränderlich' using errcode = '42501';
  end if;
  new.geaendert_am := now();
  return new;
end;
$$;

create trigger mail_abmeldung_pruefen before insert or update on public.mail_abmeldung
  for each row execute function app.mail_abmeldung_pruefen();

-- =====================================================================
-- Unveränderlichkeit Protokoll (F-41) – gilt auch für service_role
-- =====================================================================

-- Posten: nur INSERT; einzig erlaubtes UPDATE ist die Pseudonymisierung (ma_hinweis: Empfänger → null).
create or replace function app.erinnerung_posten_pruefen()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if (to_jsonb(new) - 'empfaenger_benutzer_id') <> (to_jsonb(old) - 'empfaenger_benutzer_id')
     or new.empfaenger_benutzer_id is not null
     or old.empfaenger_benutzer_id is null
     or old.art <> 'ma_hinweis' then
    raise exception 'erinnerung_posten ist unveränderlich (F-41)' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger erinnerung_posten_unveraenderlich before update on public.erinnerung_posten
  for each row execute function app.erinnerung_posten_pruefen();
create trigger erinnerung_posten_kein_loeschen before delete on public.erinnerung_posten
  for each row execute function app.verbiete_loeschen();

-- Versand: nur Statusfortschritt nach F-41 und Pseudonymisierung (ma_hinweis).
create or replace function app.mail_versand_pruefen()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  v_veraenderlich constant text[] := array['status', 'versuche', 'anbieter_id', 'fehler_code', 'versendet_am', 'status_am',
    'empfaenger_benutzer_id', 'pseudonymisiert_am'];
begin
  if (to_jsonb(new) - v_veraenderlich) <> (to_jsonb(old) - v_veraenderlich) then
    raise exception 'mail_versand: nur Status, Versuche, Anbieter-ID, Fehlercode und Zeitpunkte änderbar (F-41)' using errcode = '42501';
  end if;
  if new.status <> old.status and not (
    (old.status = 'vorbereitet' and new.status in ('versendet', 'fehler', 'vorschau'))
    or (old.status = 'versendet' and new.status in ('zugestellt', 'bounce', 'beschwerde'))
    or (old.status = 'zugestellt' and new.status in ('bounce', 'beschwerde'))
  ) then
    raise exception 'mail_versand: Statusübergang % → % nicht erlaubt (F-41)', old.status, new.status using errcode = '42501';
  end if;
  if new.versuche < old.versuche then
    raise exception 'mail_versand: Versuche zählen nur aufwärts' using errcode = '42501';
  end if;
  if old.anbieter_id is not null and new.anbieter_id is distinct from old.anbieter_id then
    raise exception 'mail_versand: Anbieter-ID ist unveränderlich' using errcode = '42501';
  end if;
  if new.empfaenger_benutzer_id is distinct from old.empfaenger_benutzer_id
     and (new.empfaenger_benutzer_id is not null or old.art <> 'ma_hinweis') then
    raise exception 'mail_versand: Empfänger nur bei MA-Hinweisen entfernbar (F-41)' using errcode = '42501';
  end if;
  if old.pseudonymisiert_am is not null and new.pseudonymisiert_am is distinct from old.pseudonymisiert_am then
    raise exception 'mail_versand: Pseudonymisierung ist endgültig' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger mail_versand_unveraenderlich before update on public.mail_versand
  for each row execute function app.mail_versand_pruefen();
create trigger mail_versand_kein_loeschen before delete on public.mail_versand
  for each row execute function app.verbiete_loeschen();

-- Lauf: nur laeuft → fertig | teilweise | fehler.
create or replace function app.erinnerung_lauf_pruefen()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if (new.id, new.lauf_datum, new.ausloeser, new.gestartet_am) is distinct from (old.id, old.lauf_datum, old.ausloeser, old.gestartet_am)
     or old.status <> 'laeuft' or new.status not in ('fertig', 'teilweise', 'fehler') then
    raise exception 'erinnerung_lauf: nur laeuft → fertig/teilweise/fehler (F-36)' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger erinnerung_lauf_unveraenderlich before update on public.erinnerung_lauf
  for each row execute function app.erinnerung_lauf_pruefen();
create trigger erinnerung_lauf_kein_loeschen before delete on public.erinnerung_lauf
  for each row execute function app.verbiete_loeschen();

-- =====================================================================
-- System-RPCs (nur service_role, F-43)
-- =====================================================================

-- F-36 Lauf-Sperre: hängende Läufe (> 15 Min.) gelten als abgebrochen (→ fehler, werden übernommen); Versände
-- abgebrochener Läufe, die noch „vorbereitet“ sind, → fehler (Code abgebrochen; ihre Posten zählen nicht als erinnert und
-- kommen nach F-33/F-36 am nächsten Werktag erneut). Je Datum höchstens ein fertiger nicht-manueller Lauf (außer
-- p_erzwingen); ein Lauf mit Status teilweise blockiert nicht (Fortsetzung). Höchstens ein laufender Lauf.
create or replace function public.erinnerung_lauf_starten(p_datum date, p_ausloeser text, p_erzwingen boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v public.erinnerung_lauf;
begin
  if p_datum is null or p_ausloeser is null or p_ausloeser not in ('vercel_cron', 'pg_cron', 'manuell') then
    raise exception 'Datum und gültiger Auslöser erforderlich' using errcode = '22023';
  end if;
  update public.erinnerung_lauf set status = 'fehler', beendet_am = now()
  where status = 'laeuft' and gestartet_am < now() - interval '15 minutes';
  update public.mail_versand mv set status = 'fehler', fehler_code = 'abgebrochen', status_am = now()
  where mv.status = 'vorbereitet'
    and exists (select 1 from public.erinnerung_lauf l where l.id = mv.lauf_id and l.status <> 'laeuft');
  if not coalesce(p_erzwingen, false)
     and exists (select 1 from public.erinnerung_lauf
                 where lauf_datum = p_datum and status = 'fertig' and ausloeser <> 'manuell') then
    return jsonb_build_object('ergebnis', 'bereits_gelaufen');
  end if;
  if exists (select 1 from public.erinnerung_lauf where status = 'laeuft') then
    return jsonb_build_object('ergebnis', 'laeuft');
  end if;
  begin
    insert into public.erinnerung_lauf (lauf_datum, ausloeser) values (p_datum, p_ausloeser) returning * into v;
  exception when unique_violation then
    return jsonb_build_object('ergebnis', 'laeuft');
  end;
  return jsonb_build_object('ergebnis', 'gestartet', 'lauf', jsonb_build_object(
    'id', v.id, 'lauf_datum', v.lauf_datum, 'ausloeser', v.ausloeser, 'status', v.status,
    'gestartet_am', v.gestartet_am, 'beendet_am', v.beendet_am));
end;
$$;

create or replace function public.erinnerung_lauf_beenden(p_lauf uuid, p_status text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_status is null or p_status not in ('fertig', 'teilweise', 'fehler') then
    raise exception 'Lauf endet mit fertig, teilweise oder fehler' using errcode = '22023';
  end if;
  update public.erinnerung_lauf set status = p_status, beendet_am = now() where id = p_lauf and status = 'laeuft';
end;
$$;

-- F-36: Versand und Posten in EINER Transaktion; Konflikt (Organisation, Empfänger, Datum) → false, nichts geschrieben.
-- p_versand: { id, organisation_id, lauf_id, lauf_datum, art, empfaenger_benutzer_id }
-- p_posten:  [{ id, schluessel, art, stufe, geraet_id, geraet_pruefart_id, bereich_id, bezug_datum, rolle, in_summe }]
-- Organisation und Empfänger der Posten kommen immer aus dem Versand (keine Mischung über Mandanten).
create or replace function public.erinnerung_versand_reservieren(p_versand jsonb, p_posten jsonb)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id uuid := coalesce((p_versand ->> 'id')::uuid, gen_random_uuid());
  v_org uuid := (p_versand ->> 'organisation_id')::uuid;
  v_lauf uuid := (p_versand ->> 'lauf_id')::uuid;
  v_datum date := (p_versand ->> 'lauf_datum')::date;
  v_art text := p_versand ->> 'art';
  v_empf uuid := (p_versand ->> 'empfaenger_benutzer_id')::uuid;
  v_anzahl int := coalesce(jsonb_array_length(p_posten), 0);
begin
  if v_org is null or v_empf is null or v_anzahl = 0 then
    raise exception 'Versand braucht Organisation, Empfänger und Posten' using errcode = '22004';
  end if;
  if not exists (select 1 from public.erinnerung_lauf l where l.id = v_lauf and l.lauf_datum = v_datum and l.status = 'laeuft') then
    raise exception 'Kein laufender Lauf für dieses Datum' using errcode = '55000';
  end if;
  if not app.aktives_mitglied_mit_rolle(v_org, v_empf, app.rollen_fuer_mailart(v_art)) then
    raise exception 'Empfänger ist kein aktives Mitglied mit passender Rolle' using errcode = '23514';
  end if;
  if exists (select 1 from jsonb_array_elements(p_posten) e
             where e ? 'organisation_id' and (e ->> 'organisation_id')::uuid is distinct from v_org) then
    raise exception 'Posten gehören zu einer anderen Organisation' using errcode = '23514';
  end if;

  insert into public.mail_versand (id, organisation_id, lauf_id, lauf_datum, art, empfaenger_benutzer_id, posten_anzahl)
  values (v_id, v_org, v_lauf, v_datum, v_art, v_empf, v_anzahl)
  on conflict (organisation_id, empfaenger_benutzer_id, lauf_datum) do nothing;
  if not found then
    return false;
  end if;

  insert into public.erinnerung_posten (id, organisation_id, versand_id, schluessel, art, stufe, geraet_id,
    geraet_pruefart_id, bereich_id, bezug_datum, rolle, empfaenger_benutzer_id, in_summe)
  select coalesce((e ->> 'id')::uuid, gen_random_uuid()), v_org, v_id, e ->> 'schluessel', e ->> 'art', e ->> 'stufe',
    (e ->> 'geraet_id')::uuid, (e ->> 'geraet_pruefart_id')::uuid, (e ->> 'bereich_id')::uuid,
    (e ->> 'bezug_datum')::date, e ->> 'rolle', v_empf, coalesce((e ->> 'in_summe')::boolean, false)
  from jsonb_array_elements(p_posten) e;
  return true;
end;
$$;

create or replace function public.erinnerung_versand_status(
  p_versand uuid, p_status text, p_versuche int, p_anbieter_id text, p_fehler_code text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.mail_versand
  set status = p_status,
      versuche = p_versuche,
      anbieter_id = coalesce(p_anbieter_id, anbieter_id),
      fehler_code = p_fehler_code,
      versendet_am = case when p_status in ('versendet', 'vorschau') then now() else versendet_am end,
      status_am = now()
  where id = p_versand;
  if not found then
    raise exception 'Versand nicht gefunden' using errcode = 'P0002';
  end if;
end;
$$;

-- Webhook (F-37): false bei unbekannter Anbieter-ID oder unzulässigem Übergang.
create or replace function public.erinnerung_status_per_anbieter(p_anbieter_id text, p_status text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_status not in ('zugestellt', 'bounce', 'beschwerde') or p_anbieter_id is null then
    return false;
  end if;
  update public.mail_versand
  set status = p_status, status_am = now()
  where anbieter_id = p_anbieter_id
    and (status = 'versendet' or (status = 'zugestellt' and p_status in ('bounce', 'beschwerde')));
  return found;
end;
$$;

-- F-40: Abmeldung per Token ohne Sitzung; nur aktives Mitglied mit der zur Art passenden Rolle.
create or replace function public.mail_abmelden_system(p_org uuid, p_benutzer uuid, p_art text, p_abgemeldet boolean)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_art not in ('pruefer_woche', 'ma_hinweis') or p_abgemeldet is null
     or not app.aktives_mitglied_mit_rolle(p_org, p_benutzer, app.rollen_fuer_mailart(p_art)) then
    return false;
  end if;
  insert into public.mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet)
  values (p_org, p_benutzer, p_art, p_abgemeldet)
  on conflict (organisation_id, benutzer_id, art) do update set abgemeldet = excluded.abgemeldet;
  return true;
end;
$$;

-- =====================================================================
-- Versandprotokoll (F-41): nur ADM/SIF, MA-Hinweise maskiert, keine Personenfilter
-- =====================================================================

create or replace function public.mail_protokoll(
  p_org uuid, p_von date, p_bis date, p_status text default null, p_art text default null, p_bereich uuid default null,
  p_limit int default 50, p_offset int default 0)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_ids uuid[];
  v_seite uuid[];
  v_versand jsonb;
  v_posten jsonb;
  v_lauf jsonb;
begin
  if not app.hat_rolle(p_org, array['admin', 'sifa']) then
    raise exception 'Keine Berechtigung für das Versandprotokoll' using errcode = '42501';
  end if;

  -- Auswahl nach Zeitraum, Status („probleme“), Art, Bereich – bewusst KEIN Filter nach Person (R-45).
  -- Bereichsfilter nur über Frist-/Prüfer-Posten: MA-Hinweise verraten kein Gerät und keinen Bereich.
  select coalesce(array_agg(v.id order by v.lauf_datum desc, v.erstellt_am desc, v.id), '{}') into v_ids
  from public.mail_versand v
  where v.organisation_id = p_org
    and v.lauf_datum between p_von and p_bis
    and (p_status is null
         or (p_status = 'probleme' and v.status in ('fehler', 'bounce', 'beschwerde'))
         or v.status = p_status)
    and (p_art is null or v.art = p_art)
    and (p_bereich is null or (v.art <> 'ma_hinweis' and exists (
      select 1 from public.erinnerung_posten p where p.versand_id = v.id and p.bereich_id = p_bereich)));
  v_seite := coalesce(v_ids[v_offset + 1 : v_offset + v_limit], '{}');

  -- MA-Hinweise: Empfänger nur bei Problem-Status (Adresse korrigieren), Posten nie (F-41).
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', v.id, 'organisation_id', v.organisation_id, 'lauf_id', v.lauf_id, 'lauf_datum', v.lauf_datum, 'art', v.art,
      'empfaenger_benutzer_id', case when sb.sichtbar then v.empfaenger_benutzer_id end,
      'status', v.status, 'versuche', v.versuche, 'anbieter_id', v.anbieter_id, 'fehler_code', v.fehler_code,
      'posten_anzahl', v.posten_anzahl, 'erstellt_am', v.erstellt_am, 'versendet_am', v.versendet_am,
      'status_am', v.status_am,
      'empfaenger_name', case when sb.sichtbar then m.anzeigename end,
      'empfaenger_rolle', case when sb.sichtbar then m.rolle end)
      order by v.lauf_datum desc, v.erstellt_am desc, v.id), '[]'::jsonb)
  into v_versand
  from public.mail_versand v
  left join public.mitgliedschaft m on m.organisation_id = v.organisation_id and m.benutzer_id = v.empfaenger_benutzer_id
  cross join lateral (select v.art <> 'ma_hinweis' or v.status in ('fehler', 'bounce', 'beschwerde') as sichtbar) sb
  where v.id = any (v_seite) and v.organisation_id = p_org;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id, 'organisation_id', p.organisation_id, 'versand_id', p.versand_id, 'schluessel', p.schluessel,
      'art', p.art, 'stufe', p.stufe, 'geraet_id', p.geraet_id, 'geraet_pruefart_id', p.geraet_pruefart_id,
      'bereich_id', p.bereich_id, 'bezug_datum', p.bezug_datum, 'rolle', p.rolle,
      'empfaenger_benutzer_id', p.empfaenger_benutzer_id, 'in_summe', p.in_summe, 'erstellt_am', p.erstellt_am)
      order by p.versand_id, p.schluessel), '[]'::jsonb)
  into v_posten
  from public.erinnerung_posten p
  join public.mail_versand v on v.id = p.versand_id
  where p.versand_id = any (v_seite) and v.organisation_id = p_org and v.art <> 'ma_hinweis';

  select jsonb_build_object('lauf_datum', l.lauf_datum, 'status', l.status, 'beendet_am', l.beendet_am) into v_lauf
  from public.erinnerung_lauf l order by l.gestartet_am desc, l.id limit 1;

  return jsonb_build_object('gesamt', cardinality(v_ids), 'versand', v_versand, 'posten', v_posten, 'letzter_lauf', v_lauf);
end;
$$;

-- =====================================================================
-- Pseudonymisierung der MA-Hinweise nach 90 Tagen (F-41, wie F-27)
-- =====================================================================

create or replace function app.mail_pseudonymisieren()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  n integer;
begin
  update public.erinnerung_posten set empfaenger_benutzer_id = null
  where art = 'ma_hinweis' and erstellt_am < now() - interval '90 days' and empfaenger_benutzer_id is not null;
  update public.mail_versand set empfaenger_benutzer_id = null, pseudonymisiert_am = now()
  where art = 'ma_hinweis' and erstellt_am < now() - interval '90 days' and empfaenger_benutzer_id is not null;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- =====================================================================
-- Auslöser pg_cron + pg_net (F-36): ruft /api/cron/erinnerungen mit Bearer-Secret aus dem Vault
-- =====================================================================

create or replace function app.erinnerungen_ausloesen()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_url text;
  v_secret text;
begin
  begin
    execute $q$select decrypted_secret from vault.decrypted_secrets where name = 'readyloop_cron_url'$q$ into v_url;
    execute $q$select decrypted_secret from vault.decrypted_secrets where name = 'readyloop_cron_secret'$q$ into v_secret;
  exception when invalid_schema_name or undefined_table then
    v_url := null;
  end;
  if v_url is null or v_secret is null or v_url = '' or v_secret = '' then
    raise warning 'READYLOOP F-36: Vault-Secrets fehlen (readyloop_cron_url, readyloop_cron_secret) – Erinnerungslauf per pg_cron nicht ausgelöst.';
    return;
  end if;
  perform net.http_post(
    url := v_url,
    body := '{"ausloeser":"pg_cron"}'::jsonb,
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret, 'Content-Type', 'application/json'),
    timeout_milliseconds := 55000
  );
end;
$$;

-- Jobs: readyloop_erinnerungen Mo–Fr 05:00 UTC, readyloop_erinnerungen_fortsetzung Mo–Fr 05:20 UTC (setzt einen Lauf mit
-- Status teilweise fort; nach einem fertigen Lauf antwortet er bereits_gelaufen); readyloop_mail_pseudonymisieren täglich 03:20 Europe/Berlin
-- (Läufe 01:20 und 02:20 UTC, ausgeführt nur der Lauf um 03:xx Berlin, wie F-27).
-- Supabase-Kontext erkannt an der Rolle supabase_admin. Prüfung: supabase/tests/cron_erinnerungen.test.sql.
do $do$
declare
  v_job_lauf constant text := 'readyloop_erinnerungen';
  v_job_fortsetzung constant text := 'readyloop_erinnerungen_fortsetzung';
  v_cmd_lauf constant text := 'select app.erinnerungen_ausloesen()';
  v_job_pseudo constant text := 'readyloop_mail_pseudonymisieren';
  v_cmd_pseudo constant text :=
    $job$select app.mail_pseudonymisieren() where extract(hour from now() at time zone 'Europe/Berlin') = 3$job$;
  v_supabase constant boolean := exists (select 1 from pg_roles where rolname = 'supabase_admin');
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_net')
     and exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
  end if;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = v_job_pseudo) then
      perform cron.schedule(v_job_pseudo, '20 1,2 * * *', v_cmd_pseudo);
    end if;
    if exists (select 1 from pg_extension where extname = 'pg_net') then
      if not exists (select 1 from cron.job where jobname = v_job_lauf) then
        perform cron.schedule(v_job_lauf, '0 5 * * 1-5', v_cmd_lauf);
      end if;
      if not exists (select 1 from cron.job where jobname = v_job_fortsetzung) then
        perform cron.schedule(v_job_fortsetzung, '20 5 * * 1-5', v_cmd_lauf);
      end if;
    elsif v_supabase then
      raise warning using
        message = 'READYLOOP F-36: pg_net fehlt – der Erinnerungslauf wird NICHT von pg_cron ausgelöst (nur Vercel Cron).',
        hint = 'Supabase-Dashboard → Database → Extensions → pg_net aktivieren, Vault-Secrets readyloop_cron_url '
               || '(https://…/api/cron/erinnerungen) und readyloop_cron_secret (= CRON_SECRET) anlegen, dann diese Migration '
               || 'erneut ausführen. Kontrolle: supabase test db (cron_erinnerungen.test.sql muss grün sein).';
    else
      raise notice 'Readyloop: pg_net nicht verfügbar (kein Supabase-Kontext) – Erinnerungslauf nur über Vercel Cron oder manuell.';
    end if;
  elsif v_supabase then
    raise warning using
      message = 'READYLOOP F-36: pg_cron fehlt – Erinnerungslauf (pg_cron) und Pseudonymisierung der MA-Hinweise nach 90 Tagen laufen NICHT.',
      hint = 'Supabase-Dashboard → Database → Extensions → pg_cron und pg_net aktivieren, Vault-Secrets readyloop_cron_url '
             || 'und readyloop_cron_secret anlegen, dann diese Migration erneut ausführen oder einmalig: select cron.schedule('
             || quote_literal(v_job_pseudo) || ', ''20 1,2 * * *'', ' || quote_literal(v_cmd_pseudo) || '); select cron.schedule('
             || quote_literal(v_job_lauf) || ', ''0 5 * * 1-5'', ' || quote_literal(v_cmd_lauf)
             || '); select cron.schedule(' || quote_literal(v_job_fortsetzung) || ', ''20 5 * * 1-5'', ' || quote_literal(v_cmd_lauf)
             || '); Kontrolle: supabase test db (cron_erinnerungen.test.sql muss grün sein).';
  else
    raise notice 'Readyloop: pg_cron nicht verfügbar (kein Supabase-Kontext) – Lauf nur über Vercel Cron/manuell, Pseudonymisierung nur über app.mail_pseudonymisieren().';
  end if;
end;
$do$;

-- =====================================================================
-- Ausführungsrechte: jede neue Funktion gesperrt für public und anon; System-RPCs nur service_role
-- =====================================================================

revoke execute on function app.staffel_gueltig(int[]) from public, anon;
grant execute on function app.staffel_gueltig(int[]) to authenticated, service_role; -- Check-Constraint
revoke execute on function app.rollen_fuer_mailart(text) from public, anon;
grant execute on function app.rollen_fuer_mailart(text) to authenticated, service_role; -- RLS mail_abmeldung
revoke execute on function app.verbiete_loeschen() from public, anon;
revoke execute on function app.erinnerung_einstellung_json(public.erinnerung_einstellung) from public, anon, authenticated;
revoke execute on function app.erinnerung_einstellung_pruefen() from public, anon;
revoke execute on function app.erinnerung_einstellung_ereignis() from public, anon;
revoke execute on function app.mail_abmeldung_pruefen() from public, anon;
revoke execute on function app.erinnerung_posten_pruefen() from public, anon;
revoke execute on function app.mail_versand_pruefen() from public, anon;
revoke execute on function app.erinnerung_lauf_pruefen() from public, anon;
revoke execute on function app.mail_pseudonymisieren() from public, anon, authenticated;
revoke execute on function app.erinnerungen_ausloesen() from public, anon, authenticated;

revoke execute on function public.erinnerung_lauf_starten(date, text, boolean) from public, anon, authenticated;
revoke execute on function public.erinnerung_lauf_beenden(uuid, text) from public, anon, authenticated;
revoke execute on function public.erinnerung_versand_reservieren(jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.erinnerung_versand_status(uuid, text, int, text, text) from public, anon, authenticated;
revoke execute on function public.erinnerung_status_per_anbieter(text, text) from public, anon, authenticated;
revoke execute on function public.mail_abmelden_system(uuid, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.erinnerung_lauf_starten(date, text, boolean), public.erinnerung_lauf_beenden(uuid, text),
  public.erinnerung_versand_reservieren(jsonb, jsonb), public.erinnerung_versand_status(uuid, text, int, text, text),
  public.erinnerung_status_per_anbieter(text, text), public.mail_abmelden_system(uuid, uuid, text, boolean)
  to service_role;

revoke execute on function public.mail_protokoll(uuid, date, date, text, text, uuid, int, int) from public, anon;
grant execute on function public.mail_protokoll(uuid, date, date, text, text, uuid, int, int) to authenticated;
