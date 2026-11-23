-- Szenario Inkrement I3M für tests/migration.test.ts (läuft nach rls-szenario.sql und rls-szenario-i2.sql).
-- Stand: inkl. 20261129000000_review_i3m.sql (öffentliche Ansicht ohne IDs, Übernahmen nur offen direkt lesbar).
-- Jede Zeile: "<Fall> (erw. <Erwartung>): <Ergebnis>". Spiegelt supabase/tests/rls_inkrement3m.test.sql (pgTAP, Gate G-5).
\set ON_ERROR_STOP 1
reset role;
set request.jwt.claim.sub = '';
\pset tuples_only on
\pset format unaligned
grant execute on function public.t(text), public.q(text) to anon;

-- Kürzel: Org A a1 (Lager c1, Produktion c2), Org B a2 (Werkstatt c3).
-- MA Jonas j1 (a1), MA Aylin j2 (a1), MA Bernd j3 (nur a2), neuer Benutzer j4.
-- Geräte a1: e3 Leiter (wechselnd, Lager, ok, 2 Nachweise), e4 Hubwagen (wechselnd, Lager, überfällig),
--   e5 Auffanggurt (personenbezogen, Produktion), e6 Bohrschrauber (wechselnd, Lager, ohne Frist = unklar),
--   e8 Akku-Lader (wechselnd, Lager, ok), e9 Kettenzug (wechselnd, Lager, offener Anlass), e10 Kabeltrommel (wechselnd, Produktion).
-- Gerät a2: e7 Flex (wechselnd, Werkstatt).
insert into auth.users values
 ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1','jonas'),('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2','aylin'),
 ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3','bernd'),('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4','neu-ma');
insert into mitgliedschaft (id, organisation_id, benutzer_id, anzeigename, email, rolle) values
 ('00000000-0000-0000-0000-000000000d10','00000000-0000-0000-0000-0000000000a1','a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1','Jonas Richter','jonas@example.org','mitarbeiter'),
 ('00000000-0000-0000-0000-000000000d11','00000000-0000-0000-0000-0000000000a1','a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2','Aylin Demir','aylin@example.org','mitarbeiter'),
 ('00000000-0000-0000-0000-000000000d12','00000000-0000-0000-0000-0000000000a2','a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3','Bernd Fremd','bernd@example.org','mitarbeiter');
insert into geraet (id, organisation_id, bereich_id, bezeichnung, geraetegruppe, kategorie) values
 ('00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Leiter','leiter','wechselnd'),
 ('00000000-0000-0000-0000-0000000000e4','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Hubwagen','stapler','wechselnd'),
 ('00000000-0000-0000-0000-0000000000e5','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c2','Auffanggurt','psa','personenbezogen'),
 ('00000000-0000-0000-0000-0000000000e6','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Bohrschrauber','elektro','wechselnd'),
 ('00000000-0000-0000-0000-0000000000e8','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Akku-Lader','elektro','wechselnd'),
 ('00000000-0000-0000-0000-0000000000e9','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Kettenzug','kette','wechselnd'),
 ('00000000-0000-0000-0000-000000000e10','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c2','Kabeltrommel','elektro','wechselnd'),
 ('00000000-0000-0000-0000-0000000000e7','00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000c3','Flex','elektro','wechselnd');
insert into geraet_pruefart (id, organisation_id, geraet_id, bezeichnung, frist_monate, frist_quelle, frist_stufe, frist_fundstelle, frist_begruendung, letzte_pruefung, letzte_pruefung_herkunft) values
 ('00000000-0000-0000-0000-0000000000f7','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','Leiterprüfung',12,'gbu','C','GBU Lager','Begründung lang genug',current_date - 30,'pruefbericht'),
 ('00000000-0000-0000-0000-0000000000f8','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e4','Hubwagenprüfung',12,'gbu','C','GBU Lager','Begründung lang genug',current_date - 400,'pruefbericht'),
 ('00000000-0000-0000-0000-0000000000f9','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e6','Elektroprüfung',null,null,null,null,null,null,'unbekannt'),
 ('00000000-0000-0000-0000-000000000f10','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e8','Elektroprüfung',12,'gbu','C','GBU Lager','Begründung lang genug',current_date - 30,'pruefbericht'),
 ('00000000-0000-0000-0000-000000000f11','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e9','Kettenprüfung',12,'gbu','C','GBU Lager','Begründung lang genug',current_date - 30,'pruefbericht');
insert into nachweis (id, organisation_id, geraet_id, geraet_pruefart_id, pruefdatum, ergebnis, pruefumfang, pruefer_name, unterschrift_im_pdf, pdf_pfad, pdf_sha256, erfasst_von) values
 ('00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-0000000000f7',current_date - 400,'maengel_weiterbetrieb','Leiter','Alter Prüfer',true,
  '00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-0000000000e3/00000000-0000-0000-0000-0000000000f7/00000000-0000-0000-0000-000000000401.pdf',repeat('d',64),'11111111-1111-1111-1111-111111111111'),
 ('00000000-0000-0000-0000-000000000402','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-0000000000f7',current_date - 30,'ohne_maengel','Leiter','Prüfer Paul',true,
  '00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-0000000000e3/00000000-0000-0000-0000-0000000000f7/00000000-0000-0000-0000-000000000402.pdf',repeat('d',64),'11111111-1111-1111-1111-111111111111');
insert into anlass (organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung, erfasst_von) values
 ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e9','00000000-0000-0000-0000-000000000f11','unfall_schadensfall',current_date - 1,'Kette überlastet','11111111-1111-1111-1111-111111111111');
insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin, verantwortlich_id, erfasst_von) values
 ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','Geheime Mangelbeschreibung','gering',current_date + 90,'11111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111');
select token as tok_e3 from geraet_token where geraet_id = '00000000-0000-0000-0000-0000000000e3' and aktiv \gset
select token as tok_e5 from geraet_token where geraet_id = '00000000-0000-0000-0000-0000000000e5' and aktiv \gset
select token as tok_e9 from geraet_token where geraet_id = '00000000-0000-0000-0000-0000000000e9' and aktiv \gset

