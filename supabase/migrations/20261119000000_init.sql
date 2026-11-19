-- Readyloop Inkrement 1: Datenmodell, RLS, Trigger, Storage (BE-4)
-- Grundlage: docs/requirements.md §3 (F-1 bis F-7), §5 (Datenmodell), §6 (Rechte-Matrix).
-- Grundsätze:
--   * Jede Tabelle mit Betriebsbezug trägt organisation_id; Zugriff nur über Mitgliedschaft.
--   * RLS auf allen Tabellen. Keine DELETE-Policy. nachweis und ereignis sind append-only.
--   * katalog_eintrag ist global lesbar; schreiben darf nur die Plattform (Service-Role, umgeht RLS).
--   * Ereignisse entstehen ausschließlich per Trigger (security definer).

create extension if not exists pgcrypto;

create schema if not exists app;
grant usage on schema app to authenticated;

-- =====================================================================
-- Tabellen
-- =====================================================================

create table public.organisation (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  bg text,
  angelegt_am timestamptz not null default now()
);

create table public.standort (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  name text not null check (length(trim(name)) > 0),
  unique (id, organisation_id)
);

create table public.bereich (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  standort_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  einsatzort text not null
    check (einsatzort in ('buero', 'werkstatt_fertigung', 'lager_logistik', 'baustelle', 'aussenbereich')),
  unique (id, organisation_id),
  foreign key (standort_id, organisation_id) references public.standort (id, organisation_id)
);

create table public.mitgliedschaft (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  benutzer_id uuid not null references auth.users (id),
  anzeigename text not null check (length(trim(anzeigename)) > 0),
  rolle text not null check (rolle in ('admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter')),
  angelegt_am timestamptz not null default now(),
  unique (organisation_id, benutzer_id),
  unique (id, organisation_id)
);

create table public.bereich_verantwortung (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  mitgliedschaft_id uuid not null,
  bereich_id uuid not null,
  unique (mitgliedschaft_id, bereich_id),
  foreign key (mitgliedschaft_id, organisation_id) references public.mitgliedschaft (id, organisation_id),
  foreign key (bereich_id, organisation_id) references public.bereich (id, organisation_id)
);

-- Global, ohne Betriebsbezug. Schreiben nur per Service-Role (Plattform), siehe Policies.
create table public.katalog_eintrag (
  id uuid primary key default gen_random_uuid(),
  schluessel text not null,
  version integer not null check (version >= 1),
  geraetegruppe text not null,
  geraetegruppe_label text not null,
  pruefart text not null,
  einsatzort text
    check (einsatzort in ('buero', 'werkstatt_fertigung', 'lager_logistik', 'baustelle', 'aussenbereich')),
  intervall_monate integer check (intervall_monate between 1 and 240),
  stufe text not null check (stufe in ('A', 'B', 'C', 'D')),
  fundstelle text not null check (length(trim(fundstelle)) > 0),
  quelle_url text not null check (quelle_url like 'https://%'),
  pruefer_typen text[] not null
    check (
      cardinality(pruefer_typen) > 0
      and pruefer_typen <@ array['zbp', 'sachkundiger', 'efk', 'eup', 'ps', 'zues', 'sachkundiger_din14406', 'benutzer']::text[]
    ),
  hinweis text,
  freigabestatus text not null default 'entwurf' check (freigabestatus in ('entwurf', 'freigegeben', 'zurueckgezogen')),
  freigegeben_von text,
  freigegeben_am date,
  check (freigabestatus <> 'entwurf' or (freigegeben_von is null and freigegeben_am is null)),
  check (freigabestatus <> 'freigegeben' or (freigegeben_von is not null and freigegeben_am is not null))
);
-- (schluessel, einsatzort, version) eindeutig, auch bei einsatzort = null
create unique index katalog_eintrag_schluessel_ort_version
  on public.katalog_eintrag (schluessel, coalesce(einsatzort, ''), version);

