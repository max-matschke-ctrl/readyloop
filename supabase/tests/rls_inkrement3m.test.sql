-- pgTAP: RLS und security-definer-Funktionen Inkrement I3M (BE-19). Ausführen mit `supabase test db` (Gate G-5).
-- Lokal ohne pgTAP laufen dieselben Fälle (und mehr) über tests/sql/rls-szenario-i3m.sql (RL_TEST_PG).
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- Testdaten als Service (RLS umgangen)
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'adm@test.example'),
  ('33333333-3333-3333-3333-333333333333', 'ver@test.example'),
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ma@test.example');
insert into public.organisation (id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Testbetrieb');
insert into public.standort values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'Werk');
insert into public.bereich values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Lager', 'lager_logistik');
insert into public.mitgliedschaft (id, organisation_id, benutzer_id, anzeigename, rolle, aktiv) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111111', 'Admin', 'admin', true),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000a1', '33333333-3333-3333-3333-333333333333', 'VER Lager', 'verantwortlicher', true),
  ('00000000-0000-0000-0000-000000000d10', '00000000-0000-0000-0000-0000000000a1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Jonas Richter', 'mitarbeiter', true);
insert into public.bereich_verantwortung (organisation_id, mitgliedschaft_id, bereich_id) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c1');
insert into public.geraet (id, organisation_id, bereich_id, bezeichnung, geraetegruppe, kategorie) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Leiter', 'leiter', 'wechselnd'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Regal', 'regal', 'ortsgebunden'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Hubwagen', 'stapler', 'wechselnd');
insert into public.geraet_pruefart (id, organisation_id, geraet_id, bezeichnung, frist_monate, frist_quelle, frist_stufe,
  frist_fundstelle, frist_begruendung, letzte_pruefung, letzte_pruefung_herkunft) values
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e3', 'Hubwagen WP',
   12, 'gbu', 'C', 'GBU Lager', 'Begründung lang genug', current_date - 400, 'pruefbericht');
insert into public.uebernahme (organisation_id, geraet_id, benutzer_id, benutzer_name, von, bis, ende_art, beendet_von) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Jonas Richter',
   now() - interval '3 days', now() - interval '2 days', 'rueckgabe', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1');

-- Token als Service merken (anon darf geraet_token nicht lesen)
select set_config('rl.token_e1', (select token from public.geraet_token where geraet_id = '00000000-0000-0000-0000-0000000000e1' and aktiv), true);

-- Anonym
set local role anon;
set local request.jwt.claims = '{}';
select throws_ok($$select count(*) from public.geraet$$, '42501', null, 'anon liest geraet nicht');
select ok(
  public.geraet_oeffentlich(current_setting('rl.token_e1')) ->> 'organisation_name' = 'Testbetrieb',
  'anon: geraet_oeffentlich liefert die öffentliche Ansicht für einen aktiven Token');
reset role;
select ok(
  not (public.geraet_oeffentlich(current_setting('rl.token_e1'))::text
       ~ '"(zugeordnet_an|benutzer_name|erfasst_von_name)"'),
  'geraet_oeffentlich ohne Schlüssel zugeordnet_an, benutzer_name, erfasst_von_name');
set local role anon;
select is(public.geraet_oeffentlich('abc'), null, 'falsches Format → null');
select is(public.geraet_oeffentlich('AAAAAAAAAAAAAAAAAAAAAA'), null, 'unbekannter Token → null');
select throws_ok($$select public.ma_kurzansichten('00000000-0000-0000-0000-0000000000a1', 'meine', null, null)$$, '42501', null,
  'anon darf ma_kurzansichten nicht ausführen');

-- Mitarbeiter
set local role authenticated;
set local request.jwt.claims = '{"sub":"a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1","role":"authenticated"}';
select is((select count(*) from public.geraet), 0::bigint, 'MA sieht keine Zeile in geraet');
select is((select count(*) from public.mangel), 0::bigint, 'MA sieht keine Zeile in mangel');
select is((select count(*) from public.nachweis), 0::bigint, 'MA sieht keine Zeile in nachweis');
select throws_ok($$select public.uebernahme_starten('00000000-0000-0000-0000-0000000000e2')$$, '23514', null,
  'MA übernimmt ortsgebundenes Gerät → Fehler');
select throws_ok($$select public.uebernahme_starten('00000000-0000-0000-0000-0000000000e3')$$, '23514', null,
  'MA übernimmt überfälliges Gerät („nicht verwenden“) → Fehler');
select lives_ok($$select public.uebernahme_starten('00000000-0000-0000-0000-0000000000e1')$$, 'MA übernimmt wechselndes Gerät');
select throws_ok($$insert into public.mangel (organisation_id, geraet_id, beschreibung, schwere, termin, verantwortlich_id)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Mit Verantwortlichem', 'gering',
          current_date + 90, '11111111-1111-1111-1111-111111111111')$$, '42501', null, 'MA-Mangel mit verantwortlich_id → Fehler');

reset role;
select throws_ok($$insert into public.uebernahme (organisation_id, geraet_id, benutzer_id, benutzer_name)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', '11111111-1111-1111-1111-111111111111', 'Zweite')$$,
  '23505', null, 'zweite offene Übernahme desselben Geräts → Unique-Fehler');

-- Verantwortlicher Lager
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is((select count(*) from public.uebernahme where bis is not null), 0::bigint, 'VER Lager sieht abgeschlossene Übernahme nicht');
select throws_ok($$select public.mitglied_speichern('{"organisation_id":"00000000-0000-0000-0000-0000000000a1","benutzer_id":"11111111-1111-1111-1111-111111111111","anzeigename":"Chef","rolle":"verantwortlicher"}'::jsonb, '{}')$$,
  '42501', null, 'VER lädt verantwortlicher ein → Fehler');

-- Admin
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
-- Review I3M (20261129000000_review_i3m.sql): abgeschlossene Übernahmen nur über uebernahmen_verlauf (ein Gerät, 90 Tage)
select is((select count(*) from public.uebernahme where bis is not null), 0::bigint, 'ADM sieht abgeschlossene Übernahme nicht direkt');
select is((select count(*) from public.uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e1')), 1::bigint,
  'ADM sieht abgeschlossene Übernahme über uebernahmen_verlauf');
update public.mitgliedschaft set aktiv = false where id = '00000000-0000-0000-0000-000000000d10';
reset role;
select is((select ende_art from public.uebernahme where geraet_id = '00000000-0000-0000-0000-0000000000e1' and benutzer_id is not null order by von desc limit 1),
  'austritt', 'Deaktivieren eines MA beendet seine Übernahmen');

select * from finish();
rollback;
