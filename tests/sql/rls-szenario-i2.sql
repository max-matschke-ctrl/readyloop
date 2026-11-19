-- Szenario Inkrement 2 für tests/migration.test.ts (läuft nach rls-szenario.sql auf I1+I2-Migration).
-- Jede Zeile: "<Fall> (erw. <Erwartung>): <Ergebnis>". Spiegelt supabase/tests/rls_inkrement2.test.sql (pgTAP, Gate G-5).
\set ON_ERROR_STOP 1
reset role;
set request.jwt.claim.sub = '';
-- Kürzel: Org A a1 (Lager c1, Produktion c2), Org B a2. Geräte e1 (Lager, Prüfart f6), e2 (Produktion, f2/f3/f4/f5).
insert into auth.users values
 ('55555555-5555-5555-5555-555555555555','adm2'),('77777777-7777-7777-7777-777777777777','admB'),
 ('88888888-8888-8888-8888-888888888888','ver-inaktiv'),('99999999-9999-9999-9999-999999999999','neu'),
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','prf-inaktiv');
insert into organisation values ('00000000-0000-0000-0000-0000000000a2','Muster Metallbau',null);
insert into standort values ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000a2','Werk');
insert into bereich values ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000b2','Werkstatt','werkstatt_fertigung');
insert into mitgliedschaft (id, organisation_id, benutzer_id, anzeigename, rolle, aktiv, pruefer_typen) values
 ('00000000-0000-0000-0000-0000000000d5','00000000-0000-0000-0000-0000000000a1','55555555-5555-5555-5555-555555555555','Admin Zwei','admin',true,'{}'),
 ('00000000-0000-0000-0000-0000000000d7','00000000-0000-0000-0000-0000000000a2','77777777-7777-7777-7777-777777777777','Admin B','admin',true,'{}'),
 ('00000000-0000-0000-0000-0000000000d8','00000000-0000-0000-0000-0000000000a1','88888888-8888-8888-8888-888888888888','Ehemalig','verantwortlicher',false,'{}'),
 ('00000000-0000-0000-0000-0000000000db','00000000-0000-0000-0000-0000000000a1','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Prüfer alt','pruefer',false,'{zbp}');
insert into bereich_verantwortung (organisation_id, mitgliedschaft_id, bereich_id) values
 ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000d8','00000000-0000-0000-0000-0000000000c2');
select 'Service: Prüfertypen nur bei Prüfern (erw. {}): ' || q($$select pruefer_typen from mitgliedschaft where id='00000000-0000-0000-0000-0000000000d5'$$);

set role authenticated;
\pset tuples_only on
\pset format unaligned

\echo '== Mitgliedschaft aktiv'
set request.jwt.claim.sub = '88888888-8888-8888-8888-888888888888';
select 'Deaktivierter VER sieht Geräte (erw. 0): ' || q($$select count(*) from geraet$$);
select 'Deaktivierter VER sieht Organisation (erw. 0): ' || q($$select count(*) from organisation$$);
select 'Deaktivierter VER erfasst Anlass (erw. FEHLER): ' || t($$insert into anlass (organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f2','sonstiges',app.heute(),'Test Anlass')$$);
set request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';
select 'Admin Org B sieht Geräte Org A (erw. 0): ' || q($$select count(*) from geraet$$);
select 'Admin Org B Mangel in Org A (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','Fremder Mangel','gering',app.heute())$$);

