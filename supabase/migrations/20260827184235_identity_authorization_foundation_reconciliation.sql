-- MyLab Phase 2.7
-- Identity & Authorization Foundation
-- Reconciliation migration
--
-- Purpose:
-- Record and validate the authorization foundation already present
-- in the Supabase database without re-applying or redesigning it.
--
-- This migration is intentionally non-destructive.
-- It does not create or modify application data.
-- It does not add account_status_id to profiles.
-- It does not recreate existing authorization tables.

begin;

-- ============================================================
-- Authorization foundation validation
-- ============================================================

do $$
begin
  if to_regclass('public.account_statuses') is null then
    raise exception
      'Phase 2.7 reconciliation failed: public.account_statuses does not exist';
  end if;

  if to_regclass('public.user_staff_roles') is null then
    raise exception
      'Phase 2.7 reconciliation failed: public.user_staff_roles does not exist';
  end if;

  if to_regclass('public.capabilities') is null then
    raise exception
      'Phase 2.7 reconciliation failed: public.capabilities does not exist';
  end if;

  if to_regclass('public.user_capabilities') is null then
    raise exception
      'Phase 2.7 reconciliation failed: public.user_capabilities does not exist';
  end if;
end
$$;

-- ============================================================
-- RLS validation
-- ============================================================

do $$
declare
  v_rls_enabled boolean;
begin
  select c.relrowsecurity
    into v_rls_enabled
  from pg_class c
  join pg_namespace n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'account_statuses';

  if not coalesce(v_rls_enabled, false) then
    raise exception
      'Phase 2.7 reconciliation failed: RLS is not enabled on public.account_statuses';
  end if;

  select c.relrowsecurity
    into v_rls_enabled
  from pg_class c
  join pg_namespace n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'user_staff_roles';

  if not coalesce(v_rls_enabled, false) then
    raise exception
      'Phase 2.7 reconciliation failed: RLS is not enabled on public.user_staff_roles';
  end if;

  select c.relrowsecurity
    into v_rls_enabled
  from pg_class c
  join pg_namespace n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'capabilities';

  if not coalesce(v_rls_enabled, false) then
    raise exception
      'Phase 2.7 reconciliation failed: RLS is not enabled on public.capabilities';
  end if;

  select c.relrowsecurity
    into v_rls_enabled
  from pg_class c
  join pg_namespace n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'user_capabilities';

  if not coalesce(v_rls_enabled, false) then
    raise exception
      'Phase 2.7 reconciliation failed: RLS is not enabled on public.user_capabilities';
  end if;
end
$$;

-- ============================================================
-- Required authorization policies
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'account_statuses'
      and policyname = 'account_statuses_select_own'
      and cmd = 'SELECT'
  ) then
    raise exception
      'Phase 2.7 reconciliation failed: required account_statuses_select_own policy is missing';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'capabilities'
      and policyname = 'capabilities_select_authenticated'
      and cmd = 'SELECT'
  ) then
    raise exception
      'Phase 2.7 reconciliation failed: required capabilities_select_authenticated policy is missing';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_capabilities'
      and policyname = 'user_capabilities_select_own'
      and cmd = 'SELECT'
  ) then
    raise exception
      'Phase 2.7 reconciliation failed: required user_capabilities_select_own policy is missing';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_staff_roles'
      and policyname = 'user_staff_roles_select_own'
      and cmd = 'SELECT'
  ) then
    raise exception
      'Phase 2.7 reconciliation failed: required user_staff_roles_select_own policy is missing';
  end if;
end
$$;

-- ============================================================
-- Required server-side authorization functions
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'current_user_has_role'
      and pg_get_function_identity_arguments(p.oid) = 'p_role staff_role'
  ) then
    raise exception
      'Phase 2.7 reconciliation failed: private.current_user_has_role(p_role staff_role) is missing';
  end if;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'current_user_has_capability'
      and pg_get_function_identity_arguments(p.oid) = 'p_capability_key text'
  ) then
    raise exception
      'Phase 2.7 reconciliation failed: private.current_user_has_capability(p_capability_key text) is missing';
  end if;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'current_user_is_active'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    raise exception
      'Phase 2.7 reconciliation failed: private.current_user_is_active() is missing';
  end if;
end
$$;

commit;
