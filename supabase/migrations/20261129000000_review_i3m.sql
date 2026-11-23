-- Readyloop I3M: Review-Befunde Backend. 20261128000000_inkrement3m.sql bleibt unverändert; diese Datei ersetzt Teile davon.
-- 1. F-24: Die öffentliche Ansicht (anon-RPC geraet_oeffentlich) enthält keine internen IDs mehr – weder Gerät noch
--    Organisation, Prüfart, Nachweis oder Anlass. Sonst ließen sich alter und neuer Aufkleber verknüpfen und Geräte einem
--    Betrieb zuordnen. Prüfarten tragen eine laufende Nummer (nr), Nachweise und Anlässe verweisen über pruefart_nr.
--    Nur angemeldete aktive Mitglieder, deren aktuelle Organisation (p_organisation) die Geräte-Organisation ist, erhalten
--    zusätzlich geraet_id und gleiche_organisation.
-- 2. F-27/US-32: Kein direkter SELECT auf abgeschlossene Übernahmen (auch nicht für admin). Der Verlauf kommt nur über
--    public.uebernahmen_verlauf(p_geraet): ein Gerät, nur admin, nur Ende innerhalb der letzten 90 Tage – unabhängig davon,
--    ob die Pseudonymisierung (pg_cron) gelaufen ist. Fehlt pg_cron im Supabase-Kontext, meldet die Migration das laut.
-- 3. Mitarbeiter sehen nur eigene OFFENE Übernahmen (nicht beendet_von des Nachfolgers).

-- =====================================================================
-- 1. Status-JSON ohne interne IDs (F-24)
-- =====================================================================

-- Gespiegelt in src/server/repo/types.ts (StatusRohdaten) und im Demo-Repository (statusRohdaten).
-- Kein Bereich, keine Personen außer dem Prüfernamen des neuesten Nachweises je Prüfart, keine Mängelbeschreibung,
-- kein Verlauf (nur neuester Nachweis je Prüfart, nur offene Anlässe), keine UUIDs.
create or replace function app.geraet_status_json(p_geraet uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  with pa as (
    select gp.*, row_number() over (order by gp.bezeichnung, gp.id) as nr
    from public.geraet_pruefart gp where gp.geraet_id = p_geraet
  )
  select jsonb_build_object(
    'geraet', jsonb_build_object(
      'bezeichnung', g.bezeichnung, 'inventarnummer', g.inventarnummer, 'hersteller', g.hersteller, 'typ', g.typ,
      'kategorie', g.kategorie, 'betriebsstatus', g.betriebsstatus),
    'pruefarten', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nr', pa.nr, 'bezeichnung', pa.bezeichnung, 'letzte_pruefung', pa.letzte_pruefung,
        'letzte_pruefung_herkunft', pa.letzte_pruefung_herkunft,
        'frist', case when pa.frist_monate is null then null else jsonb_build_object(
          'monate', pa.frist_monate, 'quelle', pa.frist_quelle, 'stufe', pa.frist_stufe, 'fundstelle', pa.frist_fundstelle) end
      ) order by pa.nr)
      from pa), '[]'::jsonb),
    'nachweise', coalesce((
      select jsonb_agg(jsonb_build_object(
        'pruefart_nr', pa.nr, 'pruefdatum', n.pruefdatum, 'ergebnis', n.ergebnis, 'erfasst_am', n.erfasst_am,
        'pruefer_name', n.pruefer_name
      ) order by n.pruefdatum desc, n.erfasst_am desc)
      from (select x.*, row_number() over (partition by x.geraet_pruefart_id order by x.pruefdatum desc, x.erfasst_am desc) as rang
            from public.nachweis x where x.geraet_id = g.id) n
      join pa on pa.id = n.geraet_pruefart_id
      where n.rang = 1), '[]'::jsonb),
    'anlaesse', coalesce((
      select jsonb_agg(jsonb_build_object(
        'pruefart_nr', pa.nr, 'datum', a.datum, 'erfasst_am', a.erfasst_am, 'aufgehoben_am', a.aufgehoben_am
      ) order by a.datum desc, a.erfasst_am desc)
      from public.anlass a
      join pa on pa.id = a.geraet_pruefart_id
      where a.geraet_id = g.id and a.aufgehoben_am is null
        and not app.anlass_erledigt(a.geraet_pruefart_id, a.datum, a.erfasst_am)), '[]'::jsonb),
    'offene_maengel', coalesce((
      select jsonb_agg(jsonb_build_object('schwere', m.schwere) order by m.schwere)
      from public.mangel m where m.geraet_id = g.id and m.status <> 'behoben'), '[]'::jsonb)
  )
  from public.geraet g where g.id = p_geraet;
$$;

