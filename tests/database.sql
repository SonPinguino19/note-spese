\set ON_ERROR_STOP on
insert into auth.users values
('00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000002'),
('00000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000004');
insert into public.members values
('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into public.expenses(id,date,payload) values
('20000000-0000-0000-0000-000000000001','2026-01-01','{"date":"2026-01-01","amount":-1250,"kind":"expense","description":"Synthetic expense","person":"A","account":"Test"}');
do $$ begin
 if (select count(*) from public.expenses)<>1 then raise exception 'Inserimento non visibile al proprietario'; end if;
 begin
  insert into public.expenses(id,date,payload) values ('20000000-0000-0000-0000-000000000099','2026-01-01','{}');
  raise exception 'Payload incompleto accettato';
 exception when check_violation then null; end;
 begin
  update public.expenses set household_id='10000000-0000-0000-0000-000000000002';
  raise exception 'Spostamento in altro nucleo accettato';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.members values ('00000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001');
  raise exception 'Autoassegnazione membership accettata';
 exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$ begin
 if (select count(*) from public.expenses)<>1 then raise exception 'Partner non vede il movimento'; end if;
 update public.expenses set payload=jsonb_set(payload,'{description}','"Updated by partner"');
 if not found then raise exception 'Partner non può aggiornare'; end if;
end $$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
do $$ begin
 if (select count(*) from public.expenses)<>0 then raise exception 'Lettura tra nuclei non isolata'; end if;
 delete from public.expenses;
 if found then raise exception 'Cancellazione tra nuclei permessa'; end if;
end $$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
do $$ begin
 begin
  insert into public.expenses(id,date,payload) values ('20000000-0000-0000-0000-000000000004','2026-01-01','{"date":"2026-01-01","amount":-100,"kind":"expense","description":"Test","person":"A","account":"Test"}');
  raise exception 'Utente senza membership accettato';
 exception when raise_exception then
  if sqlerrm<>'Utente non associato a un nucleo' then raise; end if;
 end;
end $$;
reset role;
set role anon;
do $$ begin
 begin
  perform * from public.expenses;
  raise exception 'Accesso anonimo permesso';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if (select count(*) from public.expenses)<>1 then raise exception 'Dati alterati da accesso non autorizzato'; end if;
 raise notice 'Permessi verificati: autore, partner, altro nucleo, anonimo, utente non associato; payload incompleti respinti.';
end $$;
