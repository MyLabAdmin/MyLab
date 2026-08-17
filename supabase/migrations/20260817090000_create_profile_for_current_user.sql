create or replace function public.create_my_profile(
  p_first_name text,
  p_last_name text,
  p_city text,
  p_country_code char(2),
  p_gender public.profile_gender,
  p_date_of_birth date,
  p_phone text default null,
  p_bio text default null
)
returns public.profiles
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
  created_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = auth.uid()
  ) then
    raise exception 'Profile already exists';
  end if;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    city,
    country_code,
    gender,
    date_of_birth,
    phone,
    bio
  )
  values (
    auth.uid(),
    p_first_name,
    p_last_name,
    p_city,
    p_country_code,
    p_gender,
    p_date_of_birth,
    p_phone,
    p_bio
  )
  returning * into created_profile;

  return created_profile;
end;
$function$;

revoke execute on function public.create_my_profile(
  text,
  text,
  text,
  char(2),
  public.profile_gender,
  date,
  text,
  text
) from public, anon;

grant execute on function public.create_my_profile(
  text,
  text,
  text,
  char(2),
  public.profile_gender,
  date,
  text,
  text
) to authenticated;
