-- Szenario für tests/migration.test.ts (DB-Teil). Jede Zeile: "<Fall> (erw. <Erwartung>): <Ergebnis>".
\set ON_ERROR_STOP 1
create or replace function public.t(sql text) returns text language plpgsql as $$
declare n bigint;
begin
  execute sql; get diagnostics n = row_count; return 'OK ' || n;
exception when others then return 'FEHLER ' || sqlerrm;
end $$;
create or replace function public.q(sql text) returns text language plpgsql as $$
declare r text;
begin execute 'select string_agg(x::text, '','' order by x::text) from (' || sql || ') s(x)' into r; return coalesce(r,'-'); end $$;
grant execute on function public.t(text), public.q(text) to authenticated;

insert into auth.users values ('11111111-1111-1111-1111-111111111111','adm'),('22222222-2222-2222-2222-222222222222','sif'),('33333333-3333-3333-3333-333333333333','ver'),('44444444-4444-4444-4444-444444444444','prf'),('66666666-6666-6666-6666-666666666666','prf2');
insert into organisation values ('00000000-0000-0000-0000-0000000000a1','Elbtal',null);
insert into standort values ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a1','Hauptwerk');
insert into bereich values ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b1','Lager','lager_logistik'),
 ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b1','Produktion','werkstatt_fertigung');
insert into mitgliedschaft (id, organisation_id, benutzer_id, anzeigename, rolle) values
 ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000a1','11111111-1111-1111-1111-111111111111','Katrin','admin'),
 ('00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-0000000000a1','22222222-2222-2222-2222-222222222222','Jens','sifa'),
 ('00000000-0000-0000-0000-0000000000d3','00000000-0000-0000-0000-0000000000a1','33333333-3333-3333-3333-333333333333','Marco','verantwortlicher'),
 ('00000000-0000-0000-0000-0000000000d4','00000000-0000-0000-0000-0000000000a1','44444444-4444-4444-4444-444444444444','Tobias','pruefer'),
 ('00000000-0000-0000-0000-0000000000d6','00000000-0000-0000-0000-0000000000a1','66666666-6666-6666-6666-666666666666','Paul','pruefer');
insert into bereich_verantwortung (organisation_id, mitgliedschaft_id, bereich_id) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000d3','00000000-0000-0000-0000-0000000000c1');
insert into katalog_eintrag (id, schluessel, version, geraetegruppe, geraetegruppe_label, pruefart, einsatzort, intervall_monate, stufe, fundstelle, quelle_url, pruefer_typen, freigabestatus, freigegeben_von, freigegeben_am) values
 ('00000000-0000-0000-0000-00000000aa01','kran.w',1,'kran','Kran','WP',null,12,'A','BetrSichV','https://x','{zbp}','freigegeben','SI','2026-01-01'),
 ('00000000-0000-0000-0000-00000000aa02','leiter.w',1,'leiter','Leiter','WP',null,6,'A','DGUV','https://x','{zbp}','freigegeben','SI','2026-01-01'),
 ('00000000-0000-0000-0000-00000000aa03','leiter.w',1,'leiter','Leiter','WP','werkstatt_fertigung',24,'B','DGUV','https://x','{zbp}','freigegeben','SI','2026-01-01'),
 ('00000000-0000-0000-0000-00000000aa04','stapler.w',1,'stapler','Stapler','WP',null,6,'A','alt','https://x','{zbp}','freigegeben','SI','2026-01-01'),
 ('00000000-0000-0000-0000-00000000aa05','stapler.w',2,'stapler','Stapler','WP',null,12,'A','neu','https://x','{zbp}','freigegeben','SI','2026-01-01');
insert into geraet (id, organisation_id, bereich_id, bezeichnung, geraetegruppe, kategorie) values
 ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Stapler','stapler','wechselnd'),
 ('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c2','Kran','kran','ortsgebunden');
insert into geraet_pruefart (id, organisation_id, geraet_id, katalog_schluessel, bezeichnung, herstellerfrist_monate, zugewiesener_pruefer_id) values
 ('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','kran.w','Kranprüfung',6,'66666666-6666-6666-6666-666666666666'),
 ('00000000-0000-0000-0000-0000000000f3','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2',null,'Elektroprüfung',null,'44444444-4444-4444-4444-444444444444'),
 ('00000000-0000-0000-0000-0000000000f4','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','kran.w','Kran 2',null,null),
 ('00000000-0000-0000-0000-0000000000f5','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','leiter.w','Leiter',null,null),
 ('00000000-0000-0000-0000-0000000000f6','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','stapler.w','Stapler',null,null);