create table public.geraet (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  bereich_id uuid not null,
  bezeichnung text not null check (length(trim(bezeichnung)) between 2 and 120),
  inventarnummer text,
  geraetegruppe text not null,
  kategorie text not null check (kategorie in ('personenbezogen', 'ortsgebunden', 'wechselnd')),
  hersteller text,
  typ text,
  seriennummer text,
  baujahr integer check (baujahr between 1950 and 2100),
  einsatzort text
    check (einsatzort in ('buero', 'werkstatt_fertigung', 'lager_logistik', 'baustelle', 'aussenbereich')),
  betriebsstatus text not null default 'in_betrieb'
    check (betriebsstatus in ('in_betrieb', 'ausser_betrieb', 'ausgemustert')),
  angelegt_am timestamptz not null default now(),
  unique (id, organisation_id),
  foreign key (bereich_id, organisation_id) references public.bereich (id, organisation_id)
);
create unique index geraet_inventarnummer on public.geraet (organisation_id, inventarnummer)
  where inventarnummer is not null;

create table public.geraet_pruefart (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  geraet_id uuid not null,
  katalog_schluessel text,
  bezeichnung text not null check (length(trim(bezeichnung)) between 2 and 120),
  herstellerfrist_monate integer check (herstellerfrist_monate between 1 and 120),
  herstellerfrist_quelle text,
  -- Snapshot der freigegebenen Frist (R-04, F-4)
  frist_monate integer check (frist_monate between 1 and 120),
  frist_quelle text check (frist_quelle in ('katalog', 'hersteller', 'gbu')),
  frist_stufe text check (frist_stufe in ('A', 'B', 'C', 'D')),
  frist_fundstelle text,
  frist_quelle_url text,
  frist_katalog_eintrag_id uuid references public.katalog_eintrag (id),
  frist_katalog_version integer,
  frist_begruendung text,
  frist_freigegeben_von uuid references auth.users (id),
  frist_freigegeben_von_name text,
  frist_freigegeben_am timestamptz,
  letzte_pruefung date,
  letzte_pruefung_herkunft text not null default 'unbekannt'
    check (letzte_pruefung_herkunft in ('nachweis', 'pruefbericht', 'plakette', 'unbekannt')),
  zugewiesener_pruefer_id uuid references auth.users (id),
  unique (id, organisation_id),
  unique (id, geraet_id, organisation_id),
  foreign key (geraet_id, organisation_id) references public.geraet (id, organisation_id),
  -- Frist-Spalten: alle leer oder Kernfelder gesetzt
  constraint frist_vollstaendig check (
    (frist_monate is null and frist_quelle is null and frist_stufe is null and frist_fundstelle is null
      and frist_quelle_url is null and frist_katalog_eintrag_id is null and frist_katalog_version is null
      and frist_begruendung is null)
    or (frist_monate is not null and frist_quelle is not null and frist_stufe is not null and frist_fundstelle is not null)
  ),
  constraint frist_gbu_begruendung check (frist_quelle is distinct from 'gbu' or length(trim(coalesce(frist_begruendung, ''))) >= 10),
  constraint letzte_pruefung_herkunft check ((letzte_pruefung is null) = (letzte_pruefung_herkunft = 'unbekannt'))
);

create table public.nachweis (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  geraet_id uuid not null,
  geraet_pruefart_id uuid not null,
  pruefdatum date not null,
  ergebnis text not null check (ergebnis in ('ohne_maengel', 'maengel_weiterbetrieb', 'nicht_bestanden')),
  pruefumfang text not null check (length(trim(pruefumfang)) between 3 and 500),
  pruefer_name text not null check (length(trim(pruefer_name)) between 2 and 120),
  pruefer_benutzer_id uuid references auth.users (id),
  unterschrift_im_pdf boolean not null check (unterschrift_im_pdf),
  pdf_pfad text not null,
  pdf_sha256 text not null check (pdf_sha256 ~ '^[0-9a-f]{64}$'),
  erfasst_von uuid not null default auth.uid() references auth.users (id),
  erfasst_am timestamptz not null default now(),
  foreign key (geraet_pruefart_id, geraet_id, organisation_id)
    references public.geraet_pruefart (id, geraet_id, organisation_id),
  -- Pfad enthält die Prüfart, damit Storage-Policies pro Prüfart greifen (Upload vor dem Nachweis-INSERT).
  check (pdf_pfad = organisation_id::text || '/' || geraet_id::text || '/' || geraet_pruefart_id::text || '/' || id::text || '.pdf')
);

