alter table public.profiles
  add column if not exists avatar_preset text;

alter table public.profiles
  drop constraint if exists profiles_avatar_path_consistency;

alter table public.profiles
  add constraint profiles_avatar_selection_consistency
  check (
    (avatar_type = 'none'
      and avatar_path is null
      and avatar_preset is null)
    or
    (avatar_type = 'preset'
      and avatar_path is null
      and avatar_preset is not null
      and btrim(avatar_preset) <> '')
    or
    (avatar_type = 'upload'
      and avatar_path is not null
      and avatar_preset is null)
  );

create or replace function public.complete_my_profile(
  p_first_name text,
  p_last_name text,
  p_city text,
  p_country_code char(2),
  p_gender public.profile_gender,
  p_date_of_birth date,
  p_phone text default null,
  p_bio text default null,
  p_undergraduate jsonb default null,
  p_postgraduate jsonb default null,
  p_work jsonb default null,
  p_avatar_type public.avatar_type default 'none',
  p_avatar_path text default null,
  p_avatar_preset text default null
)
returns public.profiles
language plpgsql
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
    bio,
    avatar_type,
    avatar_path,
    avatar_preset
  )
  values (
    auth.uid(),
    p_first_name,
    p_last_name,
    p_city,
    upper(p_country_code),
    p_gender,
    p_date_of_birth,
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_bio), ''),
    p_avatar_type,
    p_avatar_path,
    p_avatar_preset
  )
  returning * into created_profile;

  if p_undergraduate is not null then
    if not (
      p_undergraduate ?& array[
        'university',
        'degree',
        'specialty',
        'from_year',
        'to_year'
      ]
    ) then
      raise exception 'Incomplete undergraduate education';
    end if;

    insert into public.undergraduate_education (
      user_id,
      university,
      degree,
      specialty,
      from_year,
      to_year
    )
    values (
      auth.uid(),
      btrim(p_undergraduate->>'university'),
      (p_undergraduate->>'degree')::public.undergraduate_degree,
      btrim(p_undergraduate->>'specialty'),
      (p_undergraduate->>'from_year')::smallint,
      (p_undergraduate->>'to_year')::smallint
    );
  end if;

  if p_postgraduate is not null then
    if not (
      p_postgraduate ?& array[
        'university',
        'degree',
        'specialty',
        'from_year',
        'to_year'
      ]
    ) then
      raise exception 'Incomplete postgraduate education';
    end if;

    insert into public.postgraduate_education (
      user_id,
      university,
      degree,
      specialty,
      from_year,
      to_year
    )
    values (
      auth.uid(),
      btrim(p_postgraduate->>'university'),
      (p_postgraduate->>'degree')::public.postgraduate_degree,
      btrim(p_postgraduate->>'specialty'),
      (p_postgraduate->>'from_year')::smallint,
      (p_postgraduate->>'to_year')::smallint
    );
  end if;

  if p_work is not null then
    if not (
      p_work ?& array[
        'organization',
        'job_title',
        'from_year',
        'to_year'
      ]
    ) then
      raise exception 'Incomplete work experience';
    end if;

    insert into public.work_experience (
      user_id,
      organization,
      job_title,
      from_year,
      to_year
    )
    values (
      auth.uid(),
      btrim(p_work->>'organization'),
      btrim(p_work->>'job_title'),
      (p_work->>'from_year')::smallint,
      (p_work->>'to_year')::smallint
    );
  end if;

  return created_profile;
end;
$function$;

revoke execute on function public.complete_my_profile(
  text,
  text,
  text,
  char(2),
  public.profile_gender,
  date,
  text,
  text,
  jsonb,
  jsonb,
  jsonb,
  public.avatar_type,
  text,
  text
) from public, anon;

grant execute on function public.complete_my_profile(
  text,
  text,
  text,
  char(2),
  public.profile_gender,
  date,
  text,
  text,
  jsonb,
  jsonb,
  jsonb,
  public.avatar_type,
  text,
  text
) to authenticated;
