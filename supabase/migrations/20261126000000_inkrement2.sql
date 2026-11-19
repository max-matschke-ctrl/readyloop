-- Readyloop Inkrement 2: Verwaltung, Prüfer-Zuweisung, GBU-Verweis, Betriebsstatus, Verschieben, Anlass, Mängel (BE-9)
-- Grundlage: docs/requirements.md §3a (F-8 bis F-19), §5, §6; docs/backlog.md §4 BE-9.
-- Grundsätze wie I1:
--   * organisation_id auf jeder Tabelle mit Betriebsbezug; Zugriff nur über AKTIVE Mitgliedschaft.
--   * RLS auf allen Tabellen. Einzige DELETE-Policy: bereich_verantwortung (nur admin, Q-19).
--   * nachweis und ereignis bleiben append-only; anlass und mangel ohne DELETE, Änderungen nur per Trigger-Regeln.
--   * Ereignisse entstehen ausschließlich per Trigger (security definer). Zusatzdaten (Begründung, nachweisId,
--     eingeladen) kommen über set_config('readyloop.kontext', …, true) aus den RPCs.
--   * RPCs sind security invoker: RLS greift, mehrere Schreibvorgänge laufen in einer Transaktion.

-- =====================================================================
-- Hilfsfunktionen
-- =====================================================================

create or replace function app.heute()
returns date language sql stable set search_path = pg_temp as $$
  select (now() at time zone 'Europe/Berlin')::date;
$$;

create or replace function app.kontext()
returns jsonb language sql stable set search_path = pg_temp as $$
  select coalesce(nullif(current_setting('readyloop.kontext', true), '')::jsonb, '{}'::jsonb);
$$;

grant execute on function app.heute(), app.kontext() to authenticated;

-- =====================================================================
-- mitgliedschaft: E-Mail, aktiv, Prüfertypen (R-10, F-17)
-- =====================================================================

alter table public.mitgliedschaft
  add column email text not null default '',
  add column aktiv boolean not null default true,
  add column pruefer_typen text[] not null default '{}'
    check (pruefer_typen <@ array['zbp', 'sachkundiger', 'efk', 'eup', 'ps', 'zues', 'sachkundiger_din14406', 'benutzer']::text[]);

-- Nur aktive Mitgliedschaften zählen (requirements §6).
create or replace function app.ist_mitglied(org uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.mitgliedschaft m
    where m.organisation_id = org and m.benutzer_id = auth.uid() and m.aktiv
  );
$$;

create or replace function app.hat_rolle(org uuid, rollen text[])
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.mitgliedschaft m
    where m.organisation_id = org and m.benutzer_id = auth.uid() and m.rolle = any (rollen) and m.aktiv
  );
$$;

create or replace function app.verantwortet_bereich(bereich uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
    from public.bereich_verantwortung bv
    join public.mitgliedschaft m on m.id = bv.mitgliedschaft_id and m.organisation_id = bv.organisation_id
    where bv.bereich_id = bereich and m.benutzer_id = auth.uid() and m.rolle = 'verantwortlicher' and m.aktiv
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
      and m.aktiv
  );
$$;

-- Anzeigename eines Benutzers in der Organisation (für Ereignisdaten).
create or replace function app.mitglied_name(org uuid, benutzer uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select m.anzeigename from public.mitgliedschaft m where m.organisation_id = org and m.benutzer_id = benutzer;
$$;

-- Aktives Mitglied mit einer der Rollen (für Zuweisungen/Verantwortliche).
create or replace function app.aktives_mitglied_mit_rolle(org uuid, benutzer uuid, rollen text[])
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.mitgliedschaft m
    where m.organisation_id = org and m.benutzer_id = benutzer and m.rolle = any (rollen) and m.aktiv
  );
$$;

revoke all on function app.mitglied_name(uuid, uuid), app.aktives_mitglied_mit_rolle(uuid, uuid, text[]) from public;

-- =====================================================================
-- geraet_pruefart: GBU-Verweis (R-11, F-18), Prüfer-Zuweisung (F-15)
-- =====================================================================

alter table public.geraet_pruefart
  add column gbu_dokument_titel text check (gbu_dokument_titel is null or length(trim(gbu_dokument_titel)) between 1 and 200),
  add column gbu_dokument_url text check (gbu_dokument_url is null or gbu_dokument_url like 'https://%'),
  add constraint gbu_dokument_url_nur_mit_titel check (gbu_dokument_url is null or gbu_dokument_titel is not null);

grant update (zugewiesener_pruefer_id, gbu_dokument_titel, gbu_dokument_url) on public.geraet_pruefart to authenticated;

-- Admin darf (Prüfer-Zuweisung) in der ganzen Organisation ändern; welche Spalten, regelt app.pruefart_spaltenrechte.
create policy geraet_pruefart_update_admin on public.geraet_pruefart
  for update to authenticated
  using (app.hat_rolle(organisation_id, array['admin']))
  with check (app.hat_rolle(organisation_id, array['admin']));

