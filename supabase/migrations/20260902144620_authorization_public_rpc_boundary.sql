create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select private.current_user_is_active();
$$;

create or replace function public.current_user_has_role(p_role public.staff_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select private.current_user_has_role(p_role);
$$;

create or replace function public.current_user_has_capability(p_capability_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select private.current_user_has_capability(p_capability_key);
$$;

revoke all on function public.current_user_is_active() from public;
revoke all on function public.current_user_has_role(public.staff_role) from public;
revoke all on function public.current_user_has_capability(text) from public;

grant execute on function public.current_user_is_active() to authenticated;
grant execute on function public.current_user_has_role(public.staff_role) to authenticated;
grant execute on function public.current_user_has_capability(text) to authenticated;