create table public.ereignis (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  geraet_id uuid,
  typ text not null check (typ in ('geraet_angelegt', 'frist_freigegeben', 'nachweis_erfasst')),
  akteur_id uuid references auth.users (id), -- null = System/Service-Role
  akteur_name text not null,
  zeitpunkt timestamptz not null default now(),
  daten jsonb not null default '{}'::jsonb,
  foreign key (geraet_id, organisation_id) references public.geraet (id, organisation_id)
);

create index on public.mitgliedschaft (benutzer_id);
create index on public.bereich_verantwortung (bereich_id);
create index on public.geraet (organisation_id, bereich_id);
create index on public.geraet_pruefart (geraet_id);
create index on public.geraet_pruefart (zugewiesener_pruefer_id);
create index on public.nachweis (geraet_pruefart_id, pruefdatum desc);
create index on public.ereignis (organisation_id, geraet_id, zeitpunkt desc);

-- =====================================================================
-- Hilfsfunktionen (security definer, umgehen RLS gezielt, keine Rekursion)
-- =====================================================================

create or replace function app.ist_mitglied(org uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.mitgliedschaft m
    where m.organisation_id = org and m.benutzer_id = auth.uid()
  );
$$;

create or replace function app.hat_rolle(org uuid, rollen text[])
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.mitgliedschaft m
    where m.organisation_id = org and m.benutzer_id = auth.uid() and m.rolle = any (rollen)
  );
$$;

create or replace function app.verantwortet_bereich(bereich uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from public.bereich_verantwortung bv
    join public.mitgliedschaft m on m.id = bv.mitgliedschaft_id and m.organisation_id = bv.organisation_id
    where bv.bereich_id = bereich and m.benutzer_id = auth.uid() and m.rolle = 'verantwortlicher'
  );
$$;

create or replace function app.verantwortet_geraet(geraet uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.geraet g where g.id = geraet and app.verantwortet_bereich(g.bereich_id)
  );
$$;

create or replace function app.ist_zugewiesen(pruefart uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from public.geraet_pruefart gp
    join public.mitgliedschaft m on m.organisation_id = gp.organisation_id
    where gp.id = pruefart
      and gp.zugewiesener_pruefer_id = auth.uid()
      and m.benutzer_id = auth.uid()
      and m.rolle = 'pruefer'
  );
$$;

create or replace function app.sieht_geraet(geraet uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.geraet g
    where g.id = geraet
      and (
        app.hat_rolle(g.organisation_id, array['admin', 'sifa'])
        or app.verantwortet_bereich(g.bereich_id)
        or exists (
          select 1 from public.geraet_pruefart gp where gp.geraet_id = g.id and app.ist_zugewiesen(gp.id)
        )
      )
  );
$$;

create or replace function app.uuid_oder_null(wert text)
returns uuid language plpgsql immutable set search_path = pg_temp as $$
begin
  return wert::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function app.akteur_name(org uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select m.anzeigename from public.mitgliedschaft m where m.organisation_id = org and m.benutzer_id = auth.uid()),
    'System'
  );
$$;

revoke all on function app.ist_mitglied(uuid), app.hat_rolle(uuid, text[]), app.verantwortet_bereich(uuid),
  app.verantwortet_geraet(uuid), app.ist_zugewiesen(uuid), app.sieht_geraet(uuid), app.akteur_name(uuid)
  from public;
grant execute on function app.ist_mitglied(uuid), app.hat_rolle(uuid, text[]), app.verantwortet_bereich(uuid),
  app.verantwortet_geraet(uuid), app.ist_zugewiesen(uuid), app.sieht_geraet(uuid), app.uuid_oder_null(text)
  to authenticated;

-- =====================================================================
-- Rechte (Grants) – RLS greift zusätzlich
-- =====================================================================

revoke all on public.organisation, public.standort, public.bereich, public.mitgliedschaft,
  public.bereich_verantwortung, public.katalog_eintrag, public.geraet, public.geraet_pruefart,
  public.nachweis, public.ereignis from anon;