-- Spaltenrechte je Rolle (Policies sind zeilenbezogen, deshalb Trigger):
--   Frist- und GBU-Spalten: sifa oder Verantwortlicher (Bereich) – frist.freigeben.
--   zugewiesener_pruefer_id: admin oder Verantwortlicher (Bereich) – pruefer.zuweisen; Ziel aktives Prüfer-Mitglied oder null.
-- Ohne auth.uid() (Plattform/Service-Role, Migration) keine Prüfung.
create or replace function app.pruefart_spaltenrechte()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  darf_frist boolean;
  darf_zuweisen boolean;
begin
  if auth.uid() is null then
    return new;
  end if;
  darf_frist := app.hat_rolle(new.organisation_id, array['sifa'])
    or (app.hat_rolle(new.organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(new.geraet_id));
  darf_zuweisen := app.hat_rolle(new.organisation_id, array['admin'])
    or (app.hat_rolle(new.organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(new.geraet_id));

  if tg_op = 'INSERT' then
    if new.gbu_dokument_titel is not null or new.gbu_dokument_url is not null then
      raise exception 'GBU-Verweis wird nach dem Anlegen gesetzt' using errcode = '42501';
    end if;
    if new.zugewiesener_pruefer_id is not null and not darf_zuweisen then
      raise exception 'Keine Berechtigung, Prüfer zuzuweisen' using errcode = '42501';
    end if;
  else
    if (new.frist_monate, new.frist_quelle, new.frist_stufe, new.frist_fundstelle, new.frist_quelle_url,
        new.frist_katalog_eintrag_id, new.frist_katalog_version, new.frist_begruendung)
       is distinct from
       (old.frist_monate, old.frist_quelle, old.frist_stufe, old.frist_fundstelle, old.frist_quelle_url,
        old.frist_katalog_eintrag_id, old.frist_katalog_version, old.frist_begruendung)
       and not darf_frist then
      raise exception 'Keine Berechtigung, Fristen freizugeben' using errcode = '42501';
    end if;
    if (new.gbu_dokument_titel, new.gbu_dokument_url) is distinct from (old.gbu_dokument_titel, old.gbu_dokument_url)
       and not darf_frist then
      raise exception 'Keine Berechtigung, den GBU-Verweis zu ändern' using errcode = '42501';
    end if;
    if new.zugewiesener_pruefer_id is distinct from old.zugewiesener_pruefer_id and not darf_zuweisen then
      raise exception 'Keine Berechtigung, Prüfer zuzuweisen' using errcode = '42501';
    end if;
  end if;

  if new.zugewiesener_pruefer_id is not null
     and (tg_op = 'INSERT' or new.zugewiesener_pruefer_id is distinct from old.zugewiesener_pruefer_id)
     and not app.aktives_mitglied_mit_rolle(new.organisation_id, new.zugewiesener_pruefer_id, array['pruefer']) then
    raise exception 'Zuweisung nur an aktive Prüfer der Organisation' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger geraet_pruefart_spaltenrechte before insert or update on public.geraet_pruefart
  for each row execute function app.pruefart_spaltenrechte();

-- F-13: Ereignis frist_freigegeben zusätzlich mit nachweisId (aus Kontext) und richtung.
create or replace function app.frist_ereignis()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  alt_monate integer := case when tg_op = 'UPDATE' then old.frist_monate else null end;
begin
  if new.frist_monate is not null
     and (tg_op = 'INSERT' or new.frist_freigegeben_am is distinct from old.frist_freigegeben_am) then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.geraet_id, 'frist_freigegeben', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object(
              'pruefartId', new.id,
              'pruefart', new.bezeichnung,
              'alt', case when tg_op = 'UPDATE' then app.frist_json(old) else null end,
              'neu', app.frist_json(new),
              'nachweisId', app.kontext() -> 'nachweisId',
              'richtung', case
                when alt_monate is null then 'erstmalig'
                when new.frist_monate < alt_monate then 'kuerzer'
                when new.frist_monate > alt_monate then 'laenger'
                else 'gleich' end
            ));
  end if;
  return new;
end;
$$;

-- Prüfer-Zuweisung und GBU-Verweis → Ereignisse (F-19)
create or replace function app.pruefart_ereignisse()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.zugewiesener_pruefer_id is distinct from old.zugewiesener_pruefer_id then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.geraet_id, 'pruefer_zugewiesen', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object(
              'pruefartId', new.id,
              'pruefart', new.bezeichnung,
              'alt', old.zugewiesener_pruefer_id,
              'neu', new.zugewiesener_pruefer_id,
              'neuName', app.mitglied_name(new.organisation_id, new.zugewiesener_pruefer_id)
            ));
  end if;
  if (new.gbu_dokument_titel, new.gbu_dokument_url) is distinct from (old.gbu_dokument_titel, old.gbu_dokument_url) then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.geraet_id, 'gbu_dokument_gesetzt', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object(
              'pruefartId', new.id,
              'pruefart', new.bezeichnung,
              'alt', case when old.gbu_dokument_titel is null then null
                     else jsonb_build_object('titel', old.gbu_dokument_titel, 'url', old.gbu_dokument_url) end,
              'neu', case when new.gbu_dokument_titel is null then null
                     else jsonb_build_object('titel', new.gbu_dokument_titel, 'url', new.gbu_dokument_url) end
            ));
  end if;
  return new;
end;
$$;

create trigger geraet_pruefart_ereignisse after update on public.geraet_pruefart
  for each row execute function app.pruefart_ereignisse();

