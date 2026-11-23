-- Szenario Inkrement I3 (E-Mail-Erinnerungen) für tests/migration.test.ts (läuft nach den Szenarien I1, I2, I3M).
-- Jede Zeile: "<Fall> (erw. <Erwartung>): <Ergebnis>". Spiegelt supabase/tests/rls_inkrement3.test.sql (pgTAP, Gate G-5/G-6).
\set ON_ERROR_STOP 1
reset role;
set request.jwt.claim.sub = '';
\pset tuples_only on
\pset format unaligned
create or replace function public.c(sql text) returns text language plpgsql as $$
begin
  execute sql; return 'OK';
exception when others then return sqlstate;
end $$;
grant execute on function public.t(text), public.q(text), public.c(text) to service_role, authenticated;

-- Kürzel (Stand nach den vorigen Szenarien): Org A a1 (Lager c1, Produktion c2), Org B a2 (Werkstatt c3).
-- a1: ADM Katrin 1111; SIF Jens 2222, Ole a2a2 (zur Sifa gewechselt), Admin Zwei 5555 (zur Sifa gewechselt);
--     VER Marco 3333 (Lager), VER 9999; PRF Tobias 4444, Paul 6666; PRF bbbb und VER 8888 inaktiv; MA Jonas a1a1 inaktiv.
--     Neu hier: MA Mia c1c1, MA Ole c2c2. a2: Admin B 7777.
-- Geräte a1: e3 Leiter (Lager, Prüfart f7), e4 Hubwagen (Lager, f8), e2 Kran (Produktion, f2). Gerät a2: e7 Flex (Werkstatt, neu f0b1).
insert into auth.users values ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','mia'),('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2','ole');
insert into mitgliedschaft (id, organisation_id, benutzer_id, anzeigename, email, rolle) values
 ('00000000-0000-0000-0000-000000000d21','00000000-0000-0000-0000-0000000000a1','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','Mia Muster','mia@example.org','mitarbeiter'),
 ('00000000-0000-0000-0000-000000000d22','00000000-0000-0000-0000-0000000000a1','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2','Ole Beispiel','ole@example.org','mitarbeiter');
insert into geraet_pruefart (id, organisation_id, geraet_id, bezeichnung) values
 ('00000000-0000-0000-0000-00000000f0b1','00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000e7','Elektroprüfung');

\echo '== Struktur'
select 'RLS an auf allen fünf Tabellen (erw. erinnerung_einstellung,erinnerung_lauf,erinnerung_posten,mail_abmeldung,mail_versand): ' || q($$select relname from pg_class where relnamespace = 'public'::regnamespace and relname in ('erinnerung_einstellung','mail_abmeldung','erinnerung_lauf','mail_versand','erinnerung_posten') and relrowsecurity$$);
select 'Keine Policies auf Versand/Posten/Lauf (erw. 0): ' || q($$select count(*) from pg_policies where tablename in ('mail_versand','erinnerung_posten','erinnerung_lauf')$$);
select 'Keine DELETE-Policy auf I3-Tabellen (erw. 0): ' || q($$select count(*) from pg_policies where tablename in ('erinnerung_einstellung','mail_abmeldung','mail_versand','erinnerung_posten','erinnerung_lauf') and cmd in ('DELETE','ALL')$$);
select 'authenticated darf System-RPCs nicht ausführen (erw. false): ' || q($$select bool_or(has_function_privilege('authenticated', p.oid, 'execute')) from pg_proc p where p.proname in ('erinnerung_lauf_starten','erinnerung_lauf_beenden','erinnerung_versand_reservieren','erinnerung_versand_status','erinnerung_status_per_anbieter','mail_abmelden_system','mail_pseudonymisieren','erinnerungen_ausloesen')$$);
select 'service_role darf System-RPCs ausführen (erw. true): ' || q($$select bool_and(has_function_privilege('service_role', p.oid, 'execute')) from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('erinnerung_lauf_starten','erinnerung_lauf_beenden','erinnerung_versand_reservieren','erinnerung_versand_status','erinnerung_status_per_anbieter','mail_abmelden_system')$$);
select 'anon darf mail_protokoll nicht (erw. false): ' || has_function_privilege('anon', 'public.mail_protokoll(uuid, date, date, text, text, uuid, int, int)', 'execute')::text;
select 'service_role schreibt Versand nicht direkt (erw. false|true): ' || has_table_privilege('service_role', 'public.mail_versand', 'insert')::text || '|' || has_table_privilege('service_role', 'public.mail_versand', 'select')::text;

