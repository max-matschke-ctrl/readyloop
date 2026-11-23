-- pgTAP (Gate G-5): Review-Befunde I3M (20261129000000_review_i3m.sql). Lokal ohne pgTAP: tests/sql/rls-szenario-i3m.sql.
-- F-24: öffentliche Ansicht ohne interne IDs; F-27/US-32: abgeschlossene Übernahmen nur per uebernahmen_verlauf (ADM,
-- ein Gerät, 90 Tage); MA sieht nur eigene offene Übernahmen.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'adm@test.example'),
  ('33333333-3333-3333-3333-333333333333', 'ver@test.example'),
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ma1@test.example'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'ma2@test.example');
insert into public.organisation (id, name) values
  ('00000000-0000-0000-0000-0000000000a1', 'Testbetrieb'), ('00000000-0000-0000-0000-0000000000a2', 'Anderer Betrieb');
insert into public.standort values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'Werk');
insert into public.bereich values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Lager', 'lager_logistik');
insert into public.mitgliedschaft (id, organisation_id, benutzer_id, anzeigename, rolle, aktiv) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111111', 'Admin', 'admin', true),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000a1', '33333333-3333-3333-3333-333333333333', 'VER Lager', 'verantwortlicher', true),
  ('00000000-0000-0000-0000-000000000d10', '00000000-0000-0000-0000-0000000000a1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Jonas Richter', 'mitarbeiter', true),
  ('00000000-0000-0000-0000-000000000d11', '00000000-0000-0000-0000-0000000000a1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Aylin Demir', 'mitarbeiter', true);
insert into public.bereich_verantwortung (organisation_id, mitgliedschaft_id, bereich_id) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c1');
insert into public.geraet (id, organisation_id, bereich_id, bezeichnung, geraetegruppe, kategorie) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Leiter', 'leiter', 'wechselnd');
insert into public.geraet_pruefart (id, organisation_id, geraet_id, bezeichnung, frist_monate, frist_quelle, frist_stufe,
  frist_fundstelle, frist_begruendung, letzte_pruefung, letzte_pruefung_herkunft) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Leiterprüfung',
   12, 'gbu', 'C', 'GBU Lager', 'Begründung lang genug', current_date - 30, 'pruefbericht');
-- Abgeschlossen vor 2 Tagen (Jonas → Übergabe an Aylin, beendet_von = Aylin), vor 100 Tagen (nicht pseudonymisiert), Aylin offen
insert into public.uebernahme (id, organisation_id, geraet_id, benutzer_id, benutzer_name, von, bis, ende_art, beendet_von) values
  ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1',
   'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Jonas Richter', now() - interval '101 days', now() - interval '100 days', 'rueckgabe',
   'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1',
   'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Jonas Richter', now() - interval '3 days', now() - interval '2 days', 'uebergabe',
   'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'),
  ('00000000-0000-0000-0000-000000000903', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1',
   'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Aylin Demir', now() - interval '2 days', null, null, null);
select set_config('rl.token_e1', (select token from public.geraet_token where geraet_id = '00000000-0000-0000-0000-0000000000e1' and aktiv), true);

-- Anonym: keine UUID im gesamten JSON, auch nicht mit geratener Organisation
set local role anon;
set local request.jwt.claims = '{}';
select ok(public.geraet_oeffentlich(current_setting('rl.token_e1')) is not null, 'anon: öffentliche Ansicht vorhanden');
select ok(
  public.geraet_oeffentlich(current_setting('rl.token_e1'))::text
    !~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
  'anon: JSON enthält keine UUID');
select ok(
  public.geraet_oeffentlich(current_setting('rl.token_e1'), '00000000-0000-0000-0000-0000000000a1')::text
    !~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
  'anon mit geratener Organisation: JSON enthält keine UUID');
select throws_ok($$select count(*) from public.uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e1')$$, '42501', null,
  'anon darf uebernahmen_verlauf nicht ausführen');

-- Admin
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is(public.geraet_oeffentlich(current_setting('rl.token_e1'), '00000000-0000-0000-0000-0000000000a1') ->> 'geraet_id',
  '00000000-0000-0000-0000-0000000000e1', 'Mitglied der aktuellen Organisation erhält geraet_id');
select ok(public.geraet_oeffentlich(current_setting('rl.token_e1'), '00000000-0000-0000-0000-0000000000a2') -> 'geraet_id' is null,
  'andere aktuelle Organisation: keine geraet_id');
select is((select count(*) from public.uebernahme where bis is not null), 0::bigint, 'ADM: kein direkter SELECT auf abgeschlossene Übernahmen');
select is((select count(*) from public.uebernahme where bis is null), 1::bigint, 'ADM sieht die offene Übernahme');
select results_eq(
  $$select id, benutzer_name, ende_art from public.uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e1')$$,
  $$values ('00000000-0000-0000-0000-000000000902'::uuid, 'Jonas Richter'::text, 'uebergabe'::text)$$,
  'ADM-Verlauf: nur ≤ 90 Tage, auch ohne Pseudonymisierungslauf');

-- Verantwortlicher: Verlauf leer
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is((select count(*) from public.uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e1')), 0::bigint, 'VER: Verlauf leer');

-- Mitarbeiter: nur eigene offene Zeilen
set local request.jwt.claims = '{"sub":"a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1","role":"authenticated"}';
select is((select count(*) from public.uebernahme), 0::bigint, 'MA Jonas sieht eigene abgeschlossene Übernahmen nicht (kein beendet_von)');
select is((select count(*) from public.uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e1')), 0::bigint, 'MA: Verlauf leer');
set local request.jwt.claims = '{"sub":"a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2","role":"authenticated"}';
select results_eq($$select id from public.uebernahme$$, $$values ('00000000-0000-0000-0000-000000000903'::uuid)$$,
  'MA Aylin sieht nur ihre offene Übernahme');
select ok(
  public.geraet_oeffentlich(current_setting('rl.token_e1'), '00000000-0000-0000-0000-0000000000a1') ->> 'geraet_id' is not null,
  'MA derselben Organisation erhält geraet_id (Kurzansicht)');

select * from finish();
rollback;
