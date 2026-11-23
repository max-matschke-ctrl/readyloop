-- Readyloop Inkrement I3M: Mitarbeiter, Zuordnung, Übernahme, Geräte-Token, öffentliche QR-Seite (BE-19)
-- Grundlage: docs/requirements.md §3b (F-20 bis F-29), §5, §6 „RLS I3M“, §6a; docs/backlog.md §6 BE-19.
-- Hinweis Dateiname: 20261128… statt 20261127…, weil 20261127000000 bereits von review_i2 belegt ist (eindeutige
-- Migrationsversion; sonst liefe diese Datei alphabetisch vor review_i2 und deren Änderungen würden sie überschreiben).
-- Grundsätze:
--   * MA haben keine SELECT-Policy auf geraet, geraet_pruefart, nachweis, anlass, mangel, ereignis, geraet_token.
--     Sie lesen nur über security-definer-RPCs mit den Feldern der öffentlichen Ansicht (ma_kurzansichten).
--   * anon darf genau eine Funktion ausführen: geraet_oeffentlich (QR-Seite). Alles andere: revoke from public, anon.
--   * Übernahmen stehen nicht in ereignis (F-27); sie werden nach 90 Tagen pseudonymisiert.
--   * „Nicht verwenden“ (F-21) blockiert die Übernahme auch in der DB (direkter RPC-Aufruf mit MA-JWT).

-- =====================================================================
-- Ereignis-Typen (F-28)
-- =====================================================================

alter table public.ereignis drop constraint ereignis_typ_check;
alter table public.ereignis add constraint ereignis_typ_check check (typ in (
  'geraet_angelegt', 'frist_freigegeben', 'nachweis_erfasst', 'pruefer_zugewiesen', 'gbu_dokument_gesetzt',
  'geraet_verschoben', 'betriebsstatus_geaendert', 'anlass_erfasst', 'anlass_aufgehoben', 'mangel_erfasst',
  'mangel_kenntnis', 'mangel_behoben', 'bereich_gespeichert', 'mitglied_gespeichert',
  'zuordnung_geaendert', 'etikett_erneuert'));

-- =====================================================================
-- Sichtbarkeit für Mitarbeiter (F-27, §6a): eigene Mitgliedschaft, keine Kollegenliste
-- =====================================================================

drop policy mitgliedschaft_select on public.mitgliedschaft;
create policy mitgliedschaft_select on public.mitgliedschaft
  for select to authenticated using (
    (benutzer_id = auth.uid() and app.ist_mitglied(organisation_id))
    or app.hat_rolle(organisation_id, array['admin', 'sifa', 'verantwortlicher', 'pruefer'])
  );

drop policy bereich_verantwortung_select on public.bereich_verantwortung;
create policy bereich_verantwortung_select on public.bereich_verantwortung
  for select to authenticated using (app.hat_rolle(organisation_id, array['admin', 'sifa', 'verantwortlicher', 'pruefer']));

-- =====================================================================
-- geraet.zugeordnet_an (F-22)
-- =====================================================================

alter table public.geraet
  add column zugeordnet_an uuid references auth.users (id),
  add constraint geraet_zuordnung_nur_personenbezogen check (zugeordnet_an is null or kategorie = 'personenbezogen');

create index on public.geraet (zugeordnet_an) where zugeordnet_an is not null;

grant update (zugeordnet_an) on public.geraet to authenticated;

-- Zeilenrechte: Policy geraet_update (admin, VER Bereich). Ziel: aktives MA-Mitglied derselben Organisation.
-- Beim Austritt (F-20) setzt app.mitarbeiter_austritt das Flag readyloop.austritt: dann weder Rechteprüfung noch Ereignis.
create or replace function app.geraet_zuordnung_pruefen()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and new.zugeordnet_an is not distinct from old.zugeordnet_an then
    return new;
  end if;
  if tg_op = 'INSERT' and new.zugeordnet_an is null then
    return new;
  end if;
  if auth.uid() is not null and coalesce(current_setting('readyloop.austritt', true), '') = ''
     and not (app.hat_rolle(new.organisation_id, array['admin'])
              or (app.hat_rolle(new.organisation_id, array['verantwortlicher']) and app.verantwortet_bereich(new.bereich_id))) then
    raise exception 'Keine Berechtigung, Geräte zuzuordnen' using errcode = '42501';
  end if;
  if new.zugeordnet_an is not null then
    if new.kategorie <> 'personenbezogen' then
      raise exception 'Nur personenbezogene Geräte werden zugeordnet' using errcode = '23514';
    end if;
    if not app.aktives_mitglied_mit_rolle(new.organisation_id, new.zugeordnet_an, array['mitarbeiter']) then
      raise exception 'Zuordnung nur an aktive Mitarbeiter der Organisation' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger geraet_zuordnung_pruefen before insert or update on public.geraet
  for each row execute function app.geraet_zuordnung_pruefen();