revoke insert, update, delete, truncate on public.katalog_eintrag from authenticated;
revoke update, delete, truncate on public.nachweis, public.ereignis from authenticated;
revoke insert on public.ereignis from authenticated;
revoke delete, truncate on public.organisation, public.standort, public.bereich, public.mitgliedschaft,
  public.bereich_verantwortung, public.geraet, public.geraet_pruefart from authenticated;
-- Prüfart: nur Frist-Spalten änderbar; Freigabe-Metadaten setzt der Trigger.
revoke update on public.geraet_pruefart from authenticated;
grant update (frist_monate, frist_quelle, frist_stufe, frist_fundstelle, frist_quelle_url,
  frist_katalog_eintrag_id, frist_katalog_version, frist_begruendung)
  on public.geraet_pruefart to authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.organisation enable row level security;
alter table public.standort enable row level security;
alter table public.bereich enable row level security;
alter table public.mitgliedschaft enable row level security;
alter table public.bereich_verantwortung enable row level security;
alter table public.katalog_eintrag enable row level security;
alter table public.geraet enable row level security;
alter table public.geraet_pruefart enable row level security;
alter table public.nachweis enable row level security;
alter table public.ereignis enable row level security;

-- Stammdaten: lesen für Mitglieder der Organisation. Verwaltung (I2) über Service-Role bzw. spätere Policies.
create policy organisation_select on public.organisation
  for select to authenticated using (app.ist_mitglied(id));

create policy standort_select on public.standort
  for select to authenticated using (app.ist_mitglied(organisation_id));

create policy bereich_select on public.bereich
  for select to authenticated using (app.ist_mitglied(organisation_id));

create policy mitgliedschaft_select on public.mitgliedschaft
  for select to authenticated using (app.ist_mitglied(organisation_id));

create policy bereich_verantwortung_select on public.bereich_verantwortung
  for select to authenticated using (app.ist_mitglied(organisation_id));

-- Katalog: global lesbar, keine Schreib-Policies (nur Plattform/Service-Role).
create policy katalog_eintrag_select on public.katalog_eintrag
  for select to authenticated using (true);

-- Gerät
create policy geraet_select on public.geraet
  for select to authenticated using (app.sieht_geraet(id));

