-- pgTAP: RLS, System-RPCs und Unveränderlichkeit Inkrement I3 (BE-27). Ausführen mit `supabase test db` (Gate G-5/G-6).
-- Lokal ohne pgTAP laufen dieselben Fälle (und mehr) über tests/sql/rls-szenario-i3.sql (RL_TEST_PG).
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- Testdaten als Service (RLS umgangen)
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'adm@test.example'),
  ('22222222-2222-2222-2222-222222222222', 'sif@test.example'),
  ('33333333-3333-3333-3333-333333333333', 'ver@test.example'),
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ma1@test.example'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'ma2@test.example');
insert into public.organisation (id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Testbetrieb');
insert into public.standort values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'Werk');
insert into public.bereich values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Lager', 'lager_logistik'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Produktion', 'werkstatt_fertigung'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'Versand', 'lager_logistik');
insert into public.mitgliedschaft (id, organisation_id, benutzer_id, anzeigename, rolle, aktiv) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111111', 'Admin', 'admin', true),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000a1', '22222222-2222-2222-2222-222222222222', 'Sifa', 'sifa', true),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000a1', '33333333-3333-3333-3333-333333333333', 'VER Lager', 'verantwortlicher', true),
  ('00000000-0000-0000-0000-000000000d10', '00000000-0000-0000-0000-0000000000a1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Jonas Richter', 'mitarbeiter', true),
  ('00000000-0000-0000-0000-000000000d11', '00000000-0000-0000-0000-0000000000a1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Aylin Demir', 'mitarbeiter', true);
insert into public.bereich_verantwortung (organisation_id, mitgliedschaft_id, bereich_id) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c1');
insert into public.geraet (id, organisation_id, bereich_id, bezeichnung, geraetegruppe, kategorie) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Hubwagen', 'stapler', 'wechselnd');
insert into public.geraet_pruefart (id, organisation_id, geraet_id, bezeichnung) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Hubwagen WP');
insert into public.erinnerung_einstellung (bereich_id, organisation_id) values
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1');
insert into public.mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet) values
  ('00000000-0000-0000-0000-0000000000a1', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'ma_hinweis', true);