\echo '== Token (F-24)'
select 'Jedes Gerät hat genau einen aktiven Token (erw. 0): ' || q($$select count(*) from geraet g where (select count(*) from geraet_token t where t.geraet_id = g.id and t.aktiv) <> 1$$);
select 'Alle Tokens im Format base64url/22 (erw. 0): ' || q($$select count(*) from geraet_token where token !~ '^[A-Za-z0-9_-]{22}$'$$);
select 'neuer_token 1000x eindeutig und im Format (erw. 1000|1000): ' || q($$select count(distinct t) || '|' || count(*) filter (where t ~ '^[A-Za-z0-9_-]{22}$') from (select app.neuer_token() t from generate_series(1, 1000)) x$$);
select 'neuer_token hat 16 Zufallsbytes (erw. 16): ' || q($$select distinct length(decode(translate(t, '-_', '+/') || '==', 'base64')) from (select app.neuer_token() t from generate_series(1, 50)) x$$);
select 'Zweiter aktiver Token je Gerät (erw. FEHLER): ' || t($$insert into geraet_token (organisation_id, geraet_id, token) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','zweiterAktiverToken000')$$);
select 'Tokenwert ändern auch als Service (erw. FEHLER): ' || t($$update geraet_token set token = 'kurz' where geraet_id = '00000000-0000-0000-0000-0000000000e4'$$);

\echo '== Anonym (QR-Seite ohne Login)'
select 'anon darf in public nur geraet_oeffentlich ausführen (erw. geraet_oeffentlich): ' || q($$select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname not in ('t', 'q') and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') and has_function_privilege('anon', p.oid, 'execute')$$);
select 'anon hat keinen Zugriff auf Schema app (erw. false): ' || has_schema_privilege('anon', 'app', 'usage')::text;
select 'anon hat keine Tabellenrechte in public (erw. -): ' || q($$select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and (has_table_privilege('anon', c.oid, 'select') or has_table_privilege('anon', c.oid, 'insert') or has_table_privilege('anon', c.oid, 'update') or has_table_privilege('anon', c.oid, 'delete'))$$);
select 'authenticated darf Pseudonymisierung nicht ausführen (erw. false): ' || has_function_privilege('authenticated', 'app.uebernahmen_pseudonymisieren()', 'execute')::text;
set role anon;
select 'anon liest geraet (erw. FEHLER): ' || t($$select count(*) from geraet$$);
select 'anon liest geraet_token (erw. FEHLER): ' || t($$select count(*) from geraet_token$$);
select 'anon liest uebernahme (erw. FEHLER): ' || t($$select count(*) from uebernahme$$);
select 'anon liest mangel (erw. FEHLER): ' || t($$select count(*) from mangel$$);
select 'anon liest nachweis (erw. FEHLER): ' || t($$select count(*) from nachweis$$);
select 'anon liest mitgliedschaft (erw. FEHLER): ' || t($$select count(*) from mitgliedschaft$$);
select 'anon liest organisation (erw. FEHLER): ' || t($$select count(*) from organisation$$);
select 'anon ma_kurzansichten (erw. FEHLER): ' || t($$select ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','suche','lei',null)$$);
select 'anon uebernahme_starten (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e3')$$);
select 'anon uebernahme_beenden (erw. FEHLER): ' || t($$select uebernahme_beenden('00000000-0000-0000-0000-0000000000e3')$$);
select 'anon etikett_erneuern (erw. FEHLER): ' || t($$select etikett_erneuern('00000000-0000-0000-0000-0000000000e3')$$);
select 'anon mitglied_emails (erw. FEHLER): ' || t($$select * from mitglied_emails('00000000-0000-0000-0000-0000000000a1')$$);
select 'anon app.geraet_status_json (erw. FEHLER): ' || t($$select app.geraet_status_json('00000000-0000-0000-0000-0000000000e3')$$);
select 'anon app.neuer_token (erw. FEHLER): ' || t($$select app.neuer_token()$$);
select 'anon geraet_oeffentlich aktiver Token (erw. Leiter|Elbtal): ' || q(format($f$select (geraet_oeffentlich(%L) -> 'geraet' ->> 'bezeichnung') || '|' || (geraet_oeffentlich(%L) ->> 'organisation_name')$f$, :'tok_e3', :'tok_e3'));
select 'anon geraet_oeffentlich Schlüssel (erw. anlaesse,geraet,nachweise,offene_maengel,organisation_name,pruefarten): ' || q(format($f$select jsonb_object_keys(geraet_oeffentlich(%L))$f$, :'tok_e3'));
select 'anon JSON ohne Personen-/Bereichsschlüssel (erw. false): ' || q(format($f$select geraet_oeffentlich(%L)::text ~ '"(zugeordnet_an|zugeordnet_mir|benutzer_id|benutzer_name|erfasst_von|erfasst_von_name|anzeigename|bereich_id|bereich_name|beschreibung|offene_uebernahme|uebernommen|verantwortlich_id|frist_freigegeben_von_name)"' $f$, :'tok_e3'));
select 'anon keine Mängelbeschreibung, nur Schwere (erw. false|schwere): ' || q(format($f$select (geraet_oeffentlich(%L)::text like '%%Geheime%%')::text || '|' || (select string_agg(k, ',') from jsonb_object_keys(geraet_oeffentlich(%L) -> 'offene_maengel' -> 0) k)$f$, :'tok_e3', :'tok_e3'));
select 'anon nur neuester Nachweis je Prüfart mit Prüfername (erw. 1|Prüfer Paul|false): ' || q(format($f$select jsonb_array_length(geraet_oeffentlich(%L) -> 'nachweise') || '|' || (geraet_oeffentlich(%L) -> 'nachweise' -> 0 ->> 'pruefer_name') || '|' || (geraet_oeffentlich(%L)::text like '%%Alter Prüfer%%')$f$, :'tok_e3', :'tok_e3', :'tok_e3'));
select 'anon Frist mit Quelle/Stufe/Fundstelle (erw. 12|gbu|C|GBU Lager): ' || q(format($f$select f ->> 'monate' || '|' || (f ->> 'quelle') || '|' || (f ->> 'stufe') || '|' || (f ->> 'fundstelle') from (select geraet_oeffentlich(%L) -> 'pruefarten' -> 0 -> 'frist' f) x$f$, :'tok_e3'));
select 'anon geraet-Schlüssel ohne id/organisation_id (erw. betriebsstatus,bezeichnung,hersteller,inventarnummer,kategorie,typ): ' || q(format($f$select jsonb_object_keys(geraet_oeffentlich(%L) -> 'geraet')$f$, :'tok_e3'));
select 'anon JSON Leiter enthält keine UUID (erw. false): ' || q(format($f$select geraet_oeffentlich(%L)::text ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'$f$, :'tok_e3'));
select 'anon JSON Kettenzug mit Anlass enthält keine UUID (erw. 1|false): ' || q(format($f$select jsonb_array_length(geraet_oeffentlich(%L) -> 'anlaesse') || '|' || (geraet_oeffentlich(%L)::text ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}') $f$, :'tok_e9', :'tok_e9'));
select 'anon mit geratener Organisation enthält keine UUID (erw. false): ' || q(format($f$select geraet_oeffentlich(%L, '00000000-0000-0000-0000-0000000000a1')::text ~* '[0-9a-f]{8}-[0-9a-f]{4}-'$f$, :'tok_e3'));
select 'anon Nachweis verweist über pruefart_nr (erw. 1|1): ' || q(format($f$select (geraet_oeffentlich(%L) -> 'pruefarten' -> 0 ->> 'nr') || '|' || (geraet_oeffentlich(%L) -> 'nachweise' -> 0 ->> 'pruefart_nr')$f$, :'tok_e3', :'tok_e3'));
select 'anon falsches Format abc (erw. true): ' || q($$select geraet_oeffentlich('abc') is null$$);
select 'anon 23 Zeichen (erw. true): ' || q($$select geraet_oeffentlich('aaaaaaaaaaaaaaaaaaaaaaa') is null$$);
select 'anon SQL im Token (erw. true): ' || q($$select geraet_oeffentlich($q$' or ''='$q$) is null$$);
select 'anon unbekannter Token im Format (erw. true): ' || q($$select geraet_oeffentlich('AAAAAAAAAAAAAAAAAAAAAA') is null$$);
select 'anon Token mit geändertem letzten Zeichen (erw. true): ' || q(format($f$select geraet_oeffentlich(left(%L, 21) || case when right(%L, 1) = 'A' then 'B' else 'A' end) is null$f$, :'tok_e3', :'tok_e3'));
select 'anon null (erw. true): ' || q($$select geraet_oeffentlich(null) is null$$);

\echo '== Mitarbeiter Jonas: keine Fachtabellen, nur Kurzansicht'
set role authenticated;
set request.jwt.claim.sub = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
select 'MA sieht geraet (erw. 0): ' || q($$select count(*) from geraet$$);
select 'MA sieht geraet_pruefart (erw. 0): ' || q($$select count(*) from geraet_pruefart$$);
select 'MA sieht nachweis (erw. 0): ' || q($$select count(*) from nachweis$$);
select 'MA sieht anlass (erw. 0): ' || q($$select count(*) from anlass$$);
select 'MA sieht mangel (erw. 0): ' || q($$select count(*) from mangel$$);
select 'MA sieht ereignis (erw. 0): ' || q($$select count(*) from ereignis$$);
select 'MA sieht geraet_token (erw. 0): ' || q($$select count(*) from geraet_token$$);
select 'MA sieht nur eigene Mitgliedschaft (erw. Jonas Richter): ' || q($$select anzeigename from mitgliedschaft$$);
select 'MA sieht bereich_verantwortung (erw. 0): ' || q($$select count(*) from bereich_verantwortung$$);
select 'MA mitglied_emails (erw. 0): ' || q($$select count(*) from mitglied_emails('00000000-0000-0000-0000-0000000000a1')$$);
select 'MA sieht Storage-PDF (erw. 0): ' || q($$select count(*) from storage.objects$$);
select 'MA Kurzansicht fremde Organisation (erw. FEHLER): ' || t($$select ma_kurzansichten('00000000-0000-0000-0000-0000000000a2','suche','flex',null)$$);
select 'MA Kurzansicht ids fremdes Gerät (erw. 0): ' || q($$select jsonb_array_length(ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','ids',null,'{00000000-0000-0000-0000-0000000000e7}'))$$);
select 'MA Suche lei (erw. Leiter): ' || q($$select e -> 'geraet' ->> 'bezeichnung' from jsonb_array_elements(ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','suche','LEI',null)) e$$);
select 'MA Suche 1 Zeichen (erw. 0): ' || q($$select jsonb_array_length(ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','suche',' l ',null))$$);
select 'MA Suche Platzhalter %% (erw. 0): ' || q($$select jsonb_array_length(ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','suche','%%',null))$$);
select 'MA Suche unbekannte Art (erw. FEHLER): ' || t($$select ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','alle',null,null)$$);
select 'MA Kurzansicht Leiter ohne Namen/Beschreibung, nur neuester Prüfername (erw. false|Prüfer Paul): ' || q($$select (k::text ~ '(Geheime|Alter Prüfer|Katrin|Marco|Jonas|Aylin|benutzer_name|erfasst_von)')::text || '|' || (k -> 0 -> 'nachweise' -> 0 ->> 'pruefer_name') from (select ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','suche','leiter',null) k) x$$);
select 'MA QR-Seite eigene Organisation: geraet_id (erw. 00000000-0000-0000-0000-0000000000e3|true): ' || q(format($f$select (j ->> 'geraet_id') || '|' || (j ->> 'gleiche_organisation') from (select geraet_oeffentlich(%L, '00000000-0000-0000-0000-0000000000a1') j) x$f$, :'tok_e3'));
select 'MA QR-Seite ohne Organisation: keine UUID (erw. false): ' || q(format($f$select geraet_oeffentlich(%L)::text ~* '[0-9a-f]{8}-[0-9a-f]{4}-'$f$, :'tok_e3'));
select 'MA Kurzansicht Schlüssel (erw. anlaesse,bereich_name,geraet,geraet_id,nachweise,offene_maengel,offene_uebernahme,pruefarten,zugeordnet_mir): ' || q($$select jsonb_object_keys(ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','ids',null,'{00000000-0000-0000-0000-0000000000e3}') -> 0)$$);

\echo '== Übernahme (F-23)'
select 'MA übernimmt Leiter (erw. OK 1): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e3')$$);
select 'MA übernimmt Leiter erneut (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e3')$$);
select 'MA übernimmt ortsgebundenen Kran (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e2')$$);
select 'MA übernimmt personenbezogenes Gerät (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e5')$$);
select 'Nicht verwenden: überfälliger Hubwagen (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e4')$$);
select 'Nicht verwenden: außer Betrieb (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e1')$$);
select 'Nicht verwenden: offener Anlass (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e9')$$);
select 'Unklar (ohne Frist) übernehmbar (erw. OK 1): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e6')$$);
select 'MA übernimmt Gerät fremder Organisation (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e7')$$);
select 'MA übernimmt unbekanntes Gerät (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-00000000ffff')$$);
select 'MA schreibt uebernahme direkt (erw. FEHLER): ' || t($$insert into uebernahme (organisation_id, geraet_id, benutzer_id, benutzer_name) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e8','a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1','Jonas')$$);
select 'MA ändert uebernahme direkt (erw. FEHLER): ' || t($$update uebernahme set bis = now(), ende_art = 'rueckgabe'$$);
select 'MA löscht uebernahme (erw. FEHLER): ' || t($$delete from uebernahme$$);
select 'MA sieht eigene offene Übernahmen (erw. Bohrschrauber,Leiter): ' || q($$select e -> 'geraet' ->> 'bezeichnung' from jsonb_array_elements(ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','meine',null,null)) e$$);
select 'MA Kurzansicht eigene Übernahme mit seit (erw. true|true): ' || q($$select (e -> 'offene_uebernahme' ->> 'von_mir') || '|' || (e -> 'offene_uebernahme' ->> 'seit' is not null) from jsonb_array_elements(ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','ids',null,'{00000000-0000-0000-0000-0000000000e3}')) e$$);
select 'MA zugeordnet_an setzen (erw. OK 0): ' || t($$update geraet set zugeordnet_an = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1' where id = '00000000-0000-0000-0000-0000000000e5'$$);
select 'MA etikett_erneuern (erw. FEHLER): ' || t($$select etikett_erneuern('00000000-0000-0000-0000-0000000000e3')$$);
select 'MA Token anlegen (erw. FEHLER): ' || t($$insert into geraet_token (organisation_id, geraet_id, token) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','aaaaaaaaaaaaaaaaaaaaaa')$$);
select 'MA uebernahme_beenden ohne eigene Übernahme (erw. FEHLER): ' || t($$select uebernahme_beenden('00000000-0000-0000-0000-0000000000e8')$$);

\echo '== Mangel melden (F-26)'
select 'MA meldet gefährlichen Mangel, Termin heute (erw. OK 1): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e8','Kabel angeschmort','gefaehrlich',app.heute())$$);
select 'MA meldet erheblichen Mangel, Termin +30 (erw. OK 1): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','Holm eingerissen','erheblich',app.heute() + 30)$$);
select 'MA Mangel mit falschem Termin (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','Termin gewählt','gering',app.heute() + 5)$$);
select 'MA Mangel mit verantwortlich_id (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin, verantwortlich_id) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','Mit Verantwortlichem','gering',app.heute() + 90,'11111111-1111-1111-1111-111111111111')$$);
select 'MA Mangel mit Prüfart (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, geraet_pruefart_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-0000000000f7','Mit Prüfart','gering',app.heute() + 90)$$);
select 'MA Mangel in fremder Organisation (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000e7','Fremdes Gerät','gering',app.heute() + 90)$$);
select 'MA Mangel mit Status behoben (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin, status, behoben_am, behoben_durch, behebung, behebung_erfasst_am) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','Gleich behoben','gering',app.heute() + 90,'behoben',app.heute(),'Ich','Repariert',now())$$);
select 'MA sieht gemeldeten Mangel nicht (erw. 0): ' || q($$select count(*) from mangel$$);
select 'MA bearbeitet Mangel (erw. OK 0): ' || t($$update mangel set status = 'in_bearbeitung', verantwortlich_id = '11111111-1111-1111-1111-111111111111'$$);
select 'Nicht verwenden: gefährlicher Mangel blockiert Übernahme (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e8')$$);
select 'Kurzansicht Akku-Lader nur Schwere (erw. gefaehrlich): ' || q($$select m ->> 'schwere' from jsonb_array_elements(ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','ids',null,'{00000000-0000-0000-0000-0000000000e8}') -> 0 -> 'offene_maengel') m$$);
reset role;
select 'Melder und Ereignis gespeichert (erw. Jonas Richter|mangel_erfasst): ' || q($$select m.erfasst_von_name || '|' || e.typ from mangel m join ereignis e on e.daten ->> 'mangelId' = m.id::text where m.beschreibung = 'Kabel angeschmort'$$);
set role authenticated;

\echo '== Zweite Mitarbeiterin: keine fremden Namen, Übergabe'
set request.jwt.claim.sub = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2';
select 'Aylin sieht Übernahmen von Jonas (erw. 0): ' || q($$select count(*) from uebernahme$$);
select 'Aylin Kurzansicht Leiter: andere Person ohne Namen (erw. false|true): ' || q($$select (e -> 'offene_uebernahme' ->> 'von_mir') || '|' || (e -> 'offene_uebernahme' -> 'seit' = 'null'::jsonb) from jsonb_array_elements(ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','ids',null,'{00000000-0000-0000-0000-0000000000e3}')) e$$);
select 'Aylin Kurzansicht enthält Jonas nicht (erw. false): ' || q($$select ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','suche','le',null)::text like '%Jonas%'$$);
select 'Aylin übernimmt Leiter (Übergabe) (erw. OK 1): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e3')$$);
select 'Aylin gibt Bohrschrauber von Jonas zurück (erw. FEHLER): ' || t($$select uebernahme_beenden('00000000-0000-0000-0000-0000000000e6')$$);
set request.jwt.claim.sub = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
select 'Jonas gibt übergebene Leiter zurück (erw. FEHLER): ' || t($$select uebernahme_beenden('00000000-0000-0000-0000-0000000000e3')$$);
select 'Jonas gibt Bohrschrauber zurück (erw. OK 1): ' || t($$select uebernahme_beenden('00000000-0000-0000-0000-0000000000e6')$$);
select 'Jonas sieht eigene abgeschlossene Zeilen nicht (erw. 0): ' || q($$select count(*) from uebernahme$$);
select 'Jonas Verlauf-RPC (erw. 0): ' || q($$select count(*) from uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e3')$$);
select 'Jonas übernimmt Kabeltrommel Produktion (erw. OK 1): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-000000000e10')$$);
select 'Jonas sieht nur eigene offene Übernahme (erw. 00000000-0000-0000-0000-000000000e10|-): ' || q($$select geraet_id || '|' || coalesce(beendet_von::text, '-') from uebernahme$$);
set request.jwt.claim.sub = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2';
select 'Aylin sieht beendet_von/Übergabe an sie nicht, nur eigene offene Leiter (erw. 00000000-0000-0000-0000-0000000000e3|-): ' || q($$select geraet_id || '|' || coalesce(ende_art, '-') from uebernahme$$);
set request.jwt.claim.sub = 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3';
select 'MA fremde Organisation QR-Seite mit geratener Organisation: keine UUID (erw. false): ' || q(format($f$select geraet_oeffentlich(%L, '00000000-0000-0000-0000-0000000000a1')::text ~* '[0-9a-f]{8}-[0-9a-f]{4}-'$f$, :'tok_e3'));
select 'MA fremde Organisation Verlauf-RPC (erw. 0): ' || q($$select count(*) from uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e3')$$);
set request.jwt.claim.sub = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
reset role;
select 'Übergabe beendet mit Akteur (erw. uebergabe|a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2): ' || q($$select ende_art || '|' || beendet_von from uebernahme where geraet_id = '00000000-0000-0000-0000-0000000000e3' and benutzer_id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'$$);
select 'Zweite offene Übernahme desselben Geräts (erw. FEHLER): ' || t($$insert into uebernahme (organisation_id, geraet_id, benutzer_id, benutzer_name) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1','Jonas Richter')$$);
select 'Übernahmen ohne Ereignis (erw. 0): ' || q($$select count(*) from ereignis where daten::text like '%uebernahme%' or daten::text like '%a2a2a2a2%'$$);
select 'Beendete Übernahme erneut beenden (erw. FEHLER): ' || t($$update uebernahme set bis = now(), ende_art = 'austritt' where ende_art = 'uebergabe'$$);
set role authenticated;

\echo '== Sichtbarkeit Übernahmen (F-27)'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER Lager sieht offenen Halter Leiter (erw. Aylin Demir): ' || q($$select benutzer_name from uebernahme where bis is null$$);
select 'VER Lager sieht abgeschlossene Übernahmen (erw. 0): ' || q($$select count(*) from uebernahme where bis is not null$$);
select 'VER Lager Verlauf-RPC (erw. 0): ' || q($$select count(*) from uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e3')$$);
select 'VER Lager sieht Halter in Produktion (erw. 0): ' || q($$select count(*) from uebernahme where geraet_id = '00000000-0000-0000-0000-000000000e10'$$);
select 'VER Lager beendet Übernahme Produktion (erw. FEHLER): ' || t($$select uebernahme_beenden('00000000-0000-0000-0000-000000000e10')$$);
select 'VER übernimmt selbst (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e3')$$);
select 'VER Kurzansicht (erw. FEHLER): ' || t($$select ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','suche','lei',null)$$);
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'SIF sieht offene Übernahmen (erw. 2): ' || q($$select count(*) from uebernahme$$);
select 'SIF Verlauf-RPC (erw. 0): ' || q($$select count(*) from uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e3')$$);
select 'SIF beendet Übernahme (erw. FEHLER): ' || t($$select uebernahme_beenden('00000000-0000-0000-0000-0000000000e3')$$);
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 'PRF sieht Übernahmen (erw. 0): ' || q($$select count(*) from uebernahme$$);
select 'PRF sieht Token (erw. 0): ' || q($$select count(*) from geraet_token$$);
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'ADM sieht abgeschlossene Übernahmen nicht direkt (erw. 0): ' || q($$select count(*) from uebernahme where bis is not null$$);
select 'ADM sieht offene Übernahmen direkt (erw. 2): ' || q($$select count(*) from uebernahme$$);
select 'ADM Verlauf je Gerät mit Namen (erw. Jonas Richter|uebergabe): ' || q($$select benutzer_name || '|' || ende_art from uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e3')$$);
select 'ADM Verlauf ohne beendet_von (erw. false): ' || q($$select bool_or(k = 'beendet_von') from (select jsonb_object_keys(to_jsonb(v)) k from uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e3') v) x$$);
select 'ADM Verlauf Gerät fremder Organisation (erw. 0): ' || q($$select count(*) from uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e7')$$);
select 'ADM QR-Seite eigene Organisation: geraet_id (erw. 00000000-0000-0000-0000-0000000000e3): ' || q(format($f$select geraet_oeffentlich(%L, '00000000-0000-0000-0000-0000000000a1') ->> 'geraet_id'$f$, :'tok_e3'));
select 'ADM QR-Seite andere aktuelle Organisation: keine UUID (erw. false): ' || q(format($f$select geraet_oeffentlich(%L, '00000000-0000-0000-0000-0000000000a2')::text ~* '[0-9a-f]{8}-[0-9a-f]{4}-'$f$, :'tok_e3'));
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER Lager beendet Übernahme Leiter (erw. OK 1): ' || t($$select uebernahme_beenden('00000000-0000-0000-0000-0000000000e3')$$);
select 'VER Lager beendet erneut (erw. FEHLER): ' || t($$select uebernahme_beenden('00000000-0000-0000-0000-0000000000e3')$$);
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'Ende-Art Verwaltung (erw. beendet_verwaltung): ' || q($$select ende_art from uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e3') where benutzer_id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'$$);

\echo '== Zuordnung (F-22)'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER Lager ordnet Gerät in Produktion zu (erw. OK 0): ' || t($$update geraet set zugeordnet_an = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1' where id = '00000000-0000-0000-0000-0000000000e5'$$);
set request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';
select 'VER Produktion ordnet an Sifa zu (erw. FEHLER): ' || t($$update geraet set zugeordnet_an = '22222222-2222-2222-2222-222222222222' where id = '00000000-0000-0000-0000-0000000000e5'$$);
select 'VER Produktion ordnet an MA fremder Organisation zu (erw. FEHLER): ' || t($$update geraet set zugeordnet_an = 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3' where id = '00000000-0000-0000-0000-0000000000e5'$$);
select 'VER Produktion ordnet Jonas zu (erw. OK 1): ' || t($$update geraet set zugeordnet_an = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1' where id = '00000000-0000-0000-0000-0000000000e5'$$);
select 'VER ändert dabei Bezeichnung (erw. FEHLER): ' || t($$update geraet set zugeordnet_an = null, bezeichnung = 'Neu' where id = '00000000-0000-0000-0000-0000000000e5'$$);
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'Ereignis zuordnung_geaendert ohne Person (erw. {"zugeordnet": true}): ' || q($$select daten::text from ereignis where typ = 'zuordnung_geaendert'$$);
select 'ADM ordnet wechselndes Gerät zu (erw. FEHLER): ' || t($$update geraet set zugeordnet_an = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1' where id = '00000000-0000-0000-0000-0000000000e3'$$);
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'SIF ordnet zu (erw. OK 0): ' || t($$update geraet set zugeordnet_an = null where id = '00000000-0000-0000-0000-0000000000e5'$$);
select 'SIF sieht Zuordnung (erw. a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1): ' || q($$select zugeordnet_an from geraet where id = '00000000-0000-0000-0000-0000000000e5'$$);
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 'PRF ordnet zu (erw. OK 0): ' || t($$update geraet set zugeordnet_an = null where id = '00000000-0000-0000-0000-0000000000e5'$$);
set request.jwt.claim.sub = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
select 'Jonas: Auffanggurt in Meine Geräte, zugeordnet_mir (erw. Auffanggurt|true,Kabeltrommel|false): ' || q($$select (e -> 'geraet' ->> 'bezeichnung') || '|' || (e ->> 'zugeordnet_mir') from jsonb_array_elements(ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','meine',null,null)) e$$);
set role anon;
select 'anon Auffanggurt ohne Zuordnung/Namen (erw. false): ' || q(format($f$select geraet_oeffentlich(%L)::text ~ '(zugeordnet|Jonas|a1a1a1a1)'$f$, :'tok_e5'));
set role authenticated;

\echo '== Etikett erneuern (F-24, F-25)'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER Lager liest Token Lager (erw. 1): ' || q($$select count(*) from geraet_token where geraet_id = '00000000-0000-0000-0000-0000000000e3'$$);
select 'VER Lager liest Token Produktion (erw. 0): ' || q($$select count(*) from geraet_token where geraet_id = '00000000-0000-0000-0000-0000000000e5'$$);
select 'VER Lager erneuert Aufkleber Leiter (erw. OK 1): ' || t($$select etikett_erneuern('00000000-0000-0000-0000-0000000000e3')$$);
select 'VER Lager erneuert Aufkleber Produktion (erw. FEHLER): ' || t($$select etikett_erneuern('00000000-0000-0000-0000-0000000000e5')$$);
select 'Leiter: ein aktiver, ein deaktivierter Token (erw. false|false,true|true): ' || q($$select aktiv || '|' || (deaktiviert_am is null) from geraet_token where geraet_id = '00000000-0000-0000-0000-0000000000e3'$$);
select 'Ereignis etikett_erneuert ohne Daten (erw. {}): ' || q($$select daten::text from ereignis where typ = 'etikett_erneuert'$$);
select 'VER ändert Tokenwert (erw. FEHLER): ' || t($$update geraet_token set token = 'bbbbbbbbbbbbbbbbbbbbbb' where geraet_id = '00000000-0000-0000-0000-0000000000e3'$$);
select 'VER aktiviert alten Token wieder (erw. FEHLER): ' || t($$update geraet_token set aktiv = true where geraet_id = '00000000-0000-0000-0000-0000000000e3' and not aktiv$$);
select 'VER löscht Token (erw. FEHLER): ' || t($$delete from geraet_token where geraet_id = '00000000-0000-0000-0000-0000000000e3'$$);
select 'VER deaktiviert aktiven Token (erw. OK 1): ' || t($$update geraet_token set aktiv = false where geraet_id = '00000000-0000-0000-0000-0000000000e3' and aktiv$$);
select 'VER legt Token mit eigenem Wert an (erw. OK 1): ' || t($$insert into geraet_token (organisation_id, geraet_id, token) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','aaaaaaaaaaaaaaaaaaaaaa')$$);
select 'Gewählter Tokenwert wird ersetzt – nicht erratbar (erw. 0|1): ' || q($$select count(*) filter (where token = 'aaaaaaaaaaaaaaaaaaaaaa') || '|' || count(*) filter (where aktiv) from geraet_token where geraet_id = '00000000-0000-0000-0000-0000000000e3'$$);
select 'VER legt Gerät an → Token per Trigger (erw. OK 1): ' || t($$select geraet_anlegen('{"id":"00000000-0000-0000-0000-000000000e11","organisation_id":"00000000-0000-0000-0000-0000000000a1","bereich_id":"00000000-0000-0000-0000-0000000000c1","bezeichnung":"Sackkarre","geraetegruppe":"sonstiges","kategorie":"wechselnd"}'::jsonb, '[{"bezeichnung":"Sichtprüfung"}]'::jsonb)$$);
select 'Neues Gerät hat aktiven Token (erw. 1): ' || q($$select count(*) from geraet_token where geraet_id = '00000000-0000-0000-0000-000000000e11' and aktiv and token ~ '^[A-Za-z0-9_-]{22}$'$$);
set role anon;
select 'anon alter Token nach Erneuern (erw. true): ' || q(format($f$select geraet_oeffentlich(%L) is null$f$, :'tok_e3'));
set role authenticated;

\echo '== Mitarbeiter einladen (F-20, Q-35)'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER lädt Mitarbeiter ein (erw. OK 1): ' || t($$select mitglied_speichern('{"id":"00000000-0000-0000-0000-000000000d13","organisation_id":"00000000-0000-0000-0000-0000000000a1","benutzer_id":"a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4","anzeigename":"Neue Mitarbeiterin","email":"neu-ma@example.org","rolle":"mitarbeiter","aktiv":true,"eingeladen":true}'::jsonb, '{}')$$);
select 'VER lädt Verantwortlichen ein (erw. FEHLER): ' || t($$select mitglied_speichern('{"organisation_id":"00000000-0000-0000-0000-0000000000a1","benutzer_id":"a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3","anzeigename":"Chef","rolle":"verantwortlicher"}'::jsonb, '{00000000-0000-0000-0000-0000000000c1}')$$);
select 'VER lädt Mitarbeiter mit Bereich ein (erw. FEHLER): ' || t($$select mitglied_speichern('{"organisation_id":"00000000-0000-0000-0000-0000000000a1","benutzer_id":"a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3","anzeigename":"Bernd","rolle":"mitarbeiter"}'::jsonb, '{00000000-0000-0000-0000-0000000000c1}')$$);
select 'VER deaktiviert Mitarbeiter (erw. FEHLER): ' || t($$select mitglied_speichern('{"id":"00000000-0000-0000-0000-000000000d11","organisation_id":"00000000-0000-0000-0000-0000000000a1","benutzer_id":"a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2","anzeigename":"Aylin Demir","rolle":"mitarbeiter","aktiv":false}'::jsonb, '{}')$$);
select 'VER deaktiviert Mitarbeiter direkt (erw. OK 0): ' || t($$update mitgliedschaft set aktiv = false where id = '00000000-0000-0000-0000-000000000d11'$$);
select 'VER legt Sifa direkt an (erw. FEHLER): ' || t($$insert into mitgliedschaft (organisation_id, benutzer_id, anzeigename, rolle) values ('00000000-0000-0000-0000-0000000000a1','a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3','Bernd','sifa')$$);
select 'VER sieht E-Mails nur der Mitarbeiter (erw. aylin@example.org,jonas@example.org,neu-ma@example.org): ' || q($$select email from mitglied_emails('00000000-0000-0000-0000-0000000000a1')$$);
reset role;
select 'Ereignis Einladung durch VER (erw. mitarbeiter|true|Marco): ' || q($$select (daten ->> 'rolle') || '|' || (daten ->> 'eingeladen') || '|' || akteur_name from ereignis where typ = 'mitglied_gespeichert' and daten ->> 'mitgliedschaftId' = '00000000-0000-0000-0000-000000000d13'$$);
set role authenticated;

\echo '== Austritt (F-20, R-45)'
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'ADM deaktiviert Jonas (erw. OK 1): ' || t($$select mitglied_speichern('{"id":"00000000-0000-0000-0000-000000000d10","organisation_id":"00000000-0000-0000-0000-0000000000a1","benutzer_id":"a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1","anzeigename":"Jonas Richter","rolle":"mitarbeiter","aktiv":false}'::jsonb, '{}')$$);
select 'Zuordnung gelöst (erw. -): ' || q($$select zugeordnet_an from geraet where id = '00000000-0000-0000-0000-0000000000e5' and zugeordnet_an is not null$$);
select 'Offene Übernahme beendet mit austritt (erw. austritt): ' || q($$select ende_art from uebernahmen_verlauf('00000000-0000-0000-0000-000000000e10')$$);
select 'Austritt ohne zusätzliches Zuordnungsereignis (erw. 1): ' || q($$select count(*) from ereignis where typ = 'zuordnung_geaendert'$$);
reset role;
select 'Gemeldete Mängel bleiben (erw. 2): ' || q($$select count(*) from mangel where erfasst_von = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'$$);
set role authenticated;
set request.jwt.claim.sub = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
select 'Deaktivierter MA Kurzansicht (erw. FEHLER): ' || t($$select ma_kurzansichten('00000000-0000-0000-0000-0000000000a1','meine',null,null)$$);
select 'Deaktivierter MA übernimmt (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-0000000000e3')$$);
select 'Deaktivierter MA meldet Mangel (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e3','Nach Austritt','gering',app.heute() + 90)$$);
select 'Deaktivierter MA sieht eigene Übernahmen (erw. 0): ' || q($$select count(*) from uebernahme$$);
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'ADM: Rollenwechsel Aylin weg von mitarbeiter (erw. OK 1): ' || t($$update mitgliedschaft set rolle = 'sifa' where id = '00000000-0000-0000-0000-000000000d11'$$);

\echo '== Pseudonymisierung nach 90 Tagen (F-27)'
reset role;
set request.jwt.claim.sub = '';
insert into uebernahme (id, organisation_id, geraet_id, benutzer_id, benutzer_name, von, bis, ende_art, beendet_von) values
 ('00000000-0000-0000-0000-000000000901','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e6','a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2','Aylin Demir', now() - interval '101 days', now() - interval '100 days','rueckgabe','a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'),
 ('00000000-0000-0000-0000-000000000902','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e6','a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2','Aylin Demir', now() - interval '81 days', now() - interval '80 days','rueckgabe','a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2');
set role authenticated;
select 'Client führt Pseudonymisierung aus (erw. FEHLER): ' || t($$select app.uebernahmen_pseudonymisieren()$$);
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'Verlauf ohne Cron-Lauf: > 90 Tage fehlt, 80 Tage enthalten (erw. 2|false|true): ' || q($$select count(*) || '|' || bool_or(id = '00000000-0000-0000-0000-000000000901') || '|' || bool_or(id = '00000000-0000-0000-0000-000000000902') from uebernahmen_verlauf('00000000-0000-0000-0000-0000000000e6')$$);
set request.jwt.claim.sub = '';
reset role;
select 'Pseudonymisierung (erw. 1): ' || app.uebernahmen_pseudonymisieren()::text;
select 'Ältere ohne Person, jüngere mit Person (erw. 00000000-0000-0000-0000-000000000901|-|-|-|true,00000000-0000-0000-0000-000000000902|Aylin Demir|a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2|a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2|false): ' || q($$select id || '|' || coalesce(benutzer_name, '-') || '|' || coalesce(benutzer_id::text, '-') || '|' || coalesce(beendet_von::text, '-') || '|' || (pseudonymisiert_am is not null) from uebernahme where id in ('00000000-0000-0000-0000-000000000901','00000000-0000-0000-0000-000000000902')$$);
select 'Zweiter Lauf idempotent (erw. 0): ' || app.uebernahmen_pseudonymisieren()::text;
select 'Person nachträglich wieder eintragen (erw. FEHLER): ' || t($$update uebernahme set benutzer_id = 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', benutzer_name = 'Aylin Demir', pseudonymisiert_am = null where id = '00000000-0000-0000-0000-000000000901'$$);
select 'Gerät und Zeitraum bleiben (erw. rueckgabe|true): ' || q($$select ende_art || '|' || (bis is not null) from uebernahme where id = '00000000-0000-0000-0000-000000000901'$$);
select 'Offene Übernahmen bleiben unberührt (erw. 0): ' || q($$select count(*) from uebernahme where bis is null and pseudonymisiert_am is not null$$);

\echo '== Übernahme-Sperre: nicht bestanden und Fälligkeit am Monatsende (F-21, F-23)'
-- Muss mit der Domäne übereinstimmen: src/domain/status.ts berechneStatus (überfällig erst bei restTage < 0, d. h. am
-- Fälligkeitstag noch verwendbar) und berechneStatusImKontext (letzter Nachweis nicht_bestanden → vor_nutzung_pruefen);
-- Fälligkeit = addMonate in src/domain/datum.ts mit Monatsende-Klemme (31.01. + 13 Monate = 28.02. des Folgejahres).
-- SQL-Gegenstück: app.geraet_nicht_verwenden (20261128000000_inkrement3m.sql). Akteur: neue Mitarbeiterin j4 (aktiv).
reset role;
set request.jwt.claim.sub = '';
insert into geraet (id, organisation_id, bereich_id, bezeichnung, geraetegruppe, kategorie) values
 ('00000000-0000-0000-0000-000000000e12','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Schweißgerät','elektro','wechselnd'),
 ('00000000-0000-0000-0000-000000000e13','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Rüttelplatte','sonstiges','wechselnd'),
 ('00000000-0000-0000-0000-000000000e14','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Stichsäge','elektro','wechselnd');
insert into geraet_pruefart (id, organisation_id, geraet_id, bezeichnung, frist_monate, frist_quelle, frist_stufe, frist_fundstelle, frist_begruendung, letzte_pruefung, letzte_pruefung_herkunft) values
 ('00000000-0000-0000-0000-000000000f12','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000e12','Elektroprüfung',12,'gbu','C','GBU Lager','Begründung lang genug',current_date - 30,'nachweis'),
 ('00000000-0000-0000-0000-000000000f13','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000e13','Sichtprüfung',12,'gbu','C','GBU Lager','Begründung lang genug',current_date - 30,'nachweis'),
 ('00000000-0000-0000-0000-000000000f14','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000e14','Elektroprüfung',13,'gbu','C','GBU Lager','Begründung lang genug','2026-01-31','pruefbericht');
insert into nachweis (id, organisation_id, geraet_id, geraet_pruefart_id, pruefdatum, ergebnis, pruefumfang, pruefer_name, unterschrift_im_pdf, pdf_pfad, pdf_sha256, erfasst_von) values
 ('00000000-0000-0000-0000-000000000403','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000e12','00000000-0000-0000-0000-000000000f12',current_date - 60,'ohne_maengel','Gerät','Prüfer Paul',true,
  '00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-000000000e12/00000000-0000-0000-0000-000000000f12/00000000-0000-0000-0000-000000000403.pdf',repeat('d',64),'11111111-1111-1111-1111-111111111111'),
 ('00000000-0000-0000-0000-000000000404','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000e12','00000000-0000-0000-0000-000000000f12',current_date - 30,'nicht_bestanden','Gerät','Prüfer Paul',true,
  '00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-000000000e12/00000000-0000-0000-0000-000000000f12/00000000-0000-0000-0000-000000000404.pdf',repeat('d',64),'11111111-1111-1111-1111-111111111111'),
 ('00000000-0000-0000-0000-000000000405','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000e13','00000000-0000-0000-0000-000000000f13',current_date - 60,'nicht_bestanden','Gerät','Prüfer Paul',true,
  '00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-000000000e13/00000000-0000-0000-0000-000000000f13/00000000-0000-0000-0000-000000000405.pdf',repeat('d',64),'11111111-1111-1111-1111-111111111111'),
 ('00000000-0000-0000-0000-000000000406','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000e13','00000000-0000-0000-0000-000000000f13',current_date - 30,'ohne_maengel','Gerät','Prüfer Paul',true,
  '00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-000000000e13/00000000-0000-0000-0000-000000000f13/00000000-0000-0000-0000-000000000406.pdf',repeat('d',64),'11111111-1111-1111-1111-111111111111');
set role authenticated;
set request.jwt.claim.sub = 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4';
select 'Letzter Nachweis nicht bestanden, Frist ok → gesperrt (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-000000000e12')$$);
select 'Älterer Nachweis nicht bestanden, neuester bestanden → übernehmbar (erw. OK 1): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-000000000e13')$$);
-- Fester Stichtag für app.heute(): nur in dieser Testdatenbank, danach wiederhergestellt.
reset role;
create or replace function app.heute() returns date language sql stable set search_path = pg_temp as $$ select date '2027-02-28' $$;
set role authenticated;
select 'Monatsende: 31.01.2026 + 13 Monate = 28.02.2027, heute 28.02. → übernehmbar (erw. OK 1): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-000000000e14')$$);
select 'Monatsende: Rückgabe (erw. OK 1): ' || t($$select uebernahme_beenden('00000000-0000-0000-0000-000000000e14')$$);
reset role;
create or replace function app.heute() returns date language sql stable set search_path = pg_temp as $$ select date '2027-03-01' $$;
set role authenticated;
select 'Monatsende: heute 01.03.2027, einen Tag nach Fälligkeit → gesperrt (erw. FEHLER): ' || t($$select uebernahme_starten('00000000-0000-0000-0000-000000000e14')$$);
reset role;
create or replace function app.heute() returns date language sql stable set search_path = pg_temp as $$
  select (now() at time zone 'Europe/Berlin')::date;
$$;
select 'app.heute() wiederhergestellt (erw. true): ' || (app.heute() = (now() at time zone 'Europe/Berlin')::date)::text;
