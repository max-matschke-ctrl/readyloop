-- pgTAP (Gate G-5): Die 90-Tage-Pseudonymisierung abgeschlossener Übernahmen (F-27) ist als pg_cron-Job eingeplant.
-- Schlägt fehl, wenn pg_cron im Supabase-Projekt nicht aktiviert ist – dann meldet auch die Migration
-- 20261129000000_review_i3m.sql eine WARNING mit Anweisung. Ausführen mit `supabase test db`.
-- Unabhängig vom Job zeigt public.uebernahmen_verlauf nie Einträge älter als 90 Tage.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select has_extension('pg_cron', 'pg_cron ist installiert');
select has_table('cron', 'job', 'Tabelle cron.job vorhanden');
select is(
  (select count(*) from cron.job where jobname = 'readyloop_uebernahmen_pseudonymisieren' and active),
  1::bigint, 'genau ein aktiver Job readyloop_uebernahmen_pseudonymisieren');
select is(
  (select schedule from cron.job where jobname = 'readyloop_uebernahmen_pseudonymisieren'),
  '15 1,2 * * *', 'Zeitplan 01:15 und 02:15 UTC (03:15 Europe/Berlin, Sommer- und Winterzeit)');
select matches(
  (select command from cron.job where jobname = 'readyloop_uebernahmen_pseudonymisieren'),
  'app\.uebernahmen_pseudonymisieren\(\)', 'Job ruft app.uebernahmen_pseudonymisieren() auf');
select ok(
  not has_function_privilege('authenticated', 'app.uebernahmen_pseudonymisieren()', 'execute'),
  'Clients dürfen die Pseudonymisierung nicht selbst ausführen');

select * from finish();
rollback;