-- Admin speichert Lager → Ereignis
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok($$insert into public.erinnerung_einstellung (bereich_id, organisation_id, staffel_tage)
  values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', '{60,30}')$$, 'ADM speichert Einstellung Lager');
select is((select count(*) from public.ereignis where typ = 'erinnerung_einstellung_gespeichert'
           and daten ->> 'bereichId' = '00000000-0000-0000-0000-0000000000c1'), 1::bigint, 'ADM-Speichern erzeugt Ereignis');
select throws_ok($$update public.erinnerung_einstellung set sifa_empfaenger = '{33333333-3333-3333-3333-333333333333}'
  where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$, '23514', null, 'SIF-Auswahl mit VER-ID → 23514');
select throws_ok($$update public.erinnerung_einstellung set staffel_tage = '{30,60}'
  where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$, '23514', null, 'Staffel aufsteigend → Check-Fehler');

-- Sifa
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok($$insert into public.erinnerung_einstellung (bereich_id, organisation_id)
  values ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a1')$$, '42501', null, 'SIF schreibt Einstellung → Fehler');
select is((select count(*) from public.erinnerung_einstellung), 2::bigint, 'SIF liest Einstellungen aller Bereiche');

-- Verantwortlicher Lager
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select results_eq($$select bereich_id from public.erinnerung_einstellung$$,
  $$values ('00000000-0000-0000-0000-0000000000c1'::uuid)$$, 'VER liest eigene Bereichs-Einstellung, nicht fremde');
select throws_ok($$select count(*) from public.mail_versand$$, '42501', null, 'authenticated liest mail_versand nicht direkt');
select throws_ok($$select public.mail_protokoll('00000000-0000-0000-0000-0000000000a1', current_date - 30, current_date)$$,
  '42501', null, 'mail_protokoll als VER → 42501');
select throws_ok($$select public.erinnerung_lauf_starten(current_date, 'manuell', true)$$, '42501', null,
  'authenticated darf keinen Lauf starten');

-- Mitarbeiter Jonas
set local request.jwt.claims = '{"sub":"a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1","role":"authenticated"}';
select lives_ok($$insert into public.mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet)
  values ('00000000-0000-0000-0000-0000000000a1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ma_hinweis', true)$$, 'MA bestellt ma_hinweis ab');
select results_eq($$select benutzer_id from public.mail_abmeldung$$,
  $$values ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'::uuid)$$, 'MA liest eigene Abmeldung, nicht fremde');
select throws_ok($$insert into public.mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet)
  values ('00000000-0000-0000-0000-0000000000a1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'pruefer_woche', true)$$, '42501', null,
  'MA bestellt fremde Mailart ab → Fehler');

-- Service: Lauf, Reservierung, Status
reset role;
set local role service_role;
select is(public.erinnerung_lauf_starten('2026-11-30', 'pg_cron', false) ->> 'ergebnis', 'gestartet', 'Lauf startet');
select set_config('rl.lauf', (select id::text from public.erinnerung_lauf where lauf_datum = '2026-11-30' and status = 'laeuft'), true);
select ok(public.erinnerung_versand_reservieren(
  jsonb_build_object('id', '00000000-0000-0000-0000-00000000f001', 'organisation_id', '00000000-0000-0000-0000-0000000000a1',
    'lauf_id', current_setting('rl.lauf'), 'lauf_datum', '2026-11-30', 'art', 'ma_hinweis',
    'empfaenger_benutzer_id', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  jsonb_build_array(jsonb_build_object('schluessel', 'ma:e1:ueberfaellig:2026-11-01:a1', 'art', 'ma_hinweis', 'stufe', 'nicht_verwenden',
    'geraet_id', '00000000-0000-0000-0000-0000000000e1', 'bereich_id', '00000000-0000-0000-0000-0000000000c1', 'rolle', 'zustaendig'))),
  'Reservierung MA-Hinweis');
select ok(not public.erinnerung_versand_reservieren(
  jsonb_build_object('organisation_id', '00000000-0000-0000-0000-0000000000a1', 'lauf_id', current_setting('rl.lauf'),
    'lauf_datum', '2026-11-30', 'art', 'ma_hinweis', 'empfaenger_benutzer_id', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
  jsonb_build_array(jsonb_build_object('schluessel', 'x', 'art', 'ma_hinweis', 'stufe', 'nicht_verwenden',
    'geraet_id', '00000000-0000-0000-0000-0000000000e1', 'bereich_id', '00000000-0000-0000-0000-0000000000c1', 'rolle', 'zustaendig'))),
  'zweite Reservierung gleicher Empfänger/Tag → false');
select lives_ok($$select public.erinnerung_versand_status('00000000-0000-0000-0000-00000000f001', 'versendet', 1, 'resend-1', null)$$,
  'vorbereitet → versendet');
select ok(public.erinnerung_status_per_anbieter('resend-1', 'bounce'), 'Webhook: Bounce per Anbieter-ID');
select throws_ok($$select public.erinnerung_versand_status('00000000-0000-0000-0000-00000000f001', 'vorbereitet', 1, null, null)$$,
  '42501', null, 'Status bounce → vorbereitet → Fehler');
select throws_ok($$delete from public.mail_versand$$, '42501', null, 'DELETE auf mail_versand → Fehler (auch Service)');
reset role;
select throws_ok($$update public.erinnerung_posten set schluessel = 'manipuliert'$$, '42501', null, 'Posten-UPDATE schluessel → Fehler');

-- Sifa: Protokoll maskiert MA-Hinweise ohne Problem-Status
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is(
  (select count(*) from jsonb_array_elements(public.mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31') -> 'posten')),
  0::bigint, 'SIF: MA-Hinweis ohne Posten im Protokoll');

select * from finish();
rollback;