-- Ereignis ohne Personenbezug (F-22, F-27): nur { zugeordnet: boolean }.
create or replace function app.zuordnung_ereignis()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.zugeordnet_an is distinct from old.zugeordnet_an
     and coalesce(current_setting('readyloop.austritt', true), '') = '' then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.id, 'zuordnung_geaendert', auth.uid(), app.akteur_name(new.organisation_id),
            jsonb_build_object('zugeordnet', new.zugeordnet_an is not null));
  end if;
  return new;
end;
$$;

create trigger geraet_zuordnung_ereignis after update on public.geraet
  for each row execute function app.zuordnung_ereignis();

-- =====================================================================
-- geraet_token (F-24)
-- =====================================================================

create table public.geraet_token (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  geraet_id uuid not null,
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{22}$'),
  aktiv boolean not null default true,
  erstellt_am timestamptz not null default now(),
  deaktiviert_am timestamptz,
  foreign key (geraet_id, organisation_id) references public.geraet (id, organisation_id),
  constraint geraet_token_deaktiviert check (aktiv = (deaktiviert_am is null))
);
-- Genau ein aktiver Token je Gerät
create unique index geraet_token_ein_aktiver on public.geraet_token (geraet_id) where aktiv;
create index on public.geraet_token (organisation_id);

-- 16 Byte aus gen_random_bytes (pgcrypto, kryptografisch sicher), base64url ohne '=' → 22 Zeichen (128 Bit).
-- search_path enthält 'extensions' (Supabase legt pgcrypto dort an).
create or replace function app.neuer_token()
returns text language sql volatile security definer set search_path = public, extensions, pg_temp as $$
  select rtrim(translate(encode(gen_random_bytes(16), 'base64'), '+/', '-_'), '=');
$$;

alter table public.geraet_token enable row level security;

revoke all on public.geraet_token from anon;
revoke update, delete, truncate on public.geraet_token from authenticated;
grant select, insert on public.geraet_token to authenticated;
grant update (aktiv) on public.geraet_token to authenticated;