-- =====================================================================
-- geraet: Verschieben (F-16), Betriebsstatus (F-11)
-- =====================================================================

revoke update on public.geraet from authenticated;
grant update (bereich_id, betriebsstatus) on public.geraet to authenticated;

-- USING prüft den alten Bereich, WITH CHECK den neuen (VER: Quelle und Ziel eigene Bereiche).
create policy geraet_update on public.geraet
  for update to authenticated
  using (
    app.hat_rolle(organisation_id, array['admin'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_bereich(bereich_id))
  )
  with check (
    app.hat_rolle(organisation_id, array['admin'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_bereich(bereich_id))
  );

create or replace function app.geraet_aenderung()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.betriebsstatus = 'ausgemustert' and old.betriebsstatus is distinct from 'ausgemustert' then
    raise exception 'Ausmustern ist erst mit Inkrement 4 möglich' using errcode = '23514';
  end if;
  if (new.id, new.organisation_id, new.bezeichnung, new.inventarnummer, new.geraetegruppe, new.kategorie, new.hersteller,
      new.typ, new.seriennummer, new.baujahr, new.einsatzort, new.angelegt_am)
     is distinct from
     (old.id, old.organisation_id, old.bezeichnung, old.inventarnummer, old.geraetegruppe, old.kategorie, old.hersteller,
      old.typ, old.seriennummer, old.baujahr, old.einsatzort, old.angelegt_am)
     and auth.uid() is not null then
    raise exception 'Nur Bereich und Betriebsstatus sind änderbar' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger geraet_aenderung before update on public.geraet
  for each row execute function app.geraet_aenderung();

create or replace function app.geraet_ereignisse()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  k jsonb := app.kontext();
begin
  if new.bereich_id is distinct from old.bereich_id then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.id, 'geraet_verschoben', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object(
              'vonBereichId', old.bereich_id,
              'vonBereich', (select b.name from public.bereich b where b.id = old.bereich_id),
              'nachBereichId', new.bereich_id,
              'nachBereich', (select b.name from public.bereich b where b.id = new.bereich_id),
              'begruendung', k -> 'begruendung'
            ));
  end if;
  if new.betriebsstatus is distinct from old.betriebsstatus then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.id, 'betriebsstatus_geaendert', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object('alt', old.betriebsstatus, 'neu', new.betriebsstatus, 'begruendung', k -> 'begruendung'));
  end if;
  return new;
end;
$$;

create trigger geraet_ereignisse after update on public.geraet
  for each row execute function app.geraet_ereignisse();

-- =====================================================================
-- nachweis: Dateiname, Frist-Empfehlung (F-13)
-- =====================================================================

alter table public.nachweis
  add column pdf_dateiname text not null default 'nachweis.pdf' check (length(trim(pdf_dateiname)) between 1 and 200),
  add column frist_empfehlung_monate integer check (frist_empfehlung_monate between 1 and 120),
  add constraint nachweis_bezug unique (id, geraet_pruefart_id, geraet_id, organisation_id);

-- =====================================================================
-- anlass (R-07, F-10)
-- =====================================================================

create table public.anlass (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  geraet_id uuid not null,
  geraet_pruefart_id uuid not null,
  art text not null check (art in ('inbetriebnahme', 'aenderung_instandsetzung', 'unfall_schadensfall',
    'laengere_nichtbenutzung', 'naturereignis', 'sonstiges')),
  datum date not null,
  beschreibung text not null check (length(trim(beschreibung)) between 5 and 1000),
  erfasst_von uuid not null default auth.uid() references auth.users (id),
  erfasst_von_name text not null default '',
  erfasst_am timestamptz not null default now(),
  aufgehoben_von uuid references auth.users (id),
  aufgehoben_von_name text,
  aufgehoben_am timestamptz,
  aufhebungsgrund text check (aufhebungsgrund is null or length(trim(aufhebungsgrund)) between 10 and 500),
  foreign key (geraet_pruefart_id, geraet_id, organisation_id)
    references public.geraet_pruefart (id, geraet_id, organisation_id),
  constraint anlass_aufhebung_vollstaendig check (
    (aufgehoben_am is null and aufhebungsgrund is null and aufgehoben_von is null)
    or (aufgehoben_am is not null and aufhebungsgrund is not null)
  )
);

create index on public.anlass (organisation_id, geraet_id);
create index on public.anlass (geraet_pruefart_id);

alter table public.anlass enable row level security;

revoke all on public.anlass from anon;
revoke update, delete, truncate on public.anlass from authenticated;
grant select, insert on public.anlass to authenticated;
grant update (aufhebungsgrund, aufgehoben_von, aufgehoben_von_name, aufgehoben_am) on public.anlass to authenticated;

create policy anlass_select on public.anlass
  for select to authenticated using (
    app.hat_rolle(organisation_id, array['admin', 'sifa'])
    or app.verantwortet_geraet(geraet_id)
    or app.ist_zugewiesen(geraet_pruefart_id)
  );