\echo '== Prüfer-Zuweisung und GBU-Verweis'
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'ADM setzt Frist (erw. FEHLER): ' || t($$update geraet_pruefart set frist_monate=6, frist_quelle='gbu', frist_stufe='C', frist_fundstelle='GBU', frist_begruendung='Begründung lang genug' where id='00000000-0000-0000-0000-0000000000f3'$$);
select 'ADM frist_setzen RPC (erw. FEHLER): ' || t($$select frist_setzen('00000000-0000-0000-0000-0000000000f3','{"frist_monate":6,"frist_quelle":"gbu","frist_stufe":"C","frist_fundstelle":"GBU","frist_begruendung":"Begründung lang genug"}'::jsonb, null)$$);
select 'ADM weist Prüfer zu (erw. OK 1): ' || t($$update geraet_pruefart set zugewiesener_pruefer_id='44444444-4444-4444-4444-444444444444' where id='00000000-0000-0000-0000-0000000000f4'$$);
select 'Ereignis pruefer_zugewiesen mit Name (erw. Tobias): ' || q($$select daten->>'neuName' from ereignis where typ='pruefer_zugewiesen'$$);
select 'ADM weist Sifa als Prüfer zu (erw. FEHLER): ' || t($$update geraet_pruefart set zugewiesener_pruefer_id='22222222-2222-2222-2222-222222222222' where id='00000000-0000-0000-0000-0000000000f5'$$);
select 'ADM weist deaktivierten Prüfer zu (erw. FEHLER): ' || t($$update geraet_pruefart set zugewiesener_pruefer_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where id='00000000-0000-0000-0000-0000000000f5'$$);
select 'ADM setzt GBU-Verweis (erw. FEHLER): ' || t($$update geraet_pruefart set gbu_dokument_titel='GBU' where id='00000000-0000-0000-0000-0000000000f5'$$);
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER Lager weist Prüfart in Produktion zu (erw. OK 0): ' || t($$update geraet_pruefart set zugewiesener_pruefer_id='44444444-4444-4444-4444-444444444444' where id='00000000-0000-0000-0000-0000000000f5'$$);
select 'VER Lager weist eigene Prüfart zu (erw. OK 1): ' || t($$update geraet_pruefart set zugewiesener_pruefer_id='44444444-4444-4444-4444-444444444444' where id='00000000-0000-0000-0000-0000000000f6'$$);
select 'VER entfernt Zuweisung (erw. OK 1): ' || t($$update geraet_pruefart set zugewiesener_pruefer_id=null where id='00000000-0000-0000-0000-0000000000f6'$$);
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'SIF weist Prüfer zu (erw. FEHLER): ' || t($$update geraet_pruefart set zugewiesener_pruefer_id='66666666-6666-6666-6666-666666666666' where id='00000000-0000-0000-0000-0000000000f5'$$);
select 'SIF GBU-Link http (erw. FEHLER): ' || t($$update geraet_pruefart set gbu_dokument_titel='GBU Kran', gbu_dokument_url='http://x' where id='00000000-0000-0000-0000-0000000000f5'$$);
select 'SIF GBU-Link ohne Titel (erw. FEHLER): ' || t($$update geraet_pruefart set gbu_dokument_url='https://x' where id='00000000-0000-0000-0000-0000000000f5'$$);
select 'SIF GBU-Verweis https (erw. OK 1): ' || t($$update geraet_pruefart set gbu_dokument_titel='GBU Kran 2025', gbu_dokument_url='https://intranet.example/gbu' where id='00000000-0000-0000-0000-0000000000f5'$$);
select 'Ereignis gbu_dokument_gesetzt (erw. GBU Kran 2025): ' || q($$select daten->'neu'->>'titel' from ereignis where typ='gbu_dokument_gesetzt'$$);

\echo '== Frist mit Nachweisbezug (F-13)'
select 'frist_setzen mit Nachweis anderer Prüfart (erw. FEHLER): ' || t($$select frist_setzen('00000000-0000-0000-0000-0000000000f2','{"frist_monate":6,"frist_quelle":"gbu","frist_stufe":"C","frist_fundstelle":"GBU Kran","frist_begruendung":"nach Prüfung bestätigt"}'::jsonb, '00000000-0000-0000-0000-000000000303')$$);
select 'frist_setzen mit eigenem Nachweis (erw. OK 1): ' || t($$select frist_setzen('00000000-0000-0000-0000-0000000000f2','{"frist_monate":3,"frist_quelle":"gbu","frist_stufe":"C","frist_fundstelle":"GBU Kran","frist_begruendung":"nach Prüfung verkürzt"}'::jsonb, '00000000-0000-0000-0000-000000000201')$$);
select 'Ereignis richtung + nachweisId (erw. kuerzer|00000000-0000-0000-0000-000000000201): ' || q($$select (daten->>'richtung') || '|' || (daten->>'nachweisId') from ereignis where typ='frist_freigegeben' and daten->>'nachweisId' is not null$$);
select 'frist_setzen über Herstellerfrist (erw. FEHLER): ' || t($$select frist_setzen('00000000-0000-0000-0000-0000000000f2','{"frist_monate":24,"frist_quelle":"gbu","frist_stufe":"C","frist_fundstelle":"GBU Kran","frist_begruendung":"Verlängerung gewünscht"}'::jsonb, null)$$);