-- Öffentliche QR-Seite (F-24): einzige Funktion für anon. null bei falschem Format, unbekanntem oder inaktivem Token.
-- p_organisation: aktuelle Organisation der Sitzung (anon: null). geraet_id und gleiche_organisation nur, wenn sie die
-- Geräte-Organisation ist UND der Aufrufer dort aktives Mitglied ist (Kurzansicht, Akte-Link). Geratene Werte helfen nicht.
-- Neue Signatur (zweiter Parameter mit Default) → alte Funktion ersetzen; Aufruf mit nur p_token bleibt gültig.
drop function public.geraet_oeffentlich(text);
create or replace function public.geraet_oeffentlich(p_token text, p_organisation uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_geraet uuid;
  v_org uuid;
  v_name text;
  v_json jsonb;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{22}$' then
    return null;
  end if;
  select t.geraet_id, o.id, o.name into v_geraet, v_org, v_name
  from public.geraet_token t
  join public.organisation o on o.id = t.organisation_id
  where t.token = p_token and t.aktiv;
  if v_geraet is null then
    return null;
  end if;
  v_json := app.geraet_status_json(v_geraet) || jsonb_build_object('organisation_name', v_name);
  if auth.uid() is not null and p_organisation = v_org and app.ist_mitglied(v_org) then
    v_json := v_json || jsonb_build_object('geraet_id', v_geraet, 'gleiche_organisation', true);
  end if;
  return v_json;
end;
$$;

-- Kurzansichten für Mitarbeiter (F-21, F-26, US-28) wie 20261128000000_inkrement3m.sql; zusätzlich geraet_id auf oberster
-- Ebene (das Status-JSON enthält keine IDs mehr). Aktive MA-Mitgliedschaft in p_org, sonst 42501.
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
        'geraet_id', g.id,
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
-- 2./3. Übernahmen: direkter SELECT nur auf offene Zeilen (F-27, US-32)
-- =====================================================================

-- MA: nur eigene offene; admin und sifa: offene der Organisation; VER: offene im Bereich; Prüfer: nichts.
-- Abgeschlossene Übernahmen liest niemand direkt – admin nur über uebernahmen_verlauf (ein Gerät, 90 Tage).
drop policy uebernahme_select on public.uebernahme;
create policy uebernahme_select on public.uebernahme
  for select to authenticated using (
    bis is null and (
      (benutzer_id = auth.uid() and app.ist_mitglied(organisation_id))
      or app.hat_rolle(organisation_id, array['admin', 'sifa'])
      or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id))
    )
  );

-- Verlauf eines Geräts für admin (uebernahmen.lesen): abgeschlossen, Person vorhanden, Ende innerhalb der letzten 90 Tage
-- (UEBERNAHME_AUFBEWAHRUNG_TAGE). Ohne beendet_von. Kein Parameter für Person, keine Liste über mehrere Geräte.
create or replace function public.uebernahmen_verlauf(p_geraet uuid)
returns table (id uuid, organisation_id uuid, geraet_id uuid, benutzer_id uuid, benutzer_name text,
               von timestamptz, bis timestamptz, ende_art text)
language sql stable security definer set search_path = public, pg_temp as $$
  select u.id, u.organisation_id, u.geraet_id, u.benutzer_id, u.benutzer_name, u.von, u.bis, u.ende_art
  from public.uebernahme u
  where u.geraet_id = p_geraet
    and app.hat_rolle(u.organisation_id, array['admin'])
    and u.bis is not null
    and u.bis > now() - interval '90 days'
    and u.pseudonymisiert_am is null
    and u.benutzer_id is not null
  order by u.bis desc, u.id;
$$;

-- =====================================================================
-- Pseudonymisierung: pg_cron nicht still überspringen (F-27, Gate G-5)
-- =====================================================================

-- Täglich 03:15 Europe/Berlin (Läufe 01:15 und 02:15 UTC, ausgeführt nur der Lauf um 03:xx Berlin), wie Inkrement I3M.
-- Supabase-Kontext erkannt an der Rolle supabase_admin. Prüfung: supabase/tests/cron_pseudonymisierung.test.sql.
do $do$
declare
  v_job constant text := 'readyloop_uebernahmen_pseudonymisieren';
  v_cmd constant text :=
    $job$select app.uebernahmen_pseudonymisieren() where extract(hour from now() at time zone 'Europe/Berlin') = 3$job$;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
  end if;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = v_job) then
      perform cron.schedule(v_job, '15 1,2 * * *', v_cmd);
    end if;
  elsif exists (select 1 from pg_roles where rolname = 'supabase_admin') then
    raise warning using
      message = 'READYLOOP F-27: pg_cron fehlt – abgeschlossene Übernahmen werden NICHT nach 90 Tagen pseudonymisiert.',
      hint = 'Supabase-Dashboard → Database → Extensions → pg_cron aktivieren, dann diese Migration erneut ausführen '
             || 'oder einmalig ausführen: select cron.schedule(' || quote_literal(v_job) || ', ''15 1,2 * * *'', '
             || quote_literal(v_cmd) || '); Kontrolle: supabase test db (cron_pseudonymisierung.test.sql muss grün sein).';
  else
    raise notice 'Readyloop: pg_cron nicht verfügbar (kein Supabase-Kontext) – Pseudonymisierung nur manuell über app.uebernahmen_pseudonymisieren().';
  end if;
end;
$do$;

-- =====================================================================
-- Ausführungsrechte (create or replace behält Rechte; hier ausdrücklich wiederholt)
-- =====================================================================

revoke execute on function app.geraet_status_json(uuid) from public, anon;
revoke execute on function public.ma_kurzansichten(uuid, text, text, uuid[]) from public, anon;
revoke execute on function public.uebernahmen_verlauf(uuid) from public, anon;
revoke execute on function public.geraet_oeffentlich(text, uuid) from public;

grant execute on function public.ma_kurzansichten(uuid, text, text, uuid[]), public.uebernahmen_verlauf(uuid) to authenticated;
grant execute on function public.geraet_oeffentlich(text, uuid) to anon, authenticated;
