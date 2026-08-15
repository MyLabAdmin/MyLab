-- MyLab database baseline
-- Generated from the verified production schema on 2026-08-15.
-- This is a reconstruction baseline, not the original historical migration SQL.

create type public.avatar_type as enum (
  'none',
  'preset',
  'upload'
);

create type public.postgraduate_degree as enum (
  'higher_diploma',
  'master',
  'doctorate'
);

create type public.profile_gender as enum (
  'male',
  'female'
);

create type public.profile_visibility_field as enum (
  'email',
  'name',
  'avatar',
  'bio',
  'country',
  'city',
  'gender',
  'date_of_birth',
  'phone',
  'undergraduate_education',
  'postgraduate_education',
  'work_experience'
);

create type public.undergraduate_degree as enum (
  'diploma',
  'bachelor'
);

create type public.visibility_level as enum (
  'private',
  'friends',
  'public'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  city text not null,
  country_code char(2) not null,
  gender public.profile_gender not null,
  date_of_birth date not null,
  phone text,
  bio text,
  avatar_type public.avatar_type not null default 'none',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_first_name_not_blank
    check (btrim(first_name) <> ''),

  constraint profiles_last_name_not_blank
    check (btrim(last_name) <> ''),

  constraint profiles_city_not_blank
    check (btrim(city) <> ''),

  constraint profiles_country_code_format
    check (country_code ~ '^[A-Z]{2}$'),

  constraint profiles_bio_max_length
    check (bio is null or char_length(bio) <= 150),

  constraint profiles_avatar_path_consistency
    check (
      (avatar_type = 'upload' and avatar_path is not null)
      or
      (avatar_type in ('none', 'preset') and avatar_path is null)
    )
);

create table public.undergraduate_education (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  university text not null,
  degree public.undergraduate_degree not null,
  specialty text not null,
  from_year smallint not null,
  to_year smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint undergraduate_university_not_blank
    check (btrim(university) <> ''),

  constraint undergraduate_specialty_not_blank
    check (btrim(specialty) <> ''),

  constraint undergraduate_years_valid
    check (
      from_year between 1900 and 2100
      and to_year between 1900 and 2100
      and to_year >= from_year
    )
);

create table public.postgraduate_education (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  university text not null,
  degree public.postgraduate_degree not null,
  specialty text not null,
  from_year smallint not null,
  to_year smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint postgraduate_university_not_blank
    check (btrim(university) <> ''),

  constraint postgraduate_specialty_not_blank
    check (btrim(specialty) <> ''),

  constraint postgraduate_years_valid
    check (
      from_year between 1900 and 2100
      and to_year between 1900 and 2100
      and to_year >= from_year
    )
);

create table public.work_experience (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization text not null,
  job_title text not null,
  from_year smallint not null,
  to_year smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint work_organization_not_blank
    check (btrim(organization) <> ''),

  constraint work_job_title_not_blank
    check (btrim(job_title) <> ''),

  constraint work_years_valid
    check (
      from_year between 1900 and 2100
      and to_year between 1900 and 2100
      and to_year >= from_year
    )
);

create table public.profile_visibility (
  user_id uuid not null references public.profiles(id) on delete cascade,
  field public.profile_visibility_field not null,
  visibility public.visibility_level not null,
  primary key (user_id, field)
);

