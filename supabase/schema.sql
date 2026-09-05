-- Eseguire nel SQL Editor di un progetto Supabase dedicato.
-- Creare i due utenti da Authentication prima di assegnare le membership.
create table public.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null
);
alter table public.members enable row level security;
create policy own_membership on public.members for select to authenticated using(user_id=auth.uid());
create table public.expenses (
  id uuid primary key,
  household_id uuid not null default (nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'household_id')::uuid,
  date date not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint amount_integer check(jsonb_typeof(payload->'amount')='number' and (payload->>'amount')::numeric=trunc((payload->>'amount')::numeric)),
  constraint consistent_date check(payload->>'date'=date::text)
);
-- Derivazione della famiglia dalla membership, mai da input del browser.
create function public.assign_household() returns trigger language plpgsql set search_path='' as $$
begin
 select household_id into new.household_id from public.members where user_id=auth.uid();
 if new.household_id is null then raise exception 'Utente non associato a un nucleo'; end if;
 return new;
end; $$;
create trigger expense_household before insert on public.expenses for each row execute function public.assign_household();
alter table public.expenses enable row level security;
create policy household_expenses on public.expenses for all to authenticated
using(household_id in(select household_id from public.members where user_id=auth.uid()))
with check(household_id in(select household_id from public.members where user_id=auth.uid()));
revoke all on public.members from anon,authenticated;
grant select on public.members to authenticated;
revoke all on public.expenses from anon;
grant select,insert,update,delete on public.expenses to authenticated;
create index expenses_household_date on public.expenses(household_id,date);
-- Inserire manualmente due righe in members usando gli UUID utenti reali
-- e lo stesso household_id generato con gen_random_uuid(). Non commettere gli UUID.
-- In questa prima versione tutti i membri vedono tutti i movimenti del nucleo,
-- inclusi quelli contrassegnati come personali. Personale indica l'ambito di spesa.