-- anlass.erfassen: sifa ganze Organisation, Verantwortlicher eigener Bereich.
create policy anlass_insert on public.anlass
  for insert to authenticated with check (
    app.hat_rolle(organisation_id, array['sifa'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  );

create policy anlass_update on public.anlass
  for update to authenticated
  using (
    app.hat_rolle(organisation_id, array['sifa'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  )
  with check (
    app.hat_rolle(organisation_id, array['sifa'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  );

create or replace function app.anlass_pruefen()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if new.datum > app.heute() then
      raise exception 'Anlassdatum liegt in der Zukunft' using errcode = '23514';
    end if;
    if new.aufgehoben_am is not null or new.aufhebungsgrund is not null or new.aufgehoben_von is not null then
      raise exception 'Ein Anlass wird offen erfasst' using errcode = '23514';
    end if;
    new.erfasst_von := coalesce(auth.uid(), new.erfasst_von);
    new.erfasst_von_name := app.akteur_name(new.organisation_id);
    new.erfasst_am := now();
    return new;
  end if;

  -- UPDATE: nur einmaliges Aufheben mit Begründung (Q-25); alles andere unveränderlich.
  if old.aufgehoben_am is not null then
    raise exception 'Anlass ist bereits aufgehoben' using errcode = '23514';
  end if;
  if (new.id, new.organisation_id, new.geraet_id, new.geraet_pruefart_id, new.art, new.datum, new.beschreibung,
      new.erfasst_von, new.erfasst_von_name, new.erfasst_am)
     is distinct from
     (old.id, old.organisation_id, old.geraet_id, old.geraet_pruefart_id, old.art, old.datum, old.beschreibung,
      old.erfasst_von, old.erfasst_von_name, old.erfasst_am) then
    raise exception 'Anlässe sind unveränderlich' using errcode = '42501';
  end if;
  if new.aufhebungsgrund is null or length(trim(new.aufhebungsgrund)) < 10 then
    raise exception 'Aufheben verlangt eine Begründung (mindestens 10 Zeichen)' using errcode = '23514';
  end if;
  new.aufgehoben_von := auth.uid();
  new.aufgehoben_von_name := app.akteur_name(new.organisation_id);
  new.aufgehoben_am := now();
  return new;
end;
$$;

create trigger anlass_pruefen before insert or update on public.anlass
  for each row execute function app.anlass_pruefen();

create or replace function app.anlass_ereignis()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.geraet_id, 'anlass_erfasst', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object(
              'anlassId', new.id,
              'pruefartId', new.geraet_pruefart_id,
              'pruefart', (select gp.bezeichnung from public.geraet_pruefart gp where gp.id = new.geraet_pruefart_id),
              'art', new.art,
              'datum', new.datum
            ));
  elsif new.aufgehoben_am is not null and old.aufgehoben_am is null then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.geraet_id, 'anlass_aufgehoben', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object('anlassId', new.id, 'pruefartId', new.geraet_pruefart_id, 'grund', new.aufhebungsgrund));
  end if;
  return new;
end;
$$;

create trigger anlass_ereignis after insert or update on public.anlass
  for each row execute function app.anlass_ereignis();

-- =====================================================================
-- mangel (R-12, F-14)
-- =====================================================================

create table public.mangel (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  geraet_id uuid not null,
  geraet_pruefart_id uuid,
  nachweis_id uuid,
  beschreibung text not null check (length(trim(beschreibung)) between 5 and 1000),
  schwere text not null check (schwere in ('gefaehrlich', 'erheblich', 'gering')),
  termin date not null,
  status text not null default 'offen' check (status in ('offen', 'in_bearbeitung', 'behoben')),
  verantwortlich_id uuid references auth.users (id),
  erfasst_von uuid not null default auth.uid() references auth.users (id),
  erfasst_von_name text not null default '',
  erfasst_am timestamptz not null default now(),
  kenntnis_von uuid references auth.users (id),
  kenntnis_von_name text,
  kenntnis_am timestamptz,
  behoben_am date,
  behoben_durch text check (behoben_durch is null or length(trim(behoben_durch)) between 2 and 120),
  behebung text check (behebung is null or length(trim(behebung)) between 5 and 1000),
  behebung_erfasst_von uuid references auth.users (id),
  behebung_erfasst_von_name text,
  behebung_erfasst_am timestamptz,
  foreign key (geraet_id, organisation_id) references public.geraet (id, organisation_id),
  -- MATCH SIMPLE: greift nur, wenn geraet_pruefart_id bzw. nachweis_id gesetzt sind.
  foreign key (geraet_pruefart_id, geraet_id, organisation_id)
    references public.geraet_pruefart (id, geraet_id, organisation_id),
  foreign key (nachweis_id, geraet_pruefart_id, geraet_id, organisation_id)
    references public.nachweis (id, geraet_pruefart_id, geraet_id, organisation_id),
  constraint mangel_nachweis_mit_pruefart check (nachweis_id is null or geraet_pruefart_id is not null),
  constraint mangel_status_felder check (
    (status = 'offen' and kenntnis_am is null and behoben_am is null and behebung_erfasst_am is null)
    or (status = 'in_bearbeitung' and kenntnis_am is not null and verantwortlich_id is not null
        and behoben_am is null and behebung_erfasst_am is null)
    or (status = 'behoben' and behoben_am is not null and behoben_durch is not null and behebung is not null
        and behebung_erfasst_am is not null)
  )
);

create index on public.mangel (organisation_id, status);
create index on public.mangel (geraet_id);
create index on public.mangel (geraet_pruefart_id);
create index on public.mangel (nachweis_id);

alter table public.mangel enable row level security;

revoke all on public.mangel from anon;
revoke update, delete, truncate on public.mangel from authenticated;
grant select, insert on public.mangel to authenticated;
grant update (status, verantwortlich_id, termin, kenntnis_von, kenntnis_von_name, kenntnis_am, behoben_am,
  behoben_durch, behebung, behebung_erfasst_von, behebung_erfasst_von_name, behebung_erfasst_am)
  on public.mangel to authenticated;

-- mangel.lesen: admin/sifa, Verantwortlicher (Bereich), Prüfer nur Mängel zugewiesener Prüfarten.
create policy mangel_select on public.mangel
  for select to authenticated using (
    app.hat_rolle(organisation_id, array['admin', 'sifa'])
    or app.verantwortet_geraet(geraet_id)
    or (geraet_pruefart_id is not null and app.ist_zugewiesen(geraet_pruefart_id))
  );

-- mangel.erfassen: sifa, Verantwortlicher (Bereich), Prüfer nur an zugewiesener Prüfart und ohne Verantwortlichen.
create policy mangel_insert on public.mangel
  for insert to authenticated with check (
    app.hat_rolle(organisation_id, array['sifa'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
    or (geraet_pruefart_id is not null and app.ist_zugewiesen(geraet_pruefart_id) and verantwortlich_id is null)
  );

-- mangel.bearbeiten: admin, sifa, Verantwortlicher (Bereich).
create policy mangel_update on public.mangel
  for update to authenticated
  using (
    app.hat_rolle(organisation_id, array['admin', 'sifa'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  )
  with check (
    app.hat_rolle(organisation_id, array['admin', 'sifa'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  );

create or replace function app.mangel_pruefen()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.verantwortlich_id is not null
     and (tg_op = 'INSERT' or new.verantwortlich_id is distinct from old.verantwortlich_id)
     and not app.aktives_mitglied_mit_rolle(new.organisation_id, new.verantwortlich_id,
                                            array['admin', 'sifa', 'verantwortlicher']) then
    raise exception 'Verantwortlich nur aktive Mitglieder mit Rolle Admin, Sifa oder Verantwortlicher'
      using errcode = '23514';
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'offen' or new.kenntnis_am is not null or new.behoben_am is not null
       or new.behebung_erfasst_am is not null then
      raise exception 'Ein Mangel wird offen erfasst' using errcode = '23514';
    end if;
    if new.termin < app.heute() then
      raise exception 'Termin liegt in der Vergangenheit' using errcode = '23514';
    end if;
    new.erfasst_von := coalesce(auth.uid(), new.erfasst_von);
    new.erfasst_von_name := app.akteur_name(new.organisation_id);
    new.erfasst_am := now();
    return new;
  end if;

  -- UPDATE: nur Übergänge F-14; Beschreibung, Schwere, Bezug und Erfassung unveränderlich.
  if (new.id, new.organisation_id, new.geraet_id, new.geraet_pruefart_id, new.nachweis_id, new.beschreibung,
      new.schwere, new.erfasst_von, new.erfasst_von_name, new.erfasst_am)
     is distinct from
     (old.id, old.organisation_id, old.geraet_id, old.geraet_pruefart_id, old.nachweis_id, old.beschreibung,
      old.schwere, old.erfasst_von, old.erfasst_von_name, old.erfasst_am) then
    raise exception 'Beschreibung, Schwere und Bezug eines Mangels sind unveränderlich' using errcode = '42501';
  end if;

  if old.status = 'offen' and new.status = 'in_bearbeitung' then
    if new.verantwortlich_id is null then
      raise exception 'Kenntnisnahme verlangt einen Verantwortlichen' using errcode = '23514';
    end if;
    if new.termin < app.heute() then
      raise exception 'Termin liegt in der Vergangenheit' using errcode = '23514';
    end if;
    new.kenntnis_von := auth.uid();
    new.kenntnis_von_name := app.akteur_name(new.organisation_id);
    new.kenntnis_am := now();
    new.behoben_am := null;
    new.behoben_durch := null;
    new.behebung := null;
    new.behebung_erfasst_von := null;
    new.behebung_erfasst_von_name := null;
    new.behebung_erfasst_am := null;
  elsif old.status in ('offen', 'in_bearbeitung') and new.status = 'behoben' then
    if new.verantwortlich_id is distinct from old.verantwortlich_id or new.termin is distinct from old.termin then
      raise exception 'Beim Beheben bleiben Verantwortlicher und Termin unverändert' using errcode = '23514';
    end if;
    if new.behoben_am is null or new.behoben_am > app.heute()
       or new.behoben_am < (old.erfasst_am at time zone 'Europe/Berlin')::date then
      raise exception 'Behebungsdatum muss zwischen Erfassung und heute liegen' using errcode = '23514';
    end if;
    new.kenntnis_von := old.kenntnis_von;
    new.kenntnis_von_name := old.kenntnis_von_name;
    new.kenntnis_am := old.kenntnis_am;
    new.behebung_erfasst_von := auth.uid();
    new.behebung_erfasst_von_name := app.akteur_name(new.organisation_id);
    new.behebung_erfasst_am := now();
  else
    raise exception 'Statusübergang % → % nicht erlaubt', old.status, new.status using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger mangel_pruefen before insert or update on public.mangel
  for each row execute function app.mangel_pruefen();

create or replace function app.mangel_ereignis()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.geraet_id, 'mangel_erfasst', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object('mangelId', new.id, 'pruefartId', new.geraet_pruefart_id, 'nachweisId', new.nachweis_id,
                               'schwere', new.schwere, 'termin', new.termin));
  elsif new.status = 'in_bearbeitung' and old.status = 'offen' then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.geraet_id, 'mangel_kenntnis', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object('mangelId', new.id, 'verantwortlichId', new.verantwortlich_id,
                               'verantwortlichName', app.mitglied_name(new.organisation_id, new.verantwortlich_id),
                               'terminAlt', old.termin, 'terminNeu', new.termin));
  elsif new.status = 'behoben' and old.status <> 'behoben' then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.geraet_id, 'mangel_behoben', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object('mangelId', new.id, 'behobenAm', new.behoben_am, 'behobenDurch', new.behoben_durch));
  end if;
  return new;
end;
$$;

create trigger mangel_ereignis after insert or update on public.mangel
  for each row execute function app.mangel_ereignis();

-- =====================================================================
-- Verwaltung: bereich, mitgliedschaft, bereich_verantwortung (F-17)
-- =====================================================================

revoke update on public.bereich, public.mitgliedschaft, public.bereich_verantwortung from authenticated;
grant insert on public.bereich, public.mitgliedschaft, public.bereich_verantwortung to authenticated;
grant update (name, einsatzort) on public.bereich to authenticated;
grant update (anzeigename, email, rolle, aktiv, pruefer_typen) on public.mitgliedschaft to authenticated;
grant delete on public.bereich_verantwortung to authenticated;

create policy bereich_insert on public.bereich
  for insert to authenticated with check (app.hat_rolle(organisation_id, array['admin']));
create policy bereich_update on public.bereich
  for update to authenticated
  using (app.hat_rolle(organisation_id, array['admin']))
  with check (app.hat_rolle(organisation_id, array['admin']));

create policy mitgliedschaft_insert on public.mitgliedschaft
  for insert to authenticated with check (app.hat_rolle(organisation_id, array['admin']));
create policy mitgliedschaft_update on public.mitgliedschaft
  for update to authenticated
  using (app.hat_rolle(organisation_id, array['admin']))
  with check (app.hat_rolle(organisation_id, array['admin']));

create policy bereich_verantwortung_insert on public.bereich_verantwortung
  for insert to authenticated with check (app.hat_rolle(organisation_id, array['admin']));
-- Einzige DELETE-Policy (Q-19): Bereichszuordnung ändern; protokolliert über mitglied_gespeichert.
create policy bereich_verantwortung_delete on public.bereich_verantwortung
  for delete to authenticated using (app.hat_rolle(organisation_id, array['admin']));

create or replace function app.bereich_ereignis()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and (new.name, new.einsatzort) is not distinct from (old.name, old.einsatzort) then
    return new;
  end if;
  insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
  values (new.organisation_id, null, 'bereich_gespeichert', auth.uid(), app.akteur_name(new.organisation_id),
          jsonb_build_object('bereichId', new.id, 'name', new.name,
                             'einsatzortAlt', case when tg_op = 'UPDATE' then old.einsatzort else null end,
                             'einsatzort', new.einsatzort));
  return new;
end;
$$;

create trigger bereich_ereignis after insert or update on public.bereich
  for each row execute function app.bereich_ereignis();

-- Letzter aktiver Admin (F-17) und eigene Mitgliedschaft; Prüfertypen nur bei Prüfern.
create or replace function app.mitgliedschaft_pruefen()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' then
    if (new.id, new.organisation_id, new.benutzer_id) is distinct from (old.id, old.organisation_id, old.benutzer_id) then
      raise exception 'Mitgliedschaft kann nicht umgehängt werden' using errcode = '42501';
    end if;
    if old.benutzer_id = auth.uid() and (new.rolle is distinct from old.rolle or new.aktiv is distinct from old.aktiv) then
      raise exception 'Die eigene Mitgliedschaft kann weder deaktiviert noch in der Rolle geändert werden'
        using errcode = '23514';
    end if;
    if old.rolle = 'admin' and old.aktiv and (new.rolle <> 'admin' or not new.aktiv)
       and not exists (select 1 from public.mitgliedschaft m
                       where m.organisation_id = old.organisation_id and m.id <> old.id
                         and m.rolle = 'admin' and m.aktiv) then
      raise exception 'Der letzte aktive Admin kann nicht deaktiviert oder herabgestuft werden' using errcode = '23514';
    end if;
  end if;
  if new.rolle <> 'pruefer' then
    new.pruefer_typen := '{}';
  end if;
  return new;
end;
$$;

create trigger mitgliedschaft_pruefen before insert or update on public.mitgliedschaft
  for each row execute function app.mitgliedschaft_pruefen();

-- mitglied_gespeichert einmal je Mitgliedschaft und Transaktion, mit der Bereichsmenge zum Commit-Zeitpunkt.
-- Deferred Constraint-Trigger auf mitgliedschaft und bereich_verantwortung; Dublettenschutz über eine
-- transaktionslokale Einstellung.
create or replace function app.mitglied_ereignis()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  mid uuid;
  erledigt text := coalesce(current_setting('readyloop.mitglied_ereignis', true), '');
  m public.mitgliedschaft;
begin
  -- if statt case: PL/pgSQL löst alle Feldzugriffe eines Ausdrucks auf
  if tg_table_name = 'mitgliedschaft' then
    mid := new.id;
  elsif tg_op = 'DELETE' then
    mid := old.mitgliedschaft_id;
  else
    mid := new.mitgliedschaft_id;
  end if;
  if position(mid::text in erledigt) > 0 then
    return null;
  end if;
  perform set_config('readyloop.mitglied_ereignis', erledigt || ',' || mid::text, true);
  select * into m from public.mitgliedschaft where id = mid;
  if not found then
    return null;
  end if;
  insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
  values (m.organisation_id, null, 'mitglied_gespeichert', auth.uid(), app.akteur_name(m.organisation_id),
          jsonb_build_object(
            'mitgliedschaftId', m.id,
            'name', m.anzeigename,
            'rolle', m.rolle,
            'bereichIds', coalesce((select jsonb_agg(bv.bereich_id order by bv.bereich_id)
                                    from public.bereich_verantwortung bv where bv.mitgliedschaft_id = m.id), '[]'::jsonb),
            'aktiv', m.aktiv,
            'eingeladen', coalesce((app.kontext() ->> 'eingeladen')::boolean, false)
          ));
  return null;
end;
$$;

create constraint trigger mitgliedschaft_ereignis after insert or update on public.mitgliedschaft
  deferrable initially deferred for each row execute function app.mitglied_ereignis();
create constraint trigger bereich_verantwortung_ereignis after insert or delete on public.bereich_verantwortung
  deferrable initially deferred for each row execute function app.mitglied_ereignis();

-- =====================================================================
-- ereignis: alle Typen aus F-19
-- =====================================================================

alter table public.ereignis drop constraint ereignis_typ_check;
alter table public.ereignis add constraint ereignis_typ_check check (typ in (
  'geraet_angelegt', 'frist_freigegeben', 'nachweis_erfasst', 'pruefer_zugewiesen', 'gbu_dokument_gesetzt',
  'geraet_verschoben', 'betriebsstatus_geaendert', 'anlass_erfasst', 'anlass_aufgehoben', 'mangel_erfasst',
  'mangel_kenntnis', 'mangel_behoben', 'bereich_gespeichert', 'mitglied_gespeichert'));

-- =====================================================================
-- RPCs (security invoker: RLS greift; eine Transaktion je Aufruf)
-- =====================================================================

-- Gerät mit Prüfarten anlegen (ohne Frist). Schlüssel in snake_case wie die Tabellenspalten.
create or replace function public.geraet_anlegen(p_geraet jsonb, p_pruefarten jsonb)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  g public.geraet;
  v_id uuid := coalesce((p_geraet ->> 'id')::uuid, gen_random_uuid());
begin
  if jsonb_typeof(p_pruefarten) is distinct from 'array' or jsonb_array_length(p_pruefarten) = 0 then
    raise exception 'Mindestens eine Prüfart' using errcode = '23514';
  end if;
  g := jsonb_populate_record(null::public.geraet, p_geraet);
  -- ohne RETURNING: die SELECT-Policy sähe die eigene neue Zeile im selben Statement nicht
  insert into public.geraet (id, organisation_id, bereich_id, bezeichnung, inventarnummer, geraetegruppe, kategorie,
                             hersteller, typ, seriennummer, baujahr, einsatzort)
  values (v_id, g.organisation_id, g.bereich_id, g.bezeichnung, g.inventarnummer, g.geraetegruppe, g.kategorie,
          g.hersteller, g.typ, g.seriennummer, g.baujahr, g.einsatzort);
  insert into public.geraet_pruefart (id, organisation_id, geraet_id, katalog_schluessel, bezeichnung,
                                      herstellerfrist_monate, herstellerfrist_quelle, letzte_pruefung, letzte_pruefung_herkunft)
  select coalesce(p.id, gen_random_uuid()), g.organisation_id, v_id, p.katalog_schluessel, p.bezeichnung,
         p.herstellerfrist_monate, p.herstellerfrist_quelle, p.letzte_pruefung, coalesce(p.letzte_pruefung_herkunft, 'unbekannt')
  from jsonb_populate_recordset(null::public.geraet_pruefart, p_pruefarten) p;
  return v_id;
end;
$$;

-- Frist freigeben (F-4, F-13). p_frist: frist_monate, frist_quelle, frist_stufe, frist_fundstelle, frist_quelle_url,
-- frist_katalog_eintrag_id, frist_katalog_version, frist_begruendung. p_nachweis: optional, muss zur Prüfart gehören.
create or replace function public.frist_setzen(p_pruefart uuid, p_frist jsonb, p_nachweis uuid)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  f public.geraet_pruefart := jsonb_populate_record(null::public.geraet_pruefart, p_frist);
  n integer;
begin
  if p_nachweis is not null
     and not exists (select 1 from public.nachweis x where x.id = p_nachweis and x.geraet_pruefart_id = p_pruefart) then
    raise exception 'Nachweis gehört nicht zu dieser Prüfart' using errcode = '23514';
  end if;
  perform set_config('readyloop.kontext', jsonb_build_object('nachweisId', p_nachweis)::text, true);
  update public.geraet_pruefart set
    frist_monate = f.frist_monate,
    frist_quelle = f.frist_quelle,
    frist_stufe = f.frist_stufe,
    frist_fundstelle = f.frist_fundstelle,
    frist_quelle_url = f.frist_quelle_url,
    frist_katalog_eintrag_id = f.frist_katalog_eintrag_id,
    frist_katalog_version = f.frist_katalog_version,
    frist_begruendung = f.frist_begruendung
  where id = p_pruefart;
  get diagnostics n = row_count;
  perform set_config('readyloop.kontext', '', true);
  if n = 0 then
    raise exception 'Prüfart nicht gefunden oder keine Berechtigung' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.geraet_verschieben(p_geraet uuid, p_bereich uuid, p_begruendung text)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  n integer;
begin
  perform set_config('readyloop.kontext', jsonb_build_object('begruendung', p_begruendung)::text, true);
  update public.geraet set bereich_id = p_bereich where id = p_geraet and bereich_id is distinct from p_bereich;
  get diagnostics n = row_count;
  perform set_config('readyloop.kontext', '', true);
  if n = 0 then
    raise exception 'Gerät nicht gefunden, bereits im Bereich oder keine Berechtigung' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.betriebsstatus_setzen(p_geraet uuid, p_status text, p_begruendung text)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  n integer;
begin
  if p_status not in ('in_betrieb', 'ausser_betrieb') then
    raise exception 'Betriebsstatus % ist in Inkrement 2 nicht setzbar', p_status using errcode = '23514';
  end if;
  perform set_config('readyloop.kontext', jsonb_build_object('begruendung', p_begruendung)::text, true);
  update public.geraet set betriebsstatus = p_status where id = p_geraet and betriebsstatus is distinct from p_status;
  get diagnostics n = row_count;
  perform set_config('readyloop.kontext', '', true);
  if n = 0 then
    raise exception 'Gerät nicht gefunden, Status unverändert oder keine Berechtigung' using errcode = '42501';
  end if;
end;
$$;

-- Mitgliedschaft anlegen oder ändern; Bereichsmenge atomar ersetzen. p_mitgliedschaft: id, organisation_id,
-- benutzer_id, anzeigename, email, rolle, aktiv, pruefer_typen, eingeladen (nur Ereignis).
create or replace function public.mitglied_speichern(p_mitgliedschaft jsonb, p_bereich_ids uuid[])
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  m public.mitgliedschaft := jsonb_populate_record(null::public.mitgliedschaft, p_mitgliedschaft);
  v_id uuid := coalesce(m.id, gen_random_uuid());
  n integer;
begin
  perform set_config('readyloop.kontext',
    jsonb_build_object('eingeladen', coalesce((p_mitgliedschaft ->> 'eingeladen')::boolean, false))::text, true);
  if exists (select 1 from public.mitgliedschaft x where x.id = v_id) then
    update public.mitgliedschaft set
      anzeigename = m.anzeigename,
      email = coalesce(m.email, ''),
      rolle = m.rolle,
      aktiv = coalesce(m.aktiv, true),
      pruefer_typen = coalesce(m.pruefer_typen, '{}')
    where id = v_id and organisation_id = m.organisation_id;
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'Mitgliedschaft nicht gefunden oder keine Berechtigung' using errcode = '42501';
    end if;
  else
    insert into public.mitgliedschaft (id, organisation_id, benutzer_id, anzeigename, email, rolle, aktiv, pruefer_typen)
    values (v_id, m.organisation_id, m.benutzer_id, m.anzeigename, coalesce(m.email, ''), m.rolle,
            coalesce(m.aktiv, true), coalesce(m.pruefer_typen, '{}'));
  end if;

  delete from public.bereich_verantwortung bv
  where bv.mitgliedschaft_id = v_id and not (bv.bereich_id = any (coalesce(p_bereich_ids, '{}')));
  insert into public.bereich_verantwortung (organisation_id, mitgliedschaft_id, bereich_id)
  select m.organisation_id, v_id, b
  from unnest(coalesce(p_bereich_ids, '{}')) b
  where not exists (select 1 from public.bereich_verantwortung x where x.mitgliedschaft_id = v_id and x.bereich_id = b);
  return v_id;
end;
$$;

revoke all on function public.geraet_anlegen(jsonb, jsonb), public.frist_setzen(uuid, jsonb, uuid),
  public.geraet_verschieben(uuid, uuid, text), public.betriebsstatus_setzen(uuid, text, text),
  public.mitglied_speichern(jsonb, uuid[]) from public, anon;
grant execute on function public.geraet_anlegen(jsonb, jsonb), public.frist_setzen(uuid, jsonb, uuid),
  public.geraet_verschieben(uuid, uuid, text), public.betriebsstatus_setzen(uuid, text, text),
  public.mitglied_speichern(jsonb, uuid[]) to authenticated;