create table public.wallets (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  wallet_number text not null unique,
  balance numeric not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wallets_wallet_number_key unique (wallet_number),

  constraint wallets_number_format
    check (wallet_number ~ '^MLB-[0-9]{10}$'),

  constraint wallets_balance_nonnegative
    check (balance >= 0)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.validate_profile_age()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if new.date_of_birth > (current_date - interval '18 years')::date then
    raise exception 'User must be at least 18 years old';
  end if;

  return new;
end;
$function$;

create or replace function public.enforce_max_profile_entries()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  entry_count integer;
begin
  if tg_table_name = 'postgraduate_education' then
    select count(*)
      into entry_count
      from public.postgraduate_education
     where user_id = new.user_id;

    if entry_count >= 5 then
      raise exception 'A user may have at most 5 postgraduate education entries';
    end if;

  elsif tg_table_name = 'work_experience' then
    select count(*)
      into entry_count
      from public.work_experience
     where user_id = new.user_id;

    if entry_count >= 5 then
      raise exception 'A user may have at most 5 work experience entries';
    end if;
  end if;

  return new;
end;
$function$;

create or replace function public.seed_profile_visibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.profile_visibility (user_id, field, visibility)
  values
    (new.id, 'email', 'private'),
    (new.id, 'name', 'public'),
    (new.id, 'avatar', 'public'),
    (new.id, 'bio', 'public'),
    (new.id, 'country', 'public'),
    (new.id, 'city', 'friends'),
    (new.id, 'gender', 'friends'),
    (new.id, 'date_of_birth', 'private'),
    (new.id, 'phone', 'private'),
    (new.id, 'undergraduate_education', 'friends'),
    (new.id, 'postgraduate_education', 'friends'),
    (new.id, 'work_experience', 'friends')
  on conflict (user_id, field) do nothing;

  return new;
end;
$function$;

create or replace function public.generate_wallet_number()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  candidate text;
begin
  loop
    candidate :=
      'MLB-' ||
      lpad(
        (floor(random() * 10000000000))::bigint::text,
        10,
        '0'
      );

    exit when not exists (
      select 1
        from public.wallets
       where wallet_number = candidate
    );
  end loop;

  return candidate;
end;
$function$;

create or replace function public.create_wallet_for_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  insert into public.wallets (user_id, wallet_number)
  values (new.id, public.generate_wallet_number())
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

create or replace function public.set_wallet_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create trigger profiles_validate_age
before insert or update of date_of_birth on public.profiles
for each row
execute function public.validate_profile_age();

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger profiles_seed_visibility
after insert on public.profiles
for each row
execute function public.seed_profile_visibility();

create trigger undergraduate_education_set_updated_at
before update on public.undergraduate_education
for each row
execute function public.set_updated_at();

create trigger postgraduate_education_set_updated_at
before update on public.postgraduate_education
for each row
execute function public.set_updated_at();

create trigger postgraduate_education_max_5
before insert on public.postgraduate_education
for each row
execute function public.enforce_max_profile_entries();

create trigger work_experience_set_updated_at
before update on public.work_experience
for each row
execute function public.set_updated_at();

create trigger work_experience_max_5
before insert on public.work_experience
for each row
execute function public.enforce_max_profile_entries();

create trigger on_profile_created_create_wallet
after insert on public.profiles
for each row
execute function public.create_wallet_for_profile();

create trigger wallets_set_updated_at
before update on public.wallets
for each row
execute function public.set_wallet_updated_at();

alter table public.profiles enable row level security;
alter table public.undergraduate_education enable row level security;
alter table public.postgraduate_education enable row level security;
alter table public.work_experience enable row level security;
alter table public.profile_visibility enable row level security;
alter table public.wallets enable row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy profiles_delete_own
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

create policy undergraduate_select_own
on public.undergraduate_education
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy undergraduate_insert_own
on public.undergraduate_education
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy undergraduate_update_own
on public.undergraduate_education
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy undergraduate_delete_own
on public.undergraduate_education
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy postgraduate_select_own
on public.postgraduate_education
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy postgraduate_insert_own
on public.postgraduate_education
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy postgraduate_update_own
on public.postgraduate_education
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy postgraduate_delete_own
on public.postgraduate_education
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy work_select_own
on public.work_experience
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy work_insert_own
on public.work_experience
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy work_update_own
on public.work_experience
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy work_delete_own
on public.work_experience
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy profile_visibility_select_own
on public.profile_visibility
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy profile_visibility_insert_own
on public.profile_visibility
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy profile_visibility_update_own
on public.profile_visibility
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy profile_visibility_delete_own
on public.profile_visibility
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy wallets_select_own
on public.wallets
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy wallets_insert_own
on public.wallets
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy wallets_update_own
on public.wallets
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy wallets_delete_own
on public.wallets
for delete
to authenticated
using ((select auth.uid()) = user_id);
