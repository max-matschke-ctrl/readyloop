-- pgTAP: RLS Inkrement 2 (BE-9). Ausführen mit `supabase test db` gegen lokale Supabase (Gate G-5).
-- Im Agentenlauf nicht ausführbar (kein pgTAP/Docker); dieselben Fälle laufen lokal über
-- tests/sql/rls-szenario-i2.sql (RL_TEST_PG, nachgebaute Supabase-Umgebung).
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- Testdaten als Service (RLS umgangen)
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'adm@test.example'),
  ('33333333-3333-3333-3333-333333333333', 'ver@test.example'),
  ('44444444-4444-4444-4444-444444444444', 'prf@test.example'),
  ('88888888-8888-8888-8888-888888888888', 'alt@test.example');
insert into public.organisation (id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Testbetrieb');
insert into public.standort values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'Werk');
insert into public.bereich values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Lager', 'lager_logistik'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Produktion', 'werkstatt_fertigung');
insert into public.mitgliedschaft (id, organisation_id, benutzer_id, anzeigename, rolle, aktiv) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111111', 'Admin', 'admin', true),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000a1', '33333333-3333-3333-3333-333333333333', 'VER Lager', 'verantwortlicher', true),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000a1', '44444444-4444-4444-4444-444444444444', 'Prüfer', 'pruefer', true),
  ('00000000-0000-0000-0000-0000000000d8', '00000000-0000-0000-0000-0000000000a1', '88888888-8888-8888-8888-888888888888', 'Ehemalig', 'sifa', false);
insert into public.bereich_verantwortung (organisation_id, mitgliedschaft_id, bereich_id) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c1');
insert into public.geraet (id, organisation_id, bereich_id, bezeichnung, geraetegruppe, kategorie) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Stapler', 'flurfoerderzeug', 'wechselnd'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2', 'Kran', 'kran_kraftbetrieben', 'ortsgebunden');
insert into public.geraet_pruefart (id, organisation_id, geraet_id, bezeichnung, zugewiesener_pruefer_id) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Stapler WP', null),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e2', 'Kran WP', '44444444-4444-4444-4444-444444444444'),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e2', 'Kran Elektro', null);
insert into public.mangel (id, organisation_id, geraet_id, geraet_pruefart_id, beschreibung, schwere, termin) values
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f2', 'Kranmangel', 'gering', current_date + 30),
  ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f3', 'Elektromangel', 'gering', current_date + 30),
  ('00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', null, 'Lagermangel', 'gering', current_date + 30);

set local role authenticated;

set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select results_eq($$select id from public.mangel$$, $$values ('00000000-0000-0000-0000-000000000b03'::uuid)$$,
  'VER Lager sieht keine Produktion-Mängel');
select throws_ok($$select public.geraet_verschieben('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c2', null)$$,
  '42501', null, 'VER kann Gerät nicht in fremden Bereich verschieben');

set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
select results_eq($$select id from public.mangel$$, $$values ('00000000-0000-0000-0000-000000000b01'::uuid)$$,
  'Prüfer sieht nur Mängel zugewiesener Prüfarten');

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$update public.geraet_pruefart set frist_monate = 6, frist_quelle = 'gbu', frist_stufe = 'C',
  frist_fundstelle = 'GBU', frist_begruendung = 'Begründung lang genug' where id = '00000000-0000-0000-0000-0000000000f1'$$,
  '42501', null, 'Admin kann keine Frist setzen');
select throws_ok($$update public.mitgliedschaft set aktiv = false where id = '00000000-0000-0000-0000-0000000000d1'$$,
  '23514', null, 'Eigene Mitgliedschaft nicht deaktivierbar');
select lives_ok($$update public.mangel set status = 'behoben', behoben_am = current_date, behoben_durch = 'Firma',
  behebung = 'Ersetzt' where id = '00000000-0000-0000-0000-000000000b01'$$, 'Admin behebt Mangel');
select throws_ok($$update public.mangel set status = 'offen' where id = '00000000-0000-0000-0000-000000000b01'$$,
  '23514', null, 'Mangel behoben → offen scheitert');

set local request.jwt.claims = '{"sub":"88888888-8888-8888-8888-888888888888","role":"authenticated"}';
select is((select count(*) from public.geraet), 0::bigint, 'Deaktiviertes Mitglied sieht nichts');

reset role;
set local request.jwt.claims = '{}';
select throws_ok($$update public.mitgliedschaft set aktiv = false where id = '00000000-0000-0000-0000-0000000000d1'$$,
  '23514', null, 'Letzter aktiver Admin nicht deaktivierbar');

select * from finish();
rollback;