-- etikett.verwalten: admin ganze Organisation, VER eigene Bereiche.
create policy geraet_token_select on public.geraet_token
  for select to authenticated using (
    app.hat_rolle(organisation_id, array['admin'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  );
create policy geraet_token_insert on public.geraet_token
  for insert to authenticated with check (
    app.hat_rolle(organisation_id, array['admin'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  );
create policy geraet_token_update on public.geraet_token
  for update to authenticated
  using (
    app.hat_rolle(organisation_id, array['admin'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  )
  with check (
    app.hat_rolle(organisation_id, array['admin'])
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
  );

-- INSERT: Clients wählen den Token nie selbst (nicht erratbar); UPDATE: nur aktiv true → false, stempelt deaktiviert_am.
create or replace function app.geraet_token_pruefen()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.token := app.neuer_token();
    end if;
    new.aktiv := true;
    new.deaktiviert_am := null;
    new.erstellt_am := now();
    return new;
  end if;
  if (new.id, new.organisation_id, new.geraet_id, new.token, new.erstellt_am)
     is distinct from (old.id, old.organisation_id, old.geraet_id, old.token, old.erstellt_am) then
    raise exception 'Token sind unveränderlich; nur Deaktivieren ist möglich' using errcode = '42501';
  end if;
  if not (old.aktiv and not new.aktiv) then
    raise exception 'Nur ein aktiver Token kann deaktiviert werden' using errcode = '23514';
  end if;
  new.deaktiviert_am := now();
  return new;
end;
$$;

create trigger geraet_token_pruefen before insert or update on public.geraet_token
  for each row execute function app.geraet_token_pruefen();
create trigger geraet_token_kein_loeschen before delete on public.geraet_token
  for each row execute function app.verbiete_aenderung();

-- Aufkleber erneuert (F-24, F-28): beim Deaktivieren, ohne Token im Ereignis.
create or replace function app.etikett_ereignis()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if old.aktiv and not new.aktiv then
    insert into public.ereignis (organisation_id, geraet_id, typ, akteur_id, akteur_name, daten)
    values (new.organisation_id, new.geraet_id, 'etikett_erneuert', auth.uid(), app.akteur_name(new.organisation_id), '{}'::jsonb);
  end if;
  return new;
end;
$$;

create trigger geraet_token_ereignis after update on public.geraet_token
  for each row execute function app.etikett_ereignis();

-- Token beim Anlegen eines Geräts (security definer: unabhängig von den Token-Policies des Anlegenden).
create or replace function app.geraet_token_anlegen()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.geraet_token (organisation_id, geraet_id, token) values (new.organisation_id, new.id, app.neuer_token());
  return new;
end;
$$;

create trigger geraet_token_anlegen after insert on public.geraet
  for each row execute function app.geraet_token_anlegen();

-- Bestand: je Gerät ohne aktiven Token einen neuen
insert into public.geraet_token (organisation_id, geraet_id, token)
select g.organisation_id, g.id, app.neuer_token()
from public.geraet g
where not exists (select 1 from public.geraet_token t where t.geraet_id = g.id and t.aktiv);

-- Aufkleber erneuern (F-24): alten Token deaktivieren, neuen anlegen – eine Transaktion, RLS greift (invoker).
create or replace function public.etikett_erneuern(p_geraet uuid)
returns text language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_token text;
begin
  update public.geraet_token set aktiv = false where geraet_id = p_geraet and aktiv;
  insert into public.geraet_token (organisation_id, geraet_id, token)
  select g.organisation_id, g.id, app.neuer_token()
  from public.geraet g where g.id = p_geraet
  returning token into v_token;
  if v_token is null then
    raise exception 'Gerät nicht gefunden oder keine Berechtigung' using errcode = '42501';
  end if;
  return v_token;
end;
$$;

-- =====================================================================
-- uebernahme (F-23, F-27)
-- =====================================================================

create table public.uebernahme (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisation (id),
  geraet_id uuid not null,
  benutzer_id uuid references auth.users (id), -- null nach Pseudonymisierung
  benutzer_name text, -- null nach Pseudonymisierung
  von timestamptz not null default now(),
  bis timestamptz,
  ende_art text check (ende_art in ('rueckgabe', 'uebergabe', 'beendet_verwaltung', 'austritt')),
  beendet_von uuid references auth.users (id),
  pseudonymisiert_am timestamptz,
  foreign key (geraet_id, organisation_id) references public.geraet (id, organisation_id),
  constraint uebernahme_ende check ((bis is null) = (ende_art is null)),
  constraint uebernahme_zeitraum check (bis is null or bis >= von),
  constraint uebernahme_person check (
    (pseudonymisiert_am is null and benutzer_id is not null and benutzer_name is not null)
    or (pseudonymisiert_am is not null and bis is not null and benutzer_id is null and benutzer_name is null and beendet_von is null)
  )
);
-- Höchstens eine offene Übernahme je Gerät
create unique index uebernahme_eine_offene on public.uebernahme (geraet_id) where bis is null;
create index on public.uebernahme (organisation_id, geraet_id);
create index on public.uebernahme (benutzer_id) where bis is null;

alter table public.uebernahme enable row level security;

revoke all on public.uebernahme from anon;
revoke insert, update, delete, truncate on public.uebernahme from authenticated;
grant select on public.uebernahme to authenticated;

-- Lesen: eigene Zeilen; admin alle der Organisation (abgeschlossene nur pseudonymisiert nach 90 Tagen);
-- sifa und VER (Bereich) nur offene; Prüfer nichts. Schreiben nur über RPCs, Austritt-Trigger und Pseudonymisierung.
create policy uebernahme_select on public.uebernahme
  for select to authenticated using (
    (benutzer_id = auth.uid() and app.ist_mitglied(organisation_id))
    or app.hat_rolle(organisation_id, array['admin'])
    or (bis is null and (
      app.hat_rolle(organisation_id, array['sifa'])
      or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
    ))
  );

-- Einmaliges Beenden; danach nur noch Pseudonymisieren. Kein DELETE.
create or replace function app.uebernahme_pruefen()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if (new.id, new.organisation_id, new.geraet_id, new.von) is distinct from (old.id, old.organisation_id, old.geraet_id, old.von) then
    raise exception 'Übernahme: Gerät und Beginn sind unveränderlich' using errcode = '42501';
  end if;
  if old.bis is not null and (new.bis, new.ende_art) is distinct from (old.bis, old.ende_art) then
    raise exception 'Übernahme ist bereits beendet' using errcode = '23514';
  end if;
  if old.pseudonymisiert_am is not null and new.pseudonymisiert_am is distinct from old.pseudonymisiert_am then
    raise exception 'Übernahme ist bereits pseudonymisiert' using errcode = '23514';
  end if;
  if new.benutzer_id is not null and new.benutzer_id is distinct from old.benutzer_id then
    raise exception 'Die Person einer Übernahme kann nur entfernt werden' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger uebernahme_pruefen before update on public.uebernahme
  for each row execute function app.uebernahme_pruefen();
create trigger uebernahme_kein_loeschen before delete on public.uebernahme
  for each row execute function app.verbiete_aenderung();

-- =====================================================================
-- Status für öffentliche Ansicht und Kurzansicht (F-21, F-24) – nur öffentliche Felder
-- =====================================================================

-- F-21 „Nicht verwenden“, gespiegelt in src/domain/nutzung.ts + status.ts: außer Betrieb, offener gefährlicher Mangel,
-- offener Anlass, letzter Nachweis nicht bestanden oder freigegebene Frist abgelaufen.
create or replace function app.geraet_nicht_verwenden(p_geraet uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select g.betriebsstatus <> 'in_betrieb'
    or exists (select 1 from public.mangel m
               where m.geraet_id = g.id and m.status <> 'behoben' and m.schwere = 'gefaehrlich')
    or exists (select 1 from public.anlass a
               where a.geraet_id = g.id and a.aufgehoben_am is null
                 and not app.anlass_erledigt(a.geraet_pruefart_id, a.datum, a.erfasst_am))
    or exists (select 1 from public.geraet_pruefart gp
               where gp.geraet_id = g.id
                 and ((gp.frist_monate is not null and gp.letzte_pruefung is not null
                       and (gp.letzte_pruefung + make_interval(months => gp.frist_monate))::date < app.heute())
                      or (select n.ergebnis from public.nachweis n
                          where n.geraet_pruefart_id = gp.id
                          order by n.pruefdatum desc, n.erfasst_am desc limit 1) = 'nicht_bestanden'))
  from public.geraet g where g.id = p_geraet;
$$;

-- Rohdaten (snake_case) wie TokenRohdaten ohne organisation_name: kein Bereich, keine Personen außer dem Prüfernamen des
-- neuesten Nachweises je Prüfart, keine Mängelbeschreibung, kein Verlauf (nur neuester Nachweis je Prüfart, nur offene Anlässe).
create or replace function app.geraet_status_json(p_geraet uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'geraet', jsonb_build_object(
      'id', g.id, 'organisation_id', g.organisation_id, 'bezeichnung', g.bezeichnung, 'inventarnummer', g.inventarnummer,
      'hersteller', g.hersteller, 'typ', g.typ, 'kategorie', g.kategorie, 'betriebsstatus', g.betriebsstatus),
    'pruefarten', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', gp.id, 'bezeichnung', gp.bezeichnung, 'letzte_pruefung', gp.letzte_pruefung,
        'letzte_pruefung_herkunft', gp.letzte_pruefung_herkunft,
        'frist', case when gp.frist_monate is null then null else jsonb_build_object(
          'monate', gp.frist_monate, 'quelle', gp.frist_quelle, 'stufe', gp.frist_stufe, 'fundstelle', gp.frist_fundstelle) end
      ) order by gp.bezeichnung, gp.id)
      from public.geraet_pruefart gp where gp.geraet_id = g.id), '[]'::jsonb),
    'nachweise', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id, 'geraet_pruefart_id', n.geraet_pruefart_id, 'pruefdatum', n.pruefdatum, 'ergebnis', n.ergebnis,
        'erfasst_am', n.erfasst_am, 'pruefer_name', n.pruefer_name
      ) order by n.pruefdatum desc, n.erfasst_am desc)
      from (select x.*, row_number() over (partition by x.geraet_pruefart_id order by x.pruefdatum desc, x.erfasst_am desc) as rang
            from public.nachweis x where x.geraet_id = g.id) n
      where n.rang = 1), '[]'::jsonb),
    'anlaesse', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'geraet_pruefart_id', a.geraet_pruefart_id, 'datum', a.datum, 'erfasst_am', a.erfasst_am,
        'aufgehoben_am', a.aufgehoben_am
      ) order by a.datum desc, a.erfasst_am desc)
      from public.anlass a
      where a.geraet_id = g.id and a.aufgehoben_am is null
        and not app.anlass_erledigt(a.geraet_pruefart_id, a.datum, a.erfasst_am)), '[]'::jsonb),
    'offene_maengel', coalesce((
      select jsonb_agg(jsonb_build_object('schwere', m.schwere) order by m.schwere)
      from public.mangel m where m.geraet_id = g.id and m.status <> 'behoben'), '[]'::jsonb)
  )
  from public.geraet g where g.id = p_geraet;