\echo '== Gerät verschieben und Betriebsstatus'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER verschiebt in fremden Bereich (erw. FEHLER): ' || t($$select geraet_verschieben('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000c2','Test')$$);
select 'VER verschiebt direkt per UPDATE (erw. FEHLER): ' || t($$update geraet set bereich_id='00000000-0000-0000-0000-0000000000c2' where id='00000000-0000-0000-0000-0000000000e1'$$);
select 'VER ändert Bezeichnung (erw. FEHLER): ' || t($$update geraet set bezeichnung='Neu' where id='00000000-0000-0000-0000-0000000000e1'$$);
select 'VER verschiebt fremdes Gerät (erw. FEHLER): ' || t($$select geraet_verschieben('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000c1',null)$$);
select 'VER setzt ausgemustert (erw. FEHLER): ' || t($$update geraet set betriebsstatus='ausgemustert' where id='00000000-0000-0000-0000-0000000000e1'$$);
select 'VER außer Betrieb (erw. OK 1): ' || t($$select betriebsstatus_setzen('00000000-0000-0000-0000-0000000000e1','ausser_betrieb','Reparatur')$$);
select 'Ereignis betriebsstatus (erw. ausser_betrieb|Reparatur): ' || q($$select (daten->>'neu') || '|' || (daten->>'begruendung') from ereignis where typ='betriebsstatus_geaendert'$$);
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 'PRF setzt Betriebsstatus (erw. FEHLER): ' || t($$select betriebsstatus_setzen('00000000-0000-0000-0000-0000000000e2','ausser_betrieb',null)$$);

