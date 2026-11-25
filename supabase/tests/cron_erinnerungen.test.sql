-- pgTAP (Gate G-6): Erinnerungslauf per pg_cron + pg_net (F-36) und 90-Tage-Pseudonymisierung der MA-Hinweise (F-41)
-- sind eingeplant. Schlägt fehl, wenn pg_cron oder pg_net im Supabase-Projekt nicht aktiviert ist – dann meldet auch die
-- Migration 20261130000000_inkrement3.sql eine WARNING „READYLOOP F-36“ mit Anweisung. Ausführen mit `supabase test db`.
-- Vault-Secrets readyloop_cron_url und readyloop_cron_secret prüft der Test bewusst nicht inhaltlich (nur Vorhandensein).
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

select has_extension('pg_cron', 'pg_cron ist installiert');
select has_extension('pg_net', 'pg_net ist installiert');
select is(
  (select count(*) from cron.job where jobname = 'readyloop_erinnerungen' and active),
  1::bigint, 'genau ein aktiver Job readyloop_erinnerungen');
select is(
  (select schedule from cron.job where jobname = 'readyloop_erinnerungen'),
  '0 5 * * 1-5', 'Zeitplan Mo–Fr 05:00 UTC (06:00 MEZ / 07:00 MESZ)');
select matches(
  (select command from cron.job where jobname = 'readyloop_erinnerungen'),
  'app\.erinnerungen_ausloesen\(\)', 'Job ruft app.erinnerungen_ausloesen() auf');
select is(
  (select count(*) from cron.job where jobname = 'readyloop_erinnerungen_fortsetzung' and active),
  1::bigint, 'genau ein aktiver Job readyloop_erinnerungen_fortsetzung');
select is(
  (select schedule from cron.job where jobname = 'readyloop_erinnerungen_fortsetzung'),
  '20 5 * * 1-5', 'Fortsetzung Mo–Fr 05:20 UTC (nach Lauf mit Status teilweise, F-36)');
select matches(
  (select command from cron.job where jobname = 'readyloop_erinnerungen_fortsetzung'),
  'app\.erinnerungen_ausloesen\(\)', 'Fortsetzung ruft app.erinnerungen_ausloesen() auf');
select is(
  (select count(*) from cron.job where jobname = 'readyloop_mail_pseudonymisieren' and active),
  1::bigint, 'genau ein aktiver Job readyloop_mail_pseudonymisieren');
select is(
  (select schedule from cron.job where jobname = 'readyloop_mail_pseudonymisieren'),
  '20 1,2 * * *', 'Zeitplan 01:20 und 02:20 UTC (03:20 Europe/Berlin, Sommer- und Winterzeit)');
select matches(
  (select command from cron.job where jobname = 'readyloop_mail_pseudonymisieren'),
  'app\.mail_pseudonymisieren\(\)', 'Job ruft app.mail_pseudonymisieren() auf');
select is(
  (select count(*) from vault.decrypted_secrets where name in ('readyloop_cron_url', 'readyloop_cron_secret')),
  2::bigint, 'Vault-Secrets readyloop_cron_url und readyloop_cron_secret angelegt');
select ok(
  not has_function_privilege('authenticated', 'app.erinnerungen_ausloesen()', 'execute'),
  'Clients dürfen den Auslöser nicht selbst ausführen');
select ok(
  not has_function_privilege('authenticated', 'app.mail_pseudonymisieren()', 'execute'),
  'Clients dürfen die Pseudonymisierung nicht selbst ausführen');

select * from finish();
rollback;
