-- Readyloop Inkrement 2: Review-Befunde (Backend). Bestehende Migrationen bleiben unverändert.
--   Befund 1/3: F-10 – Nachweis am Anlasstag erledigt nur, wenn er nach dem Anlass erfasst wurde; Aufheben eines
--               bereits erledigten Anlasses wird abgelehnt (app.anlass_erledigt, app.anlass_pruefen).
--   Befund 4:   mangel_insert – Sifa und Verantwortliche müssen verantwortlich_id setzen (F-14).
--   Befund 5:   mitgliedschaft.email nur für Admins lesbar (Spaltenrechte + public.mitglied_emails); E-Mail ist nach
--               dem Anlegen nicht mehr änderbar (F-17: Ändern betrifft Name, Rolle, Bereiche, Typen, aktiv).

-- =====================================================================
-- Befund 1/3: Anlass erledigt (F-10), gespiegelt in src/domain/anlass.ts (nachweisErledigtAnlass)
-- =====================================================================

create or replace function app.anlass_erledigt(p_pruefart uuid, p_datum date, p_erfasst_am timestamptz)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.nachweis n
    where n.geraet_pruefart_id = p_pruefart
      and n.ergebnis in ('ohne_maengel', 'maengel_weiterbetrieb')
      and (n.pruefdatum > p_datum or (n.pruefdatum = p_datum and n.erfasst_am > p_erfasst_am))
  );
$$;

revoke all on function app.anlass_erledigt(uuid, date, timestamptz) from public;

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

  -- UPDATE: nur einmaliges Aufheben eines OFFENEN Anlasses mit Begründung (Q-25); alles andere unveränderlich.
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
  if app.anlass_erledigt(old.geraet_pruefart_id, old.datum, old.erfasst_am) then
    raise exception 'Anlass ist bereits durch einen bestandenen Nachweis erledigt' using errcode = '23514';
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

-- =====================================================================
-- Befund 4: mangel_insert – Sifa/VER mit Verantwortlichem, Prüfer ohne
-- =====================================================================

drop policy mangel_insert on public.mangel;
create policy mangel_insert on public.mangel
  for insert to authenticated with check (
    (app.hat_rolle(organisation_id, array['sifa']) and verantwortlich_id is not null)
    or (app.hat_rolle(organisation_id, array['verantwortlicher']) and app.verantwortet_geraet(geraet_id)
        and verantwortlich_id is not null)
    or (geraet_pruefart_id is not null and app.ist_zugewiesen(geraet_pruefart_id) and verantwortlich_id is null)
  );

-- =====================================================================
-- Befund 5: mitgliedschaft.email nur für Admins
-- =====================================================================

-- Spaltenrechte: alle Spalten außer email für Mitglieder lesbar (RLS mitgliedschaft_select bleibt).
revoke select on public.mitgliedschaft from authenticated;
grant select (id, organisation_id, benutzer_id, anzeigename, rolle, angelegt_am, aktiv, pruefer_typen)
  on public.mitgliedschaft to authenticated;
-- E-Mail wird nur beim Anlegen gesetzt (Einladung), nicht mehr geändert.
revoke update (email) on public.mitgliedschaft from authenticated;

-- E-Mail-Adressen der Mitglieder: nur für aktive Admins der Organisation (sonst leere Menge).
create or replace function public.mitglied_emails(p_organisation uuid)
returns table (benutzer_id uuid, email text)
language sql stable security definer set search_path = public, pg_temp as $$
  select m.benutzer_id, m.email
  from public.mitgliedschaft m
  where m.organisation_id = p_organisation
    and app.hat_rolle(p_organisation, array['admin']);
$$;

revoke all on function public.mitglied_emails(uuid) from public, anon;
grant execute on function public.mitglied_emails(uuid) to authenticated;

-- mitglied_speichern ohne E-Mail-Update (sonst unverändert gegenüber 20261126000000_inkrement2.sql).
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