-- Nachweis + PDF zur Kranprüfung (f2) als Service
insert into nachweis (id, organisation_id, geraet_id, geraet_pruefart_id, pruefdatum, ergebnis, pruefumfang, pruefer_name, unterschrift_im_pdf, pdf_pfad, pdf_sha256, erfasst_von)
values ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f2', current_date - 1,'ohne_maengel','Kran','Paul',true,
 '00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-0000000000e2/00000000-0000-0000-0000-0000000000f2/00000000-0000-0000-0000-000000000201.pdf', repeat('a',64), '66666666-6666-6666-6666-666666666666');
insert into storage.objects (bucket_id, name) values ('nachweise','00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-0000000000e2/00000000-0000-0000-0000-0000000000f2/00000000-0000-0000-0000-000000000201.pdf');

set role authenticated;
\pset tuples_only on
\pset format unaligned
\echo '== 1 Storage'
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 'PRF sieht Kran-PDF (erw. 0): ' || q($$select count(*) from storage.objects$$);
select 'PRF Upload in Kran-Ordner (erw. FEHLER): ' || t($$insert into storage.objects (bucket_id, name) values ('nachweise','00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-0000000000e2/00000000-0000-0000-0000-0000000000f2/00000000-0000-0000-0000-000000000301.pdf')$$);
select 'PRF Upload beliebiger Name (erw. FEHLER): ' || t($$insert into storage.objects (bucket_id, name) values ('nachweise','00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-0000000000e2/00000000-0000-0000-0000-0000000000f3/boese.exe')$$);
select 'PRF Upload alter Pfad ohne Prüfart (erw. FEHLER): ' || t($$insert into storage.objects (bucket_id, name) values ('nachweise','00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-0000000000e2/00000000-0000-0000-0000-000000000302.pdf')$$);
select 'PRF Upload in Elektro-Ordner (erw. OK 1): ' || t($$insert into storage.objects (bucket_id, name) values ('nachweise','00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-0000000000e2/00000000-0000-0000-0000-0000000000f3/00000000-0000-0000-0000-000000000303.pdf')$$);
set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';
select 'PRF2 sieht Kran-PDF (erw. 1): ' || q($$select count(*) from storage.objects where name like '%201.pdf'$$);
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'SIF sieht Kran-PDF (erw. 1): ' || q($$select count(*) from storage.objects where name like '%201.pdf'$$);
\echo '== 5 Nachweis'
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select 'PRF Nachweis fremde pruefer_benutzer_id (erw. FEHLER): ' || t($$insert into nachweis (id, organisation_id, geraet_id, geraet_pruefart_id, pruefdatum, ergebnis, pruefumfang, pruefer_name, pruefer_benutzer_id, unterschrift_im_pdf, pdf_pfad, pdf_sha256) values ('00000000-0000-0000-0000-000000000303','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f3', current_date,'ohne_maengel','Elektro','Tobias','66666666-6666-6666-6666-666666666666',true,'00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-0000000000e2/00000000-0000-0000-0000-0000000000f3/00000000-0000-0000-0000-000000000303.pdf', repeat('b',64))$$);
select 'PRF Nachweis eigene pruefer_benutzer_id (erw. OK 1): ' || t($$insert into nachweis (id, organisation_id, geraet_id, geraet_pruefart_id, pruefdatum, ergebnis, pruefumfang, pruefer_name, pruefer_benutzer_id, unterschrift_im_pdf, pdf_pfad, pdf_sha256) values ('00000000-0000-0000-0000-000000000303','00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000f3', current_date,'ohne_maengel','Elektro','Tobias','44444444-4444-4444-4444-444444444444',true,'00000000-0000-0000-0000-0000000000a1/00000000-0000-0000-0000-0000000000e2/00000000-0000-0000-0000-0000000000f3/00000000-0000-0000-0000-000000000303.pdf', repeat('b',64))$$);
select 'PRF sieht eigenes PDF (erw. 1): ' || q($$select count(*) from storage.objects$$);
\echo '== 4 Prüfart anlegen'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select 'VER mit Frist (erw. FEHLER): ' || t($$insert into geraet_pruefart (organisation_id, geraet_id, bezeichnung, frist_monate, frist_quelle, frist_stufe, frist_fundstelle, frist_begruendung) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','Extra',120,'gbu','C','GBU','lange Begründung hier')$$);
select 'VER letzte_pruefung morgen (erw. FEHLER): ' || t($$insert into geraet_pruefart (organisation_id, geraet_id, bezeichnung, letzte_pruefung, letzte_pruefung_herkunft) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','Extra',(now() at time zone 'Europe/Berlin')::date + 1,'plakette')$$);
select 'VER Herkunft nachweis (erw. FEHLER): ' || t($$insert into geraet_pruefart (organisation_id, geraet_id, bezeichnung, letzte_pruefung, letzte_pruefung_herkunft) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','Extra',current_date - 10,'nachweis')$$);
select 'VER gültig (erw. OK 1): ' || t($$insert into geraet_pruefart (organisation_id, geraet_id, bezeichnung, letzte_pruefung, letzte_pruefung_herkunft) values ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000e1','Extra',current_date - 10,'plakette')$$);
\echo '== 3 Katalogzweig'
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'Katalog falsche Stufe (erw. FEHLER): ' || t($$update geraet_pruefart set frist_monate=12, frist_quelle='katalog', frist_stufe='C', frist_fundstelle='BetrSichV', frist_katalog_eintrag_id='00000000-0000-0000-0000-00000000aa01', frist_katalog_version=1 where id='00000000-0000-0000-0000-0000000000f4'$$);
select 'Katalog fremder Schlüssel (erw. FEHLER): ' || t($$update geraet_pruefart set frist_monate=24, frist_quelle='katalog', frist_stufe='B', frist_fundstelle='DGUV', frist_katalog_eintrag_id='00000000-0000-0000-0000-00000000aa03', frist_katalog_version=1 where id='00000000-0000-0000-0000-0000000000f4'$$);
select 'Katalog trotz kürzerer Herstellerfrist (erw. FEHLER): ' || t($$update geraet_pruefart set frist_monate=12, frist_quelle='katalog', frist_stufe='A', frist_fundstelle='BetrSichV', frist_katalog_eintrag_id='00000000-0000-0000-0000-00000000aa01', frist_katalog_version=1 where id='00000000-0000-0000-0000-0000000000f2'$$);
select 'Katalog korrekt (erw. OK 1): ' || t($$update geraet_pruefart set frist_monate=12, frist_quelle='katalog', frist_stufe='A', frist_fundstelle='BetrSichV', frist_katalog_eintrag_id='00000000-0000-0000-0000-00000000aa01', frist_katalog_version=1 where id='00000000-0000-0000-0000-0000000000f4'$$);
select 'Hersteller mit Stufe A (erw. OK 1): ' || t($$update geraet_pruefart set frist_monate=6, frist_quelle='hersteller', frist_stufe='A', frist_fundstelle='Hersteller' where id='00000000-0000-0000-0000-0000000000f2'$$);
select 'Stufe gespeichert (erw. C): ' || q($$select frist_stufe from geraet_pruefart where id='00000000-0000-0000-0000-0000000000f2'$$);
\echo '== 6 Stufe-A-Höchstfrist nach F-2'
select 'GBU 12 Leiter Werkstatt, exakter B-Eintrag gewinnt (erw. OK 1): ' || t($$update geraet_pruefart set frist_monate=12, frist_quelle='gbu', frist_stufe='A', frist_fundstelle='GBU', frist_begruendung='Begründung lang genug' where id='00000000-0000-0000-0000-0000000000f5'$$);
select 'GBU-Stufe gespeichert (erw. C): ' || q($$select frist_stufe from geraet_pruefart where id='00000000-0000-0000-0000-0000000000f5'$$);
select 'GBU 12 Stapler, v2 gilt (erw. OK 1): ' || t($$update geraet_pruefart set frist_monate=12, frist_quelle='gbu', frist_stufe='C', frist_fundstelle='GBU', frist_begruendung='Begründung lang genug' where id='00000000-0000-0000-0000-0000000000f6'$$);
select 'GBU 13 Stapler (erw. FEHLER): ' || t($$update geraet_pruefart set frist_monate=13, frist_quelle='gbu', frist_stufe='C', frist_fundstelle='GBU', frist_begruendung='Begründung lang genug' where id='00000000-0000-0000-0000-0000000000f6'$$);