\echo '== Einstellungen (F-39, F-42)'
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'ADM speichert Lager (erw. OK 1): ' || t($$insert into erinnerung_einstellung (bereich_id, organisation_id, staffel_tage, eskalation_verantwortlicher, eskalation_sifa, eskalation_admin, sifa_in_kopie, admin_empfaenger) values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a1','{60,30,14}',0,3,10,false,'{11111111-1111-1111-1111-111111111111}')$$);
select 'ADM: Stempel aus der DB (erw. 11111111-1111-1111-1111-111111111111|Katrin): ' || q($$select geaendert_von || '|' || geaendert_von_name from erinnerung_einstellung where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'ADM: Ereignis mit alt=null und neu (erw. Lager|null|[60, 30, 14]|10|false): ' || q($$select daten ->> 'bereich' || '|' || coalesce(daten ->> 'alt', 'null') || '|' || (daten -> 'neu' -> 'staffelTage')::text || '|' || (daten -> 'neu' -> 'eskalationTage' ->> 'admin') || '|' || (daten -> 'neu' ->> 'standard') from ereignis where typ = 'erinnerung_einstellung_gespeichert' and geraet_id is null order by zeitpunkt desc limit 1$$);
select 'ADM ändert → Ereignis mit alt (erw. OK 1): ' || t($$update erinnerung_einstellung set staffel_tage = '{90,60,30}', eskalation_sifa = 7, eskalation_admin = 14, sifa_in_kopie = true, admin_empfaenger = null where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'Ereignisse Lager (erw. 2|true): ' || q($$select count(*) || '|' || bool_or((daten -> 'alt' ->> 'sifaInKopie') = 'false' and (daten -> 'neu' ->> 'standard') = 'true') from ereignis where typ = 'erinnerung_einstellung_gespeichert'$$);
select 'Staffel aufsteigend (erw. FEHLER): ' || t($$update erinnerung_einstellung set staffel_tage = '{30,60}' where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'Staffel 4 Werte (erw. FEHLER): ' || t($$update erinnerung_einstellung set staffel_tage = '{90,60,30,7}' where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'Staffel 366 (erw. FEHLER): ' || t($$update erinnerung_einstellung set staffel_tage = '{366}' where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'Staffel leer (erw. FEHLER): ' || t($$update erinnerung_einstellung set staffel_tage = '{}' where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'Eskalation SIF < VER (erw. FEHLER): ' || t($$update erinnerung_einstellung set eskalation_verantwortlicher = 5, eskalation_sifa = 3 where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'Eskalation > 90 (erw. FEHLER): ' || t($$update erinnerung_einstellung set eskalation_admin = 91 where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'SIF-Auswahl mit VER-ID (erw. FEHLER): ' || t($$update erinnerung_einstellung set sifa_empfaenger = '{33333333-3333-3333-3333-333333333333}' where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'SIF-Auswahl Fehlercode (erw. 23514): ' || c($$update erinnerung_einstellung set sifa_empfaenger = '{33333333-3333-3333-3333-333333333333}' where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'ADM-Auswahl mit Admin anderer Organisation (erw. FEHLER): ' || t($$update erinnerung_einstellung set admin_empfaenger = '{77777777-7777-7777-7777-777777777777}' where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'ADM-Auswahl mit inaktivem Mitglied (erw. FEHLER): ' || t($$update erinnerung_einstellung set sifa_empfaenger = '{88888888-8888-8888-8888-888888888888}' where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'Bereich der Einstellung ändern (erw. FEHLER): ' || t($$update erinnerung_einstellung set bereich_id = '00000000-0000-0000-0000-0000000000c2' where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'ADM fremder Bereich (Org B) (erw. FEHLER): ' || t($$insert into erinnerung_einstellung (bereich_id, organisation_id) values ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000a2')$$);
select 'Bereich mit fremder Organisation kombiniert (erw. FEHLER): ' || t($$insert into erinnerung_einstellung (bereich_id, organisation_id) values ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000a1')$$);
select 'ADM speichert Produktion (erw. OK 1): ' || t($$insert into erinnerung_einstellung (bereich_id, organisation_id, sifa_empfaenger) values ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000a1','{22222222-2222-2222-2222-222222222222}')$$);
select 'ADM löscht Einstellung (erw. FEHLER): ' || t($$delete from erinnerung_einstellung where bereich_id = '00000000-0000-0000-0000-0000000000c2'$$);
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'SIF liest alle Einstellungen (erw. 2): ' || q($$select count(*) from erinnerung_einstellung$$);
select 'SIF ändert Einstellung: RLS lässt keine Zeile zu (erw. OK 0): ' || t($$update erinnerung_einstellung set sifa_in_kopie = false where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'SIF-Änderung wirkungslos (erw. true): ' || q($$select sifa_in_kopie from erinnerung_einstellung where bereich_id = '00000000-0000-0000-0000-0000000000c1'$$);
select 'SIF fügt Einstellung ein (erw. FEHLER): ' || t($$insert into erinnerung_einstellung (bereich_id, organisation_id) values ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000a2')$$);
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER liest eigene Bereichs-Einstellung, nicht fremde (erw. 00000000-0000-0000-0000-0000000000c1): ' || q($$select bereich_id from erinnerung_einstellung$$);
select 'VER schreibt Einstellung (erw. OK 0): ' || t($$update erinnerung_einstellung set sifa_in_kopie = false$$);
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 'PRF liest Einstellungen (erw. 0): ' || q($$select count(*) from erinnerung_einstellung$$);
set request.jwt.claim.sub = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';
select 'MA liest Einstellungen (erw. 0): ' || q($$select count(*) from erinnerung_einstellung$$);
set request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';
select 'Admin B liest Einstellungen Org A (erw. 0): ' || q($$select count(*) from erinnerung_einstellung$$);

\echo '== Abmeldung (F-40)'
set request.jwt.claim.sub = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';
select 'MA meldet ma_hinweis ab (erw. OK 1): ' || t($$insert into mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet) values ('00000000-0000-0000-0000-0000000000a1','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','ma_hinweis',true)$$);
select 'MA Upsert wieder an (erw. OK 1): ' || t($$insert into mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet) values ('00000000-0000-0000-0000-0000000000a1','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','ma_hinweis',false) on conflict (organisation_id, benutzer_id, art) do update set abgemeldet = excluded.abgemeldet$$);
select 'MA meldet pruefer_woche ab (falsche Art) (erw. FEHLER): ' || t($$insert into mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet) values ('00000000-0000-0000-0000-0000000000a1','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','pruefer_woche',true)$$);
select 'MA meldet frist_digest ab (erw. FEHLER): ' || t($$insert into mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet) values ('00000000-0000-0000-0000-0000000000a1','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','frist_digest',true)$$);
select 'MA meldet Ole ab (erw. FEHLER): ' || t($$insert into mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet) values ('00000000-0000-0000-0000-0000000000a1','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2','ma_hinweis',true)$$);
select 'MA löscht Abmeldung (erw. FEHLER): ' || t($$delete from mail_abmeldung$$);
set request.jwt.claim.sub = 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2';
select 'Ole meldet ab (erw. OK 1): ' || t($$insert into mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet) values ('00000000-0000-0000-0000-0000000000a1','c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2','ma_hinweis',true)$$);
select 'Ole liest nur eigene Abmeldung (erw. c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2): ' || q($$select benutzer_id from mail_abmeldung$$);
select 'Ole ändert Mias Abmeldung (erw. OK 0): ' || t($$update mail_abmeldung set abgemeldet = true where benutzer_id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'$$);
select 'Ole schiebt eigene Zeile auf Mia (erw. FEHLER): ' || t($$update mail_abmeldung set benutzer_id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'$$);
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 'PRF meldet pruefer_woche ab (erw. OK 1): ' || t($$insert into mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet) values ('00000000-0000-0000-0000-0000000000a1','44444444-4444-4444-4444-444444444444','pruefer_woche',true)$$);
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'SIF liest keine fremden Abmeldungen (erw. 0): ' || q($$select count(*) from mail_abmeldung$$);
select 'SIF meldet ma_hinweis ab (erw. FEHLER): ' || t($$insert into mail_abmeldung (organisation_id, benutzer_id, art, abgemeldet) values ('00000000-0000-0000-0000-0000000000a1','22222222-2222-2222-2222-222222222222','ma_hinweis',true)$$);

\echo '== Direkter Zugriff auf das Protokoll'
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'authenticated liest mail_versand direkt (erw. FEHLER): ' || t($$select * from mail_versand$$);
select 'authenticated liest erinnerung_posten direkt (erw. FEHLER): ' || t($$select * from erinnerung_posten$$);
select 'authenticated liest erinnerung_lauf direkt (erw. FEHLER): ' || t($$select * from erinnerung_lauf$$);
select 'authenticated startet Lauf (erw. FEHLER): ' || t($$select erinnerung_lauf_starten(current_date, 'manuell', true)$$);
select 'authenticated reserviert Versand (erw. FEHLER): ' || t($$select erinnerung_versand_reservieren('{}'::jsonb, '[]'::jsonb)$$);
select 'authenticated Abmeldung per System-RPC (erw. FEHLER): ' || t($$select mail_abmelden_system('00000000-0000-0000-0000-0000000000a1','44444444-4444-4444-4444-444444444444','pruefer_woche',false)$$);
reset role;
set role anon;
set request.jwt.claim.sub = '';
select 'anon mail_protokoll (erw. FEHLER): ' || t($$select mail_protokoll('00000000-0000-0000-0000-0000000000a1', current_date - 30, current_date)$$);
select 'anon erinnerung_lauf_starten (erw. FEHLER): ' || t($$select erinnerung_lauf_starten(current_date, 'manuell', true)$$);

\echo '== Lauf-Sperre (F-36): Idempotenz je Datum, laufender Lauf, abgebrochener Lauf'
reset role;
set role service_role;
select 'Start Montag (erw. gestartet|pg_cron|laeuft): ' || q($$select r ->> 'ergebnis' || '|' || (r -> 'lauf' ->> 'ausloeser') || '|' || (r -> 'lauf' ->> 'status') from (select erinnerung_lauf_starten('2026-11-30', 'pg_cron', false) r) x$$);
select id as lauf1 from erinnerung_lauf where lauf_datum = '2026-11-30' and status = 'laeuft' \gset
select 'Zweiter Auslöser während des Laufs (erw. laeuft): ' || q($$select erinnerung_lauf_starten('2026-11-30', 'vercel_cron', false) ->> 'ergebnis'$$);
select 'Auch mit erzwingen kein zweiter laufender Lauf (erw. laeuft): ' || q($$select erinnerung_lauf_starten('2026-11-30', 'manuell', true) ->> 'ergebnis'$$);
select 'Ungültiger Auslöser (erw. FEHLER): ' || t($$select erinnerung_lauf_starten('2026-12-02', 'unbekannt', false)$$);

\echo '== Reservierung (F-33, F-36)'
select 'Reservierung VER Lager (erw. true): ' || q(format($f$select erinnerung_versand_reservieren(
  jsonb_build_object('id','00000000-0000-0000-0000-00000000f001','organisation_id','00000000-0000-0000-0000-0000000000a1','lauf_id',%L,'lauf_datum','2026-11-30','art','frist_digest','empfaenger_benutzer_id','33333333-3333-3333-3333-333333333333'),
  jsonb_build_array(
    jsonb_build_object('schluessel','frist:00000000-0000-0000-0000-0000000000f8:e_sifa:2026-11-01:33333333-3333-3333-3333-333333333333','art','frist','stufe','e_sifa','geraet_id','00000000-0000-0000-0000-0000000000e4','geraet_pruefart_id','00000000-0000-0000-0000-0000000000f8','bereich_id','00000000-0000-0000-0000-0000000000c1','bezug_datum','2026-11-01','rolle','kopie'),
    jsonb_build_object('schluessel','frist:00000000-0000-0000-0000-0000000000f7:v60:2027-01-29:33333333-3333-3333-3333-333333333333','art','frist','stufe','v60','geraet_id','00000000-0000-0000-0000-0000000000e3','geraet_pruefart_id','00000000-0000-0000-0000-0000000000f7','bereich_id','00000000-0000-0000-0000-0000000000c1','bezug_datum','2027-01-29','rolle','zustaendig')))$f$, :'lauf1'));
select 'Zweite Reservierung gleicher Empfänger/Tag (erw. false): ' || q(format($f$select erinnerung_versand_reservieren(
  jsonb_build_object('id','00000000-0000-0000-0000-00000000f002','organisation_id','00000000-0000-0000-0000-0000000000a1','lauf_id',%L,'lauf_datum','2026-11-30','art','frist_digest','empfaenger_benutzer_id','33333333-3333-3333-3333-333333333333'),
  jsonb_build_array(jsonb_build_object('schluessel','x','art','frist','stufe','v30','geraet_id','00000000-0000-0000-0000-0000000000e3','geraet_pruefart_id','00000000-0000-0000-0000-0000000000f7','bereich_id','00000000-0000-0000-0000-0000000000c1','bezug_datum','2027-01-29','rolle','zustaendig')))$f$, :'lauf1'));
select 'Nach Konflikt nichts geschrieben (erw. 1|2): ' || q($$select (select count(*) from mail_versand where empfaenger_benutzer_id = '33333333-3333-3333-3333-333333333333') || '|' || (select count(*) from erinnerung_posten where empfaenger_benutzer_id = '33333333-3333-3333-3333-333333333333')$$);
select 'Versand: Status vorbereitet, Versuche 0, Posten 2, Empfänger in Posten übernommen (erw. vorbereitet|0|2|2): ' || q($$select v.status || '|' || v.versuche || '|' || v.posten_anzahl || '|' || (select count(*) from erinnerung_posten p where p.versand_id = v.id and p.empfaenger_benutzer_id = v.empfaenger_benutzer_id) from mail_versand v where v.id = '00000000-0000-0000-0000-00000000f001'$$);
select 'Reservierung mit Gerät anderer Organisation (erw. FEHLER): ' || t(format($f$select erinnerung_versand_reservieren(
  jsonb_build_object('organisation_id','00000000-0000-0000-0000-0000000000a1','lauf_id',%L,'lauf_datum','2026-11-30','art','frist_digest','empfaenger_benutzer_id','22222222-2222-2222-2222-222222222222'),
  jsonb_build_array(jsonb_build_object('schluessel','y','art','frist','stufe','v30','geraet_id','00000000-0000-0000-0000-0000000000e7','geraet_pruefart_id','00000000-0000-0000-0000-00000000f0b1','bereich_id','00000000-0000-0000-0000-0000000000c3','bezug_datum','2027-01-29','rolle','zustaendig')))$f$, :'lauf1'));
select 'Fehlgeschlagene Reservierung hinterlässt keinen Versand (erw. 0): ' || q($$select count(*) from mail_versand where empfaenger_benutzer_id = '22222222-2222-2222-2222-222222222222'$$);
select 'Reservierung an Nicht-Mitglied (Admin B) (erw. FEHLER): ' || t(format($f$select erinnerung_versand_reservieren(
  jsonb_build_object('organisation_id','00000000-0000-0000-0000-0000000000a1','lauf_id',%L,'lauf_datum','2026-11-30','art','frist_digest','empfaenger_benutzer_id','77777777-7777-7777-7777-777777777777'),
  jsonb_build_array(jsonb_build_object('schluessel','z','art','frist','stufe','v30','geraet_id','00000000-0000-0000-0000-0000000000e3','geraet_pruefart_id','00000000-0000-0000-0000-0000000000f7','bereich_id','00000000-0000-0000-0000-0000000000c1','bezug_datum','2027-01-29','rolle','zustaendig')))$f$, :'lauf1'));
select 'Reservierung Prüfer mit falscher Art (erw. FEHLER): ' || t(format($f$select erinnerung_versand_reservieren(
  jsonb_build_object('organisation_id','00000000-0000-0000-0000-0000000000a1','lauf_id',%L,'lauf_datum','2026-11-30','art','frist_digest','empfaenger_benutzer_id','44444444-4444-4444-4444-444444444444'),
  jsonb_build_array(jsonb_build_object('schluessel','z','art','frist','stufe','v30','geraet_id','00000000-0000-0000-0000-0000000000e3','geraet_pruefart_id','00000000-0000-0000-0000-0000000000f7','bereich_id','00000000-0000-0000-0000-0000000000c1','bezug_datum','2027-01-29','rolle','zustaendig')))$f$, :'lauf1'));
select 'Reservierung Prüfer-Woche (erw. true): ' || q(format($f$select erinnerung_versand_reservieren(
  jsonb_build_object('id','00000000-0000-0000-0000-00000000f003','organisation_id','00000000-0000-0000-0000-0000000000a1','lauf_id',%L,'lauf_datum','2026-11-30','art','pruefer_woche','empfaenger_benutzer_id','66666666-6666-6666-6666-666666666666'),
  jsonb_build_array(jsonb_build_object('schluessel','pruefer:00000000-0000-0000-0000-0000000000f2:woche:2026-11-30:66666666-6666-6666-6666-666666666666','art','pruefer_woche','stufe','woche','geraet_id','00000000-0000-0000-0000-0000000000e2','geraet_pruefart_id','00000000-0000-0000-0000-0000000000f2','bereich_id','00000000-0000-0000-0000-0000000000c2','bezug_datum','2026-11-30','rolle','zustaendig')))$f$, :'lauf1'));
select 'Reservierung MA-Hinweis Mia (erw. true): ' || q(format($f$select erinnerung_versand_reservieren(
  jsonb_build_object('id','00000000-0000-0000-0000-00000000f004','organisation_id','00000000-0000-0000-0000-0000000000a1','lauf_id',%L,'lauf_datum','2026-11-30','art','ma_hinweis','empfaenger_benutzer_id','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'),
  jsonb_build_array(jsonb_build_object('schluessel','ma:00000000-0000-0000-0000-0000000000e4:ueberfaellig:2026-11-01:c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','art','ma_hinweis','stufe','nicht_verwenden','geraet_id','00000000-0000-0000-0000-0000000000e4','geraet_pruefart_id',null,'bereich_id','00000000-0000-0000-0000-0000000000c1','bezug_datum',null,'rolle','zustaendig')))$f$, :'lauf1'));

\echo '== Status und Unveränderlichkeit (F-41), Bounce per Webhook'
select 'vorbereitet → versendet mit Anbieter-ID (erw. OK 1): ' || t($$select erinnerung_versand_status('00000000-0000-0000-0000-00000000f001', 'versendet', 1, 'resend-001', null)$$);
select 'versendet am gesetzt (erw. true): ' || q($$select versendet_am is not null from mail_versand where id = '00000000-0000-0000-0000-00000000f001'$$);
select 'Prüfer-Woche: nach zwei rate_limit im dritten Versuch versendet (erw. OK 1): ' || t($$select erinnerung_versand_status('00000000-0000-0000-0000-00000000f003', 'versendet', 3, 'resend-003', null)$$);
select 'Prüfer-Woche gespeichert (erw. versendet|3|resend-003): ' || q($$select status || '|' || versuche || '|' || anbieter_id from mail_versand where id = '00000000-0000-0000-0000-00000000f003'$$);
select 'MA-Hinweis: fehler (erw. OK 1): ' || t($$select erinnerung_versand_status('00000000-0000-0000-0000-00000000f004', 'fehler', 1, null, 'ungueltige_adresse')$$);
select 'Webhook zugestellt (erw. true): ' || q($$select erinnerung_status_per_anbieter('resend-001', 'zugestellt')$$);
select 'Webhook zugestellt doppelt (erw. false): ' || q($$select erinnerung_status_per_anbieter('resend-001', 'zugestellt')$$);
select 'Webhook Bounce (erw. true): ' || q($$select erinnerung_status_per_anbieter('resend-003', 'bounce')$$);
select 'Bounce gespeichert, zählt als versendet (erw. bounce|true): ' || q($$select status || '|' || (versendet_am is not null) from mail_versand where anbieter_id = 'resend-003'$$);
select 'Webhook zugestellt nach Bounce (erw. false): ' || q($$select erinnerung_status_per_anbieter('resend-003', 'zugestellt')$$);
select 'Status bleibt bounce (erw. bounce): ' || q($$select status from mail_versand where anbieter_id = 'resend-003'$$);
select 'Webhook Beschwerde nach Zustellung (erw. true|beschwerde): ' || q($$select erinnerung_status_per_anbieter('resend-001', 'beschwerde')$$) || '|' || q($$select status from mail_versand where anbieter_id = 'resend-001'$$);
select 'Webhook unbekannte Anbieter-ID (erw. false): ' || q($$select erinnerung_status_per_anbieter('resend-unbekannt', 'bounce')$$);
select 'Webhook unbekannter Status (erw. false): ' || q($$select erinnerung_status_per_anbieter('resend-001', 'geoeffnet')$$);
select 'Status zugestellt → vorbereitet (erw. FEHLER): ' || t($$select erinnerung_versand_status('00000000-0000-0000-0000-00000000f001', 'vorbereitet', 1, null, null)$$);
select 'Status fehler → versendet (erw. FEHLER): ' || t($$select erinnerung_versand_status('00000000-0000-0000-0000-00000000f004', 'versendet', 2, 'resend-004', null)$$);
select 'Versuche über 3 (erw. FEHLER): ' || t($$select erinnerung_versand_status('00000000-0000-0000-0000-00000000f001', 'zugestellt', 4, null, null)$$);
select 'Anbieter-ID überschreiben (erw. FEHLER): ' || t($$select erinnerung_versand_status('00000000-0000-0000-0000-00000000f001', 'zugestellt', 1, 'andere', null)$$);
select 'Unbekannter Versand (erw. FEHLER): ' || t($$select erinnerung_versand_status('00000000-0000-0000-0000-00000000ffff', 'versendet', 1, null, null)$$);
reset role;
select 'Posten-UPDATE schluessel (auch Superuser) (erw. FEHLER): ' || t($$update erinnerung_posten set schluessel = 'manipuliert' where versand_id = '00000000-0000-0000-0000-00000000f001'$$);
select 'Posten Empfänger entfernen bei Frist-Posten (erw. FEHLER): ' || t($$update erinnerung_posten set empfaenger_benutzer_id = null where versand_id = '00000000-0000-0000-0000-00000000f001'$$);
select 'Versand Art ändern (erw. FEHLER): ' || t($$update mail_versand set art = 'pruefer_woche' where id = '00000000-0000-0000-0000-00000000f001'$$);
select 'Versand Status direkt zugestellt → vorbereitet (erw. FEHLER): ' || t($$update mail_versand set status = 'vorbereitet' where id = '00000000-0000-0000-0000-00000000f001'$$);
select 'DELETE mail_versand als Superuser (erw. FEHLER): ' || t($$delete from mail_versand where id = '00000000-0000-0000-0000-00000000f001'$$);
select 'DELETE erinnerung_posten als Superuser (erw. FEHLER): ' || t($$delete from erinnerung_posten$$);
set role service_role;
select 'DELETE mail_versand als Service (erw. FEHLER): ' || t($$delete from mail_versand where id = '00000000-0000-0000-0000-00000000f001'$$);
select 'INSERT mail_versand direkt als Service (erw. FEHLER): ' || t($$insert into mail_versand (organisation_id, lauf_id, lauf_datum, art, empfaenger_benutzer_id, posten_anzahl) select '00000000-0000-0000-0000-0000000000a1', id, lauf_datum, 'frist_digest', '22222222-2222-2222-2222-222222222222', 0 from erinnerung_lauf limit 1$$);
select 'UPDATE erinnerung_posten direkt als Service (erw. FEHLER): ' || t($$update erinnerung_posten set rolle = 'kopie'$$);

\echo '== Abmeldung per Token-RPC (F-40)'
select 'PRF meldet sich per System-RPC wieder an (erw. true): ' || q($$select mail_abmelden_system('00000000-0000-0000-0000-0000000000a1','44444444-4444-4444-4444-444444444444','pruefer_woche',false)$$);
select 'PRF abgemeldet = false gespeichert (erw. false): ' || q($$select abgemeldet from mail_abmeldung where benutzer_id = '44444444-4444-4444-4444-444444444444'$$);
select 'PRF mit Art ma_hinweis (erw. false): ' || q($$select mail_abmelden_system('00000000-0000-0000-0000-0000000000a1','44444444-4444-4444-4444-444444444444','ma_hinweis',true)$$);
select 'VER frist_digest (erw. false): ' || q($$select mail_abmelden_system('00000000-0000-0000-0000-0000000000a1','33333333-3333-3333-3333-333333333333','frist_digest',true)$$);
select 'Inaktiver MA Jonas (erw. false): ' || q($$select mail_abmelden_system('00000000-0000-0000-0000-0000000000a1','a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1','ma_hinweis',true)$$);
select 'Inaktiver Prüfer (erw. false): ' || q($$select mail_abmelden_system('00000000-0000-0000-0000-0000000000a1','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','pruefer_woche',true)$$);
select 'Falsche Organisation (erw. false): ' || q($$select mail_abmelden_system('00000000-0000-0000-0000-0000000000a2','44444444-4444-4444-4444-444444444444','pruefer_woche',true)$$);

\echo '== Lauf beenden, bereits gelaufen, versäumter/abgebrochener Lauf'
select 'Lauf beenden fertig (erw. OK 1): ' || t(format($f$select erinnerung_lauf_beenden(%L, 'fertig')$f$, :'lauf1'));
select 'Lauf mit ungültigem Status beenden (erw. FEHLER): ' || t(format($f$select erinnerung_lauf_beenden(%L, 'laeuft')$f$, :'lauf1'));
select 'Zweiter Lauf am selben Datum (erw. bereits_gelaufen): ' || q($$select erinnerung_lauf_starten('2026-11-30', 'vercel_cron', false) ->> 'ergebnis'$$);
select 'Mit erzwingen neuer Lauf (erw. gestartet): ' || q($$select erinnerung_lauf_starten('2026-11-30', 'manuell', true) ->> 'ergebnis'$$);
select id as lauf2 from erinnerung_lauf where lauf_datum = '2026-11-30' and status = 'laeuft' \gset
select 'Erzwungener Lauf: Reservierung VER erneut am selben Tag (erw. false): ' || q(format($f$select erinnerung_versand_reservieren(
  jsonb_build_object('organisation_id','00000000-0000-0000-0000-0000000000a1','lauf_id',%L,'lauf_datum','2026-11-30','art','frist_digest','empfaenger_benutzer_id','33333333-3333-3333-3333-333333333333'),
  jsonb_build_array(jsonb_build_object('schluessel','neu','art','frist','stufe','v30','geraet_id','00000000-0000-0000-0000-0000000000e3','geraet_pruefart_id','00000000-0000-0000-0000-0000000000f7','bereich_id','00000000-0000-0000-0000-0000000000c1','bezug_datum','2027-01-29','rolle','zustaendig')))$f$, :'lauf2'));
reset role;
-- Lauf hängt seit 20 Minuten (z. B. Funktion abgebrochen): gestartet_am zurückdatieren (Trigger erlaubt das nicht).
alter table public.erinnerung_lauf disable trigger erinnerung_lauf_unveraenderlich;
update public.erinnerung_lauf set gestartet_am = now() - interval '20 minutes' where id = :'lauf2';
alter table public.erinnerung_lauf enable trigger erinnerung_lauf_unveraenderlich;
set role service_role;
select 'Versäumter Lauf am Folgetag übernimmt hängenden Lauf (erw. gestartet): ' || q($$select erinnerung_lauf_starten('2026-12-01', 'vercel_cron', false) ->> 'ergebnis'$$);
select 'Hängender Lauf als fehler beendet (erw. fehler|true): ' || q(format($f$select status || '|' || (beendet_am is not null) from erinnerung_lauf where id = %L$f$, :'lauf2'));
select id as lauf3 from erinnerung_lauf where lauf_datum = '2026-12-01' and status = 'laeuft' \gset
select 'Folgetag: neue Sammelmail an VER erlaubt (erw. true): ' || q(format($f$select erinnerung_versand_reservieren(
  jsonb_build_object('organisation_id','00000000-0000-0000-0000-0000000000a1','lauf_id',%L,'lauf_datum','2026-12-01','art','frist_digest','empfaenger_benutzer_id','33333333-3333-3333-3333-333333333333'),
  jsonb_build_array(jsonb_build_object('schluessel','frist:00000000-0000-0000-0000-0000000000f8:e_admin:2026-11-01:33333333-3333-3333-3333-333333333333','art','frist','stufe','e_admin','geraet_id','00000000-0000-0000-0000-0000000000e4','geraet_pruefart_id','00000000-0000-0000-0000-0000000000f8','bereich_id','00000000-0000-0000-0000-0000000000c1','bezug_datum','2026-11-01','rolle','kopie')))$f$, :'lauf3'));
select 'Reservierung für Lauf eines anderen Datums (erw. FEHLER): ' || t(format($f$select erinnerung_versand_reservieren(
  jsonb_build_object('organisation_id','00000000-0000-0000-0000-0000000000a1','lauf_id',%L,'lauf_datum','2026-12-02','art','frist_digest','empfaenger_benutzer_id','22222222-2222-2222-2222-222222222222'),
  jsonb_build_array(jsonb_build_object('schluessel','w','art','frist','stufe','v30','geraet_id','00000000-0000-0000-0000-0000000000e3','geraet_pruefart_id','00000000-0000-0000-0000-0000000000f7','bereich_id','00000000-0000-0000-0000-0000000000c1','bezug_datum','2027-01-29','rolle','zustaendig')))$f$, :'lauf3'));
select 'Lauf 3 beenden (erw. OK 1): ' || t(format($f$select erinnerung_lauf_beenden(%L, 'fertig')$f$, :'lauf3'));
select 'Beendeten Lauf erneut öffnen (erw. FEHLER): ' || t(format($f$update erinnerung_lauf set status = 'laeuft', beendet_am = null where id = %L$f$, :'lauf3'));

\echo '== Versandprotokoll (F-41)'
reset role;
set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'mail_protokoll als VER (erw. FEHLER): ' || t($$select mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31')$$);
select 'mail_protokoll als VER: SQLSTATE (erw. 42501): ' || c($$select mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31')$$);
set request.jwt.claim.sub = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';
select 'mail_protokoll als MA (erw. FEHLER): ' || t($$select mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31')$$);
set request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';
select 'mail_protokoll Org A als Admin B (erw. FEHLER): ' || t($$select mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31')$$);
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'SIF: gesamt und Reihenfolge neueste zuerst (erw. 4|2026-12-01): ' || q($$select (r ->> 'gesamt') || '|' || (r -> 'versand' -> 0 ->> 'lauf_datum') from (select mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31') r) x$$);
select 'SIF: MA-Hinweis mit Problem-Status zeigt Name (erw. Mia Muster|mitarbeiter): ' || q($$select z ->> 'empfaenger_name' || '|' || (z ->> 'empfaenger_rolle') from jsonb_array_elements(mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31') -> 'versand') z where z ->> 'art' = 'ma_hinweis'$$);
select 'SIF: keine MA-Hinweis-Posten (erw. 0): ' || q($$select count(*) from jsonb_array_elements(mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31') -> 'posten') p where p ->> 'art' = 'ma_hinweis' or p ->> 'versand_id' = '00000000-0000-0000-0000-00000000f004'$$);
select 'SIF: Frist-Mail mit Name, Posten (erw. Marco|verantwortlicher|3): ' || q($$select string_agg(distinct (z ->> 'empfaenger_name') || '|' || (z ->> 'empfaenger_rolle'), ',') || '|' || (select jsonb_array_length(r -> 'posten')) from (select mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31', null, 'frist_digest') r) x, jsonb_array_elements(r -> 'versand') z group by r$$);
select 'SIF: Filter probleme (erw. beschwerde,bounce,fehler): ' || q($$select z ->> 'status' from jsonb_array_elements(mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31', 'probleme') -> 'versand') z$$);
select 'SIF: Filter Bereich Produktion nur Mails mit Produktions-Posten (erw. pruefer_woche): ' || q($$select z ->> 'art' from jsonb_array_elements(mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31', null, null, '00000000-0000-0000-0000-0000000000c2') -> 'versand') z$$);
select 'SIF: Filter Bereich Lager ohne MA-Hinweis (erw. frist_digest,frist_digest): ' || q($$select z ->> 'art' from jsonb_array_elements(mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31', null, null, '00000000-0000-0000-0000-0000000000c1') -> 'versand') z$$);
select 'SIF: Paginierung limit 1 offset 1 (erw. 4|1): ' || q($$select (r ->> 'gesamt') || '|' || jsonb_array_length(r -> 'versand') from (select mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31', null, null, null, 1, 1) r) x$$);
select 'SIF: letzter Lauf (erw. 2026-12-01|fertig): ' || q($$select (r -> 'letzter_lauf' ->> 'lauf_datum') || '|' || (r -> 'letzter_lauf' ->> 'status') from (select mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31') r) x$$);
select 'SIF: Antwort ohne Betreff, Inhalt, Adresse (erw. false): ' || q($$select mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31')::text ~* '(betreff|subject|email|@example)'$$);
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'ADM: Protokoll Org A (erw. 4): ' || q($$select mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31') ->> 'gesamt'$$);

\echo '== Pseudonymisierung MA-Hinweise nach 90 Tagen (F-41)'
reset role;
set request.jwt.claim.sub = '';
select 'authenticated darf mail_pseudonymisieren nicht (erw. false): ' || has_function_privilege('authenticated', 'app.mail_pseudonymisieren()', 'execute')::text;
select 'Frischer MA-Hinweis bleibt (erw. 0): ' || q($$select app.mail_pseudonymisieren()$$);
select 'Frischer MA-Hinweis mit Empfänger (erw. c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1): ' || q($$select empfaenger_benutzer_id from mail_versand where id = '00000000-0000-0000-0000-00000000f004'$$);
alter table public.mail_versand disable trigger mail_versand_unveraenderlich;
alter table public.erinnerung_posten disable trigger erinnerung_posten_unveraenderlich;
update public.mail_versand set erstellt_am = now() - interval '91 days' where id in ('00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-00000000f001');
update public.erinnerung_posten set erstellt_am = now() - interval '91 days' where versand_id in ('00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-00000000f001');
alter table public.mail_versand enable trigger mail_versand_unveraenderlich;
alter table public.erinnerung_posten enable trigger erinnerung_posten_unveraenderlich;
select 'Nach 91 Tagen: Job entfernt einen MA-Hinweis-Empfänger (erw. 1): ' || q($$select app.mail_pseudonymisieren()$$);
select 'MA-Hinweis ohne Empfänger, Posten ohne Empfänger, Frist-Mail unverändert (erw. true|true|true): ' || q($$select (select empfaenger_benutzer_id is null and pseudonymisiert_am is not null from mail_versand where id = '00000000-0000-0000-0000-00000000f004') || '|' || (select bool_and(empfaenger_benutzer_id is null) from erinnerung_posten where versand_id = '00000000-0000-0000-0000-00000000f004') || '|' || (select empfaenger_benutzer_id is not null from mail_versand where id = '00000000-0000-0000-0000-00000000f001')$$);
select 'Pseudonymisierung idempotent (erw. 0): ' || q($$select app.mail_pseudonymisieren()$$);
select 'Empfänger wieder setzen (erw. FEHLER): ' || t($$update mail_versand set empfaenger_benutzer_id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1' where id = '00000000-0000-0000-0000-00000000f004'$$);
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'SIF: pseudonymisierter MA-Hinweis ohne Namen (erw. -): ' || q($$select z ->> 'empfaenger_name' from jsonb_array_elements(mail_protokoll('00000000-0000-0000-0000-0000000000a1', '2026-11-01', '2026-12-31') -> 'versand') z where z ->> 'art' = 'ma_hinweis' and z ->> 'empfaenger_name' is not null$$);
reset role;

\echo '== Auslöser pg_cron (F-36)'
select 'Auslöser ohne Vault meldet Warnung statt Fehler (erw. OK 1): ' || t($$select app.erinnerungen_ausloesen()$$);
select 'Ereignis-Typ erlaubt (erw. OK 1): ' || t($$insert into ereignis (organisation_id, typ, akteur_name) values ('00000000-0000-0000-0000-0000000000a1', 'erinnerung_einstellung_gespeichert', 'Test')$$);