\echo '== Anlass'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER Anlass eigener Bereich (erw. OK 1): ' || t($$insert into anlass (id, organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung) values ('00000000-0000-0000-0000-000000000a01','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000f6','unfall_schadensfall',app.heute(),'Anfahrschaden Mast')$$);
select 'VER Anlass Produktion (erw. FEHLER): ' || t($$insert into anlass (organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f2','sonstiges',app.heute(),'Fremder Bereich')$$);
select 'VER Anlass morgen (erw. FEHLER): ' || t($$insert into anlass (organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000f6','sonstiges',app.heute()+1,'Zukunft')$$);
select 'VER Anlass Prüfart fremdes Gerät (erw. FEHLER): ' || t($$insert into anlass (organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000f2','sonstiges',app.heute(),'Falscher Bezug')$$);
select 'VER Anlass bereits aufgehoben (erw. FEHLER): ' || t($$insert into anlass (organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung, aufhebungsgrund, aufgehoben_am) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000f6','sonstiges',app.heute(),'Schon weg','lange Begründung hier',now())$$);
select 'VER Anlass aufheben kurzer Grund (erw. FEHLER): ' || t($$update anlass set aufhebungsgrund='kurz' where id='00000000-0000-0000-0000-000000000a01'$$);
select 'VER Anlass Beschreibung ändern (erw. FEHLER): ' || t($$update anlass set beschreibung='Anders beschrieben' where id='00000000-0000-0000-0000-000000000a01'$$);
select 'VER Anlass aufheben (erw. OK 1): ' || t($$update anlass set aufhebungsgrund='versehentlich doppelt erfasst' where id='00000000-0000-0000-0000-000000000a01'$$);
select 'Aufhebung gestempelt (erw. Marco): ' || q($$select aufgehoben_von_name from anlass where id='00000000-0000-0000-0000-000000000a01'$$);
select 'VER Anlass zweimal aufheben (erw. FEHLER): ' || t($$update anlass set aufhebungsgrund='nochmal aufgehoben jetzt' where id='00000000-0000-0000-0000-000000000a01'$$);
select 'VER Anlass löschen (erw. FEHLER): ' || t($$delete from anlass where id='00000000-0000-0000-0000-000000000a01'$$);
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'ADM Anlass (erw. FEHLER): ' || t($$insert into anlass (organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000f6','sonstiges',app.heute(),'Admin darf nicht')$$);
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'SIF Anlass Produktion (erw. OK 1): ' || t($$insert into anlass (organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f3','naturereignis',app.heute(),'Sturmschaden Halle')$$);
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 'PRF sieht nur Anlass zugewiesener Prüfart (erw. naturereignis): ' || q($$select art from anlass$$);
select 'PRF erfasst Anlass (erw. FEHLER): ' || t($$insert into anlass (organisation_id, geraet_id, geraet_pruefart_id, art, datum, beschreibung) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f3','sonstiges',app.heute(),'Prüfer darf nicht')$$);

\echo '== Mangel'
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'SIF Mangel Produktion mit Verantwortlichem (erw. OK 1): ' || t($$insert into mangel (id, organisation_id, geraet_id, geraet_pruefart_id, beschreibung, schwere, termin, verantwortlich_id) values ('00000000-0000-0000-0000-000000000b01','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f3','Isolation beschädigt','gefaehrlich',app.heute(),'22222222-2222-2222-2222-222222222222')$$);
select 'SIF Mangel Verantwortlicher = Prüfer (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin, verantwortlich_id) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','Falscher Verantwortlicher','gering',app.heute(),'44444444-4444-4444-4444-444444444444')$$);
select 'SIF Mangel mit Nachweis anderer Prüfart (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, geraet_pruefart_id, nachweis_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f3','00000000-0000-0000-0000-000000000201','Bezug falsch','gering',app.heute())$$);
select 'SIF Mangel Nachweis ohne Prüfart (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, nachweis_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-000000000201','Bezug fehlt','gering',app.heute())$$);
select 'SIF Mangel mit Status behoben (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin, status, behoben_am, behoben_durch, behebung, behebung_erfasst_am) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','Gleich behoben','gering',app.heute(),'behoben',app.heute(),'Firma','Getauscht',now())$$);
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER Mangel Lager (erw. OK 1): ' || t($$insert into mangel (id, organisation_id, geraet_id, geraet_pruefart_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-000000000b02','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000f6','Gabel verbogen','erheblich',app.heute()+30)$$);
select 'VER Mangel Produktion (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','Fremder Bereich','gering',app.heute())$$);
select 'VER Mangel Termin gestern (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','Termin vorbei','gering',app.heute()-1)$$);
select 'VER Lager sieht keine Produktion-Mängel (erw. 00000000-0000-0000-0000-000000000b02): ' || q($$select id from mangel$$);
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 'PRF Mangel nicht zugewiesene Prüfart (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, geraet_pruefart_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f2','Nicht meins','gering',app.heute())$$);
select 'PRF Mangel ohne Prüfart (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','Ohne Prüfart','gering',app.heute())$$);
select 'PRF Mangel mit Verantwortlichem (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, geraet_pruefart_id, beschreibung, schwere, termin, verantwortlich_id) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f3','Mit Verantwortlichem','gering',app.heute(),'22222222-2222-2222-2222-222222222222')$$);
select 'PRF Mangel zugewiesene Prüfart aus Nachweis (erw. OK 1): ' || t($$insert into mangel (id, organisation_id, geraet_id, geraet_pruefart_id, nachweis_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-000000000b03','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f3','00000000-0000-0000-0000-000000000303','Schutzleiter fehlt','erheblich',app.heute()+30)$$);
select 'PRF sieht nur Mängel zugewiesener Prüfarten (erw. 2): ' || q($$select count(*) from mangel$$);
select 'PRF bearbeitet Mangel (erw. OK 0): ' || t($$update mangel set status='in_bearbeitung', verantwortlich_id='22222222-2222-2222-2222-222222222222' where id='00000000-0000-0000-0000-000000000b03'$$);
set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';
select 'PRF2 sieht Mängel fremder Prüfart (erw. 0): ' || q($$select count(*) from mangel$$);
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER Kenntnis mit Prüfer als Verantwortlichem (erw. FEHLER): ' || t($$update mangel set status='in_bearbeitung', verantwortlich_id='44444444-4444-4444-4444-444444444444' where id='00000000-0000-0000-0000-000000000b02'$$);
select 'VER Kenntnis ohne Verantwortlichen (erw. FEHLER): ' || t($$update mangel set status='in_bearbeitung' where id='00000000-0000-0000-0000-000000000b02'$$);
select 'VER Kenntnis (erw. OK 1): ' || t($$update mangel set status='in_bearbeitung', verantwortlich_id='33333333-3333-3333-3333-333333333333', termin=app.heute()+20 where id='00000000-0000-0000-0000-000000000b02'$$);
select 'Kenntnis gestempelt (erw. Marco): ' || q($$select kenntnis_von_name from mangel where id='00000000-0000-0000-0000-000000000b02'$$);
select 'VER in_bearbeitung → offen (erw. FEHLER): ' || t($$update mangel set status='offen' where id='00000000-0000-0000-0000-000000000b02'$$);
select 'VER Beschreibung ändern (erw. FEHLER): ' || t($$update mangel set beschreibung='Neue Beschreibung' where id='00000000-0000-0000-0000-000000000b02'$$);
select 'VER Behebung in der Zukunft (erw. FEHLER): ' || t($$update mangel set status='behoben', behoben_am=app.heute()+1, behoben_durch='Werkstatt', behebung='Gabel getauscht' where id='00000000-0000-0000-0000-000000000b02'$$);
select 'VER behebt (erw. OK 1): ' || t($$update mangel set status='behoben', behoben_am=app.heute(), behoben_durch='Werkstatt', behebung='Gabel getauscht' where id='00000000-0000-0000-0000-000000000b02'$$);
select 'VER behoben → offen (erw. FEHLER): ' || t($$update mangel set status='offen', behoben_am=null, behoben_durch=null, behebung=null, behebung_erfasst_am=null where id='00000000-0000-0000-0000-000000000b02'$$);
select 'VER behoben → behoben (erw. FEHLER): ' || t($$update mangel set behoben_durch='Andere Firma' where id='00000000-0000-0000-0000-000000000b02'$$);
select 'VER Mangel löschen (erw. FEHLER): ' || t($$delete from mangel where id='00000000-0000-0000-0000-000000000b02'$$);
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'ADM behebt offen direkt (erw. OK 1): ' || t($$update mangel set status='behoben', behoben_am=app.heute(), behoben_durch='Elektro Richter', behebung='Kabel ersetzt' where id='00000000-0000-0000-0000-000000000b01'$$);
select 'ADM erfasst Mangel (erw. FEHLER): ' || t($$insert into mangel (organisation_id, geraet_id, beschreibung, schwere, termin) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','Admin erfasst','gering',app.heute())$$);
select 'Mängel-Ereignisse (erw. mangel_behoben,mangel_behoben,mangel_erfasst,mangel_erfasst,mangel_erfasst,mangel_kenntnis): ' || q($$select typ from ereignis where typ like 'mangel%'$$);

\echo '== Verwaltung'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER legt Bereich an (erw. FEHLER): ' || t($$insert into bereich (organisation_id, standort_id, name, einsatzort) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b1','Versand','lager_logistik')$$);
select 'VER legt Mitgliedschaft an (erw. FEHLER): ' || t($$select mitglied_speichern('{"organisation_id":"00000000-0000-0000-0000-0000000000a1","benutzer_id":"99999999-9999-9999-9999-999999999999","anzeigename":"Neu","rolle":"admin"}'::jsonb, '{}')$$);
select 'VER löscht Bereichszuordnung (erw. OK 0): ' || t($$delete from bereich_verantwortung$$);
select 'VER ändert eigene Rolle (erw. OK 0): ' || t($$update mitgliedschaft set rolle='admin' where benutzer_id='33333333-3333-3333-3333-333333333333'$$);
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'ADM legt Bereich an (erw. OK 1): ' || t($$insert into bereich (id, organisation_id, standort_id, name, einsatzort) values ('00000000-0000-0000-0000-0000000000c4','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b1','Versand','lager_logistik')$$);
select 'ADM ändert Einsatzort (erw. OK 1): ' || t($$update bereich set einsatzort='baustelle' where id='00000000-0000-0000-0000-0000000000c4'$$);
select 'Ereignisse bereich_gespeichert (erw. baustelle,lager_logistik): ' || q($$select daten->>'einsatzort' from ereignis where typ='bereich_gespeichert' and daten->>'bereichId'='00000000-0000-0000-0000-0000000000c4'$$);
select 'ADM lädt VER ein (erw. OK 1): ' || t($$select mitglied_speichern('{"id":"00000000-0000-0000-0000-0000000000d9","organisation_id":"00000000-0000-0000-0000-0000000000a1","benutzer_id":"99999999-9999-9999-9999-999999999999","anzeigename":"Neue Kollegin","email":"neu@example.org","rolle":"verantwortlicher","aktiv":true,"pruefer_typen":["zbp"],"eingeladen":true}'::jsonb, '{00000000-0000-0000-0000-0000000000c1}')$$);
select 'Prüfertypen bei VER verworfen (erw. {}): ' || q($$select pruefer_typen from mitgliedschaft where id='00000000-0000-0000-0000-0000000000d9'$$);
select 'ADM ändert Bereiche atomar (erw. OK 1): ' || t($$select mitglied_speichern('{"id":"00000000-0000-0000-0000-0000000000d9","organisation_id":"00000000-0000-0000-0000-0000000000a1","benutzer_id":"99999999-9999-9999-9999-999999999999","anzeigename":"Neue Kollegin","email":"neu@example.org","rolle":"verantwortlicher","aktiv":true}'::jsonb, '{00000000-0000-0000-0000-0000000000c2,00000000-0000-0000-0000-0000000000c4}')$$);
select 'Bereichsmenge ersetzt (erw. 00000000-0000-0000-0000-0000000000c2,00000000-0000-0000-0000-0000000000c4): ' || q($$select bereich_id from bereich_verantwortung where mitgliedschaft_id='00000000-0000-0000-0000-0000000000d9'$$);
select 'mitglied_gespeichert je Speichern genau einmal (erw. false|2,true|1): ' || q($$select (daten->>'eingeladen') || '|' || jsonb_array_length(daten->'bereichIds') from ereignis where typ='mitglied_gespeichert' and daten->>'mitgliedschaftId'='00000000-0000-0000-0000-0000000000d9'$$);
select 'ADM doppelte Mitgliedschaft (erw. FEHLER): ' || t($$select mitglied_speichern('{"organisation_id":"00000000-0000-0000-0000-0000000000a1","benutzer_id":"99999999-9999-9999-9999-999999999999","anzeigename":"Doppelt","rolle":"sifa"}'::jsonb, '{}')$$);
select 'ADM deaktiviert sich selbst (erw. FEHLER): ' || t($$update mitgliedschaft set aktiv=false where id='00000000-0000-0000-0000-0000000000d1'$$);
select 'ADM ändert eigene Rolle (erw. FEHLER): ' || t($$update mitgliedschaft set rolle='sifa' where id='00000000-0000-0000-0000-0000000000d1'$$);
select 'ADM stuft zweiten Admin herab (erw. OK 1): ' || t($$update mitgliedschaft set rolle='sifa' where id='00000000-0000-0000-0000-0000000000d5'$$);
select 'ADM ändert Mitgliedschaft Org B (erw. OK 0): ' || t($$update mitgliedschaft set anzeigename='X' where id='00000000-0000-0000-0000-0000000000d7'$$);
select 'ADM löscht Bereichszuordnung (erw. OK 1): ' || t($$delete from bereich_verantwortung where mitgliedschaft_id='00000000-0000-0000-0000-0000000000d9' and bereich_id='00000000-0000-0000-0000-0000000000c4'$$);
set request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';
select 'Neuer VER sieht nur Produktion-Gerät (erw. Kran): ' || q($$select bezeichnung from geraet$$);
reset role;
set request.jwt.claim.sub = '';
select 'Letzter aktiver Admin nicht deaktivierbar (erw. FEHLER): ' || t($$update mitgliedschaft set aktiv=false where id='00000000-0000-0000-0000-0000000000d1'$$);
select 'Letzter aktiver Admin nicht herabstufbar (erw. FEHLER): ' || t($$update mitgliedschaft set rolle='sifa' where id='00000000-0000-0000-0000-0000000000d7'$$);
set role authenticated;

\echo '== Einladung'
select 'Client darf Konten nicht per E-Mail suchen (erw. FEHLER): ' || t($$select benutzer_id_fuer_email('prf')$$);
reset role;
select 'Service findet Konto per E-Mail (erw. 44444444-4444-4444-4444-444444444444): ' || coalesce(benutzer_id_fuer_email(' PRF ')::text, '-');
set role authenticated;

\echo '== Verschieben als Admin'
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'ADM verschiebt Lager → Produktion (erw. OK 1): ' || t($$select geraet_verschieben('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000c2','Umzug Halle 2')$$);
select 'Ereignis mit Bereichsnamen (erw. Lager|Produktion|Umzug Halle 2): ' || q($$select (daten->>'vonBereich') || '|' || (daten->>'nachBereich') || '|' || (daten->>'begruendung') from ereignis where typ='geraet_verschoben'$$);
select 'Frist bleibt beim Verschieben (erw. 12): ' || q($$select frist_monate from geraet_pruefart where id='00000000-0000-0000-0000-0000000000f6'$$);
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'Lager-VER sieht verschobenes Gerät nicht mehr (erw. 0): ' || q($$select count(*) from geraet where id='00000000-0000-0000-0000-0000000000e1'$$);