create policy geraet_insert on public.geraet
  for insert to authenticated with check (
    app.hat_rolle(organisation_id, array['admin'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_bereich(bereich_id))
  );

-- Prüfart: Prüfer sehen nur zugewiesene Prüfarten.
create policy geraet_pruefart_select on public.geraet_pruefart
  for select to authenticated using (
    app.hat_rolle(organisation_id, array['admin', 'sifa'])
    or app.verantwortet_geraet(geraet_id)
    or app.ist_zugewiesen(id)
  );

-- Beim Anlegen keine Frist (Freigabe nur per UPDATE, F-4), Ersterfassung nicht in der Zukunft
-- und nie mit Herkunft 'nachweis' (die setzt nur der Nachweis-Trigger).
create policy geraet_pruefart_insert on public.geraet_pruefart
  for insert to authenticated with check (
    (
      app.hat_rolle(organisation_id, array['admin'])
      or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
    )
    and frist_monate is null and frist_quelle is null and frist_stufe is null and frist_fundstelle is null
    and frist_katalog_eintrag_id is null and frist_katalog_version is null and frist_begruendung is null
    and (letzte_pruefung is null or letzte_pruefung <= (now() at time zone 'Europe/Berlin')::date)
    and letzte_pruefung_herkunft <> 'nachweis'
  );

-- Fristfreigabe (frist.freigeben): Sifa ganze Organisation, Verantwortlicher eigener Bereich.
create policy geraet_pruefart_update_frist on public.geraet_pruefart
  for update to authenticated
  using (
    app.hat_rolle(organisation_id, array['sifa'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  )
  with check (
    app.hat_rolle(organisation_id, array['sifa'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  );

-- Nachweis: append-only (nur SELECT und INSERT).
create policy nachweis_select on public.nachweis
  for select to authenticated using (
    app.hat_rolle(organisation_id, array['admin', 'sifa'])
    or app.verantwortet_geraet(geraet_id)
    or app.ist_zugewiesen(geraet_pruefart_id)
  );

create policy nachweis_insert on public.nachweis
  for insert to authenticated with check (
    erfasst_von = auth.uid()
    and (pruefer_benutzer_id is null or pruefer_benutzer_id = auth.uid())
    and (
      (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
      or app.ist_zugewiesen(geraet_pruefart_id)
    )
  );

-- Ereignis: nur lesen (verlauf.lesen); Einträge entstehen ausschließlich per Trigger.
create policy ereignis_select on public.ereignis
  for select to authenticated using (
    app.hat_rolle(organisation_id, array['admin', 'sifa'])
    or (geraet_id is not null and app.verantwortet_geraet(geraet_id))
  );

-- =====================================================================
-- Trigger
-- =====================================================================

-- Append-only auch gegenüber Service-Role absichern.
create or replace function app.verbiete_aenderung()
returns trigger language plpgsql set search_path = pg_temp as $$
begin
  raise exception '% ist append-only: % nicht erlaubt', tg_table_name, tg_op using errcode = '42501';
end;
$$;

create trigger nachweis_append_only before update or delete on public.nachweis
  for each row execute function app.verbiete_aenderung();
create trigger ereignis_append_only before update or delete on public.ereignis
  for each row execute function app.verbiete_aenderung();

-- Gerät angelegt → Ereignis
create or replace function app.geraet_angelegt()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
  values (new.organisation_id, new.id, 'geraet_angelegt', auth.uid(), app.akteur_name(new.organisation_id),
          jsonb_build_object('bezeichnung', new.bezeichnung, 'bereichId', new.bereich_id));
  return new;
end;
$$;

create trigger geraet_angelegt after insert on public.geraet
  for each row execute function app.geraet_angelegt();

-- Frist-Snapshot als JSON (Form wie FestgelegteFrist im TypeScript-Vertrag)
create or replace function app.frist_json(gp public.geraet_pruefart)
returns jsonb language sql immutable set search_path = public, pg_temp as $$
  select case when gp.frist_monate is null then null else jsonb_build_object(
    'monate', gp.frist_monate,
    'quelle', gp.frist_quelle,
    'stufe', gp.frist_stufe,
    'fundstelle', gp.frist_fundstelle,
    'quelleUrl', gp.frist_quelle_url,
    'katalogEintragId', gp.frist_katalog_eintrag_id,
    'katalogVersion', gp.frist_katalog_version,
    'begruendung', gp.frist_begruendung,
    'freigegebenVon', gp.frist_freigegeben_von,
    'freigegebenVonName', gp.frist_freigegeben_von_name,
    'freigegebenAm', gp.frist_freigegeben_am
  ) end;
$$;

-- F-2 wie waehleKatalogEintrag (src/domain/fristen.ts): freigegeben, gleicher Schlüssel; je Einsatzort-Gruppe
-- höchste Version; exakter Einsatzort schlägt einsatzort = null; bei mehreren das kürzeste Intervall.
-- Kein Treffer: Zeile mit id = null.
create or replace function app.katalog_wahl(p_schluessel text, p_ort text)
returns public.katalog_eintrag language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  e public.katalog_eintrag;
begin
  select k.* into e from public.katalog_eintrag k
  where k.schluessel = p_schluessel and k.freigabestatus = 'freigegeben' and k.einsatzort = p_ort
    and k.version = (select max(x.version) from public.katalog_eintrag x
                     where x.schluessel = p_schluessel and x.freigabestatus = 'freigegeben' and x.einsatzort = p_ort)
  order by k.intervall_monate asc nulls last, k.stufe asc, k.id
  limit 1;
  if found then
    return e;
  end if;
  select k.* into e from public.katalog_eintrag k
  where k.schluessel = p_schluessel and k.freigabestatus = 'freigegeben' and k.einsatzort is null
    and k.version = (select max(x.version) from public.katalog_eintrag x
                     where x.schluessel = p_schluessel and x.freigabestatus = 'freigegeben' and x.einsatzort is null)
  order by k.intervall_monate asc nulls last, k.stufe asc, k.id
  limit 1;
  return e;
end;
$$;

revoke all on function app.katalog_wahl(text, text) from public;

-- Fristfreigabe: Metadaten stempeln und Regeln F-4 serverseitig absichern.
create or replace function app.frist_stempeln()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  ort text;
  wahl public.katalog_eintrag;
begin
  if tg_op = 'UPDATE'
     and new.frist_monate is not distinct from old.frist_monate
     and new.frist_quelle is not distinct from old.frist_quelle
     and new.frist_stufe is not distinct from old.frist_stufe
     and new.frist_fundstelle is not distinct from old.frist_fundstelle
     and new.frist_quelle_url is not distinct from old.frist_quelle_url
     and new.frist_katalog_eintrag_id is not distinct from old.frist_katalog_eintrag_id
     and new.frist_katalog_version is not distinct from old.frist_katalog_version
     and new.frist_begruendung is not distinct from old.frist_begruendung then
    -- Keine Friständerung: Freigabe-Metadaten unverändert lassen.
    new.frist_freigegeben_von := old.frist_freigegeben_von;
    new.frist_freigegeben_von_name := old.frist_freigegeben_von_name;
    new.frist_freigegeben_am := old.frist_freigegeben_am;
    return new;
  end if;

  if new.frist_monate is null then
    if tg_op = 'UPDATE' and old.frist_monate is not null then
      raise exception 'Eine freigegebene Frist kann nicht entfernt, nur neu festgelegt werden' using errcode = '23514';
    end if;
    new.frist_freigegeben_von := null;
    new.frist_freigegeben_von_name := null;
    new.frist_freigegeben_am := null;
    return new;
  end if;

  select coalesce(g.einsatzort, b.einsatzort) into ort
  from public.geraet g join public.bereich b on b.id = g.bereich_id
  where g.id = new.geraet_id;
  if new.katalog_schluessel is not null then
    wahl := app.katalog_wahl(new.katalog_schluessel, ort);
  end if;

  if new.frist_quelle = 'gbu' then
    new.frist_stufe := 'C';
    -- (b) Herstellerfrist nicht überschreiten
    if new.herstellerfrist_monate is not null and new.frist_monate > new.herstellerfrist_monate then
      raise exception 'GBU-Frist überschreitet die Herstellerfrist' using errcode = '23514';
    end if;
    -- (a) Stufe-A-Höchstfrist des nach F-2 gewählten Eintrags nicht überschreiten
    if wahl.id is not null and wahl.stufe = 'A' and wahl.intervall_monate is not null
       and new.frist_monate > wahl.intervall_monate then
      raise exception 'GBU-Frist überschreitet die Höchstfrist (Stufe A)' using errcode = '23514';
    end if;
  elsif new.frist_quelle = 'katalog' then
    -- Nur der nach F-2 gewählte freigegebene Eintrag zur eigenen Prüfart, unverändert übernommen.
    if wahl.id is null
       or wahl.id is distinct from new.frist_katalog_eintrag_id
       or wahl.version is distinct from new.frist_katalog_version
       or wahl.intervall_monate is null
       or wahl.intervall_monate is distinct from new.frist_monate
       or wahl.stufe is distinct from new.frist_stufe then
      raise exception 'Katalogfrist nur aus dem freigegebenen Katalogeintrag der Prüfart' using errcode = '23514';
    end if;
    -- F-3: kürzere Herstellerfrist hat Vorrang
    if new.herstellerfrist_monate is not null and new.herstellerfrist_monate < wahl.intervall_monate then
      raise exception 'Kürzere Herstellerfrist hat Vorrang vor der Katalogfrist' using errcode = '23514';
    end if;
  elsif new.frist_quelle = 'hersteller' then
    new.frist_stufe := 'C';
    if new.herstellerfrist_monate is distinct from new.frist_monate then
      raise exception 'Herstellerfrist weicht von der hinterlegten Herstellerangabe ab' using errcode = '23514';
    end if;
  end if;

  new.frist_freigegeben_von := auth.uid();
  new.frist_freigegeben_von_name := app.akteur_name(new.organisation_id);
  new.frist_freigegeben_am := now();
  return new;
end;
$$;

create trigger geraet_pruefart_frist_stempeln before insert or update on public.geraet_pruefart
  for each row execute function app.frist_stempeln();

create or replace function app.frist_ereignis()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.frist_monate is not null
     and (tg_op = 'INSERT' or new.frist_freigegeben_am is distinct from old.frist_freigegeben_am) then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.geraet_id, 'frist_freigegeben', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object(
              'pruefartId', new.id,
              'pruefart', new.bezeichnung,
              'alt', case when tg_op = 'UPDATE' then app.frist_json(old) else null end,
              'neu', app.frist_json(new)
            ));
  end if;
  return new;
end;
$$;

create trigger geraet_pruefart_frist_ereignis after insert or update on public.geraet_pruefart
  for each row execute function app.frist_ereignis();

-- Nachweis: Prüfdatum ≤ heute (Europe/Berlin), Erfasser stempeln (F-7)
create or replace function app.nachweis_pruefen()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.pruefdatum > (now() at time zone 'Europe/Berlin')::date then
    raise exception 'Prüfdatum liegt in der Zukunft' using errcode = '23514';
  end if;
  new.erfasst_von := coalesce(auth.uid(), new.erfasst_von);
  new.erfasst_am := now();
  return new;
end;
$$;

create trigger nachweis_pruefen before insert on public.nachweis
  for each row execute function app.nachweis_pruefen();

-- Nachweis erfasst → Ereignis und letzte Prüfung fortschreiben (F-7)
create or replace function app.nachweis_erfasst()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
  values (new.organisation_id, new.geraet_id, 'nachweis_erfasst', auth.uid(), app.akteur_name(new.organisation_id),
          jsonb_build_object('nachweisId', new.id, 'pruefartId', new.geraet_pruefart_id,
                             'pruefdatum', new.pruefdatum, 'ergebnis', new.ergebnis, 'prueferName', new.pruefer_name));

  if new.ergebnis in ('ohne_maengel', 'maengel_weiterbetrieb') then
    update public.geraet_pruefart gp
    set letzte_pruefung = new.pruefdatum, letzte_pruefung_herkunft = 'nachweis'
    where gp.id = new.geraet_pruefart_id
      and (gp.letzte_pruefung is null or gp.letzte_pruefung < new.pruefdatum);
  end if;
  return new;
end;
$$;

create trigger nachweis_erfasst after insert on public.nachweis
  for each row execute function app.nachweis_erfasst();

-- =====================================================================
-- Storage: privater Bucket für Nachweis-PDFs
-- Pfad: {organisation_id}/{geraet_id}/{nachweis_id}.pdf
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nachweise', 'nachweise', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Pfad: {organisation_id}/{geraet_id}/{geraet_pruefart_id}/{nachweis_id}.pdf
-- Lesen nur über die Nachweis-Zeile mit derselben Sichtlogik wie nachweis_select (pro Prüfart).
create policy nachweise_select on storage.objects
  for select to authenticated using (
    bucket_id = 'nachweise'
    and exists (
      select 1 from public.nachweis n
      where n.pdf_pfad = objects.name
        and (
          app.hat_rolle(n.organisation_id, array['admin', 'sifa'])
          or app.verantwortet_geraet(n.geraet_id)
          or app.ist_zugewiesen(n.geraet_pruefart_id)
        )
    )
  );

-- Hochladen (vor dem Nachweis-INSERT) nur in den Ordner einer Prüfart, die der Nutzer erfassen darf
-- (gleiche Rechte wie nachweis_insert), Dateiname = UUID.pdf.
create policy nachweise_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'nachweise'
    and objects.name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$'
    and exists (
      select 1 from public.geraet_pruefart gp
      where gp.id = app.uuid_oder_null((storage.foldername(objects.name))[3])
        and gp.geraet_id = app.uuid_oder_null((storage.foldername(objects.name))[2])
        and gp.organisation_id = app.uuid_oder_null((storage.foldername(objects.name))[1])
        and (
          (app.hat_rolle(gp.organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(gp.geraet_id))
          or app.ist_zugewiesen(gp.id)
        )
    )
  );
-- Keine UPDATE-/DELETE-Policies auf storage.objects für den Bucket: Nachweis-PDFs sind unveränderlich.