$$;

-- Öffentliche QR-Seite (F-24): einzige Funktion für anon. null bei falschem Format, unbekanntem oder inaktivem Token.
create or replace function public.geraet_oeffentlich(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_geraet uuid;
  v_org text;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{22}$' then
    return null;
  end if;
  select t.geraet_id, o.name into v_geraet, v_org
  from public.geraet_token t
  join public.organisation o on o.id = t.organisation_id
  where t.token = p_token and t.aktiv;
  if v_geraet is null then
    return null;
  end if;
  return app.geraet_status_json(v_geraet) || jsonb_build_object('organisation_name', v_org);
end;
$$;

-- Kurzansichten für Mitarbeiter (F-21, F-26, US-28): aktive MA-Mitgliedschaft in p_org, sonst 42501.
-- p_art: 'meine' (zugeordnet oder offene eigene Übernahme) | 'suche' (≥ 2 Zeichen, höchstens 50) | 'ids'.
create or replace function public.ma_kurzansichten(p_org uuid, p_art text, p_suche text, p_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  q text := lower(trim(coalesce(p_suche, '')));
  ids uuid[];
begin
  if uid is null or not app.hat_rolle(p_org, array['mitarbeiter']) then
    raise exception 'Keine Berechtigung' using errcode = '42501';
  end if;
  if p_art = 'meine' then
    select array_agg(g.id) into ids from public.geraet g
    where g.organisation_id = p_org
      and (g.zugeordnet_an = uid
           or exists (select 1 from public.uebernahme u where u.geraet_id = g.id and u.bis is null and u.benutzer_id = uid));
  elsif p_art = 'suche' then
    if length(q) < 2 then
      return '[]'::jsonb;
    end if;
    q := left(q, 80);
    -- position() statt ILIKE: Suchtext ohne Platzhalter-Bedeutung
    select array_agg(x.id) into ids from (
      select g.id from public.geraet g
      where g.organisation_id = p_org
        and (position(q in lower(g.bezeichnung)) > 0
             or position(q in lower(coalesce(g.inventarnummer, ''))) > 0
             or position(q in lower(coalesce(g.seriennummer, ''))) > 0
             or position(q in lower(coalesce(g.hersteller, ''))) > 0)
      order by g.bezeichnung, g.id
      limit 50) x;
  elsif p_art = 'ids' then
    select array_agg(g.id) into ids from public.geraet g
    where g.organisation_id = p_org and g.id = any (coalesce(p_ids, '{}'));
  else
    raise exception 'Unbekannte Auswahl %', p_art using errcode = '22023';
  end if;

  return coalesce((
    select jsonb_agg(
      app.geraet_status_json(g.id) || jsonb_build_object(
        'bereich_name', b.name,
        'zugeordnet_mir', coalesce(g.zugeordnet_an = uid, false),
        'offene_uebernahme', (
          select jsonb_build_object('von_mir', u.benutzer_id = uid, 'seit', case when u.benutzer_id = uid then u.von end)
          from public.uebernahme u where u.geraet_id = g.id and u.bis is null)
      ) order by g.bezeichnung, g.id)
    from public.geraet g join public.bereich b on b.id = g.bereich_id
    where g.id = any (coalesce(ids, '{}'))), '[]'::jsonb);
end;
$$;

-- =====================================================================
-- Übernahme starten und beenden (F-23) – security definer, Regeln in der Funktion
-- =====================================================================

create or replace function public.uebernahme_starten(p_geraet uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  g public.geraet;
  v_id uuid := gen_random_uuid();
begin
  if uid is null then
    raise exception 'Keine Berechtigung' using errcode = '42501';
  end if;
  -- Zeile sperren: parallele Übernahmen desselben Geräts laufen nacheinander
  select * into g from public.geraet where id = p_geraet for update;
  if not found or not app.hat_rolle(g.organisation_id, array['mitarbeiter']) then
    raise exception 'Gerät nicht gefunden oder keine Berechtigung' using errcode = '42501';
  end if;
  if g.kategorie <> 'wechselnd' then
    raise exception 'Nur Geräte mit wechselndem Einsatzort werden übernommen' using errcode = '23514';
  end if;
  if g.betriebsstatus <> 'in_betrieb' then
    raise exception 'Gerät ist außer Betrieb – nicht verwenden' using errcode = '23514';
  end if;
  if app.geraet_nicht_verwenden(g.id) then
    raise exception 'Prüfung überfällig oder vor Nutzung zu prüfen – nicht verwenden. Bitte Verantwortlichen informieren'
      using errcode = '23514';
  end if;
  if exists (select 1 from public.uebernahme u where u.geraet_id = g.id and u.bis is null and u.benutzer_id = uid) then
    raise exception 'Sie haben dieses Gerät bereits übernommen' using errcode = '23514';
  end if;
  -- Übergabe: fremde offene Übernahme endet in derselben Transaktion (Q-44: keine Benachrichtigung)
  update public.uebernahme set bis = now(), ende_art = 'uebergabe', beendet_von = uid
  where geraet_id = g.id and bis is null;
  insert into public.uebernahme (id, organisation_id, geraet_id, benutzer_id, benutzer_name)
  values (v_id, g.organisation_id, g.id, uid, app.mitglied_name(g.organisation_id, uid));
  return v_id;
end;
$$;

create or replace function public.uebernahme_beenden(p_geraet uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid();
  g public.geraet;
  n integer;
begin
  if uid is null then
    raise exception 'Keine Berechtigung' using errcode = '42501';
  end if;
  select * into g from public.geraet where id = p_geraet for update;
  if not found then
    raise exception 'Gerät nicht gefunden oder keine Berechtigung' using errcode = '42501';
  end if;
  -- (a) Rückgabe der eigenen offenen Übernahme – immer möglich, auch bei „Nicht verwenden“
  if app.hat_rolle(g.organisation_id, array['mitarbeiter']) then
    update public.uebernahme set bis = now(), ende_art = 'rueckgabe', beendet_von = uid
    where geraet_id = g.id and bis is null and benutzer_id = uid;
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'Sie haben dieses Gerät nicht übernommen' using errcode = '23514';
    end if;
    return;
  end if;
  -- (c) Beenden durch admin oder VER im Bereich (geraet.zuordnen)
  if app.hat_rolle(g.organisation_id, array['admin'])
     or (app.hat_rolle(g.organisation_id, array['verantwortlicher']) and app.verantwortet_bereich(g.bereich_id)) then
    update public.uebernahme set bis = now(), ende_art = 'beendet_verwaltung', beendet_von = uid
    where geraet_id = g.id and bis is null;
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'Das Gerät ist nicht übernommen' using errcode = '23514';
    end if;
    return;
  end if;
  raise exception 'Gerät nicht gefunden oder keine Berechtigung' using errcode = '42501';
end;
$$;

-- =====================================================================
-- Mangel melden durch Mitarbeiter (F-26)
-- =====================================================================

drop policy mangel_insert on public.mangel;
create policy mangel_insert on public.mangel
  for insert to authenticated with check (
    (app.hat_rolle(organisation_id, array['sifa']) and verantwortlich_id is not null)
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id)
        and verantwortlich_id is not null)
    or (geraet_pruefart_id is not null and app.ist_zugewiesen(geraet_pruefart_id) and verantwortlich_id is null)
    -- MA: jedes Gerät der Organisation, ohne Prüfart/Nachweis/Verantwortlichen, Termin automatisch (Q-16)
    or (app.hat_rolle(organisation_id, array['mitarbeiter'])
        and geraet_pruefart_id is null and nachweis_id is null and verantwortlich_id is null
        and erfasst_von = auth.uid()
        and termin = app.heute() + case schwere when 'gefaehrlich' then 0 when 'erheblich' then 30 else 90 end)
  );

-- Wie 20261126000000_inkrement2.sql, zusätzlich Termin-Regel für Mitarbeiter (F-26).
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
    if auth.uid() is not null and app.hat_rolle(new.organisation_id, array['mitarbeiter'])
       and new.termin <> app.heute() + (case new.schwere when 'gefaehrlich' then 0 when 'erheblich' then 30 else 90 end) then
      raise exception 'Termin für gemeldete Mängel ergibt sich aus der Schwere' using errcode = '23514';
    end if;
    new.erfasst_von := coalesce(auth.uid(), new.erfasst_von);
    new.erfasst_von_name := app.akteur_name(new.organisation_id);
    new.erfasst_am := now();
    return new;
  end if;

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

-- =====================================================================
-- Mitgliedschaft: VER lädt Mitarbeiter ein (F-20, Q-35); Austritt löst Zuordnung und Übernahmen (R-45)
-- =====================================================================

create policy mitgliedschaft_insert_mitarbeiter on public.mitgliedschaft
  for insert to authenticated with check (
    app.hat_rolle(organisation_id, array['verantwortlicher']) and rolle = 'mitarbeiter' and aktiv
  );

-- E-Mail: admin alle; VER nur Mitarbeiter (Liste /mitarbeiter, §6a).
create or replace function public.mitglied_emails(p_organisation uuid)
returns table (benutzer_id uuid, email text)
language sql stable security definer set search_path = public, pg_temp as $$
  select m.benutzer_id, m.email
  from public.mitgliedschaft m
  where m.organisation_id = p_organisation
    and (app.hat_rolle(p_organisation, array['admin'])
         or (m.rolle = 'mitarbeiter' and app.hat_rolle(p_organisation, array['verantwortlicher'])));
$$;

-- Wie 20261127000000_review_i2.sql; zusätzlich: Nicht-Admins (VER) legen nur neue Mitarbeiter ohne Bereiche an.
create or replace function public.mitglied_speichern(p_mitgliedschaft jsonb, p_bereich_ids uuid[])
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  m public.mitgliedschaft := jsonb_populate_record(null::public.mitgliedschaft, p_mitgliedschaft);
  v_id uuid := coalesce(m.id, gen_random_uuid());
  n integer;
begin
  if not app.hat_rolle(m.organisation_id, array['admin'])
     and (m.rolle is distinct from 'mitarbeiter' or cardinality(coalesce(p_bereich_ids, '{}')) > 0
          or exists (select 1 from public.mitgliedschaft x where x.id = v_id)) then
    raise exception 'Verantwortliche laden nur Mitarbeiter ohne Bereiche ein' using errcode = '42501';
  end if;
  perform set_config('readyloop.kontext',
    jsonb_build_object('eingeladen', coalesce((p_mitgliedschaft ->> 'eingeladen')::boolean, false))::text, true);
  if exists (select 1 from public.mitgliedschaft x where x.id = v_id) then
    update public.mitgliedschaft set
      anzeigename = m.anzeigename,
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

-- F-20 Austritt (Löschkonzept R-45): Deaktivieren oder Rollenwechsel weg von 'mitarbeiter' löst in derselben
-- Transaktion alle Zuordnungen und beendet offene Übernahmen mit 'austritt'. Gemeldete Mängel bleiben.
create or replace function app.mitarbeiter_austritt()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if old.rolle = 'mitarbeiter' and old.aktiv and (not new.aktiv or new.rolle <> 'mitarbeiter') then
    perform set_config('readyloop.austritt', '1', true);
    update public.geraet set zugeordnet_an = null
    where organisation_id = new.organisation_id and zugeordnet_an = new.benutzer_id;
    update public.uebernahme set bis = now(), ende_art = 'austritt'
    where organisation_id = new.organisation_id and benutzer_id = new.benutzer_id and bis is null;
    perform set_config('readyloop.austritt', '', true);
  end if;
  return new;
end;
$$;

create trigger mitgliedschaft_austritt after update on public.mitgliedschaft
  for each row execute function app.mitarbeiter_austritt();

-- =====================================================================
-- Pseudonymisierung abgeschlossener Übernahmen nach 90 Tagen (F-27)
-- =====================================================================

create or replace function app.uebernahmen_pseudonymisieren()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  n integer;
begin
  update public.uebernahme
  set benutzer_id = null, benutzer_name = null, beendet_von = null, pseudonymisiert_am = now()
  where bis is not null and bis < now() - interval '90 days' and pseudonymisiert_am is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Täglich 03:15 Europe/Berlin. pg_cron rechnet in UTC: Lauf um 01:15 und 02:15 UTC, ausgeführt wird nur der Lauf,
-- der in Berlin 03:xx ist (Winter- und Sommerzeit). Nur wenn die Erweiterung verfügbar ist (lokal ggf. nicht).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'readyloop_uebernahmen_pseudonymisieren',
      '15 1,2 * * *',
      $job$select app.uebernahmen_pseudonymisieren() where extract(hour from now() at time zone 'Europe/Berlin') = 3$job$
    );
  end if;
end;
$$;

-- =====================================================================
-- Ausführungsrechte: jede neue Funktion gesperrt für public und anon; geraet_oeffentlich zusätzlich für anon
-- =====================================================================

revoke execute on function app.neuer_token() from public, anon;
grant execute on function app.neuer_token() to authenticated; -- für etikett_erneuern (invoker); liefert nur Zufall
revoke execute on function app.geraet_zuordnung_pruefen() from public, anon;
revoke execute on function app.zuordnung_ereignis() from public, anon;
revoke execute on function app.geraet_token_pruefen() from public, anon;
revoke execute on function app.etikett_ereignis() from public, anon;
revoke execute on function app.geraet_token_anlegen() from public, anon;
revoke execute on function app.uebernahme_pruefen() from public, anon;
revoke execute on function app.geraet_nicht_verwenden(uuid) from public, anon;
revoke execute on function app.geraet_status_json(uuid) from public, anon;
revoke execute on function app.mitarbeiter_austritt() from public, anon;
revoke execute on function app.mangel_pruefen() from public, anon;
revoke execute on function app.uebernahmen_pseudonymisieren() from public, anon, authenticated;
revoke execute on function public.etikett_erneuern(uuid) from public, anon;
revoke execute on function public.ma_kurzansichten(uuid, text, text, uuid[]) from public, anon;
revoke execute on function public.uebernahme_starten(uuid) from public, anon;
revoke execute on function public.uebernahme_beenden(uuid) from public, anon;
revoke execute on function public.mitglied_emails(uuid) from public, anon;
revoke execute on function public.mitglied_speichern(jsonb, uuid[]) from public, anon;
revoke execute on function public.geraet_oeffentlich(text) from public;

grant execute on function public.etikett_erneuern(uuid), public.ma_kurzansichten(uuid, text, text, uuid[]),
  public.uebernahme_starten(uuid), public.uebernahme_beenden(uuid), public.mitglied_emails(uuid),
  public.mitglied_speichern(jsonb, uuid[]) to authenticated;
grant execute on function public.geraet_oeffentlich(text) to anon, authenticated;
