# Supabase Reconciliation Record

**Project:** MyLab  
**Phase:** 2.7 — Identity & Authorization Foundation  
**Date:** 2026-08-30  
**Repository:** `MyLabAdmin/MyLab`  
**Default branch:** `main`

## Purpose

This document records the Supabase ↔ GitHub reconciliation state without introducing a new schema change.

## Repository state verified

The local repository contains six tracked Supabase migrations, and the local migration list matches the Git-tracked migration list:

1. `20260815093000_baseline_identity_and_wallet.sql`
2. `20260815100000_remove_wallet_write_policies.sql`
3. `20260817090000_create_profile_for_current_user.sql`
4. `20260819011457_harden_avatar_storage_policies.sql`
5. `20260819012002_complete_signup_profile_flow.sql`
6. `20260827184235_identity_authorization_foundation_reconciliation.sql`

The temporary `supabase/.temp` directory was removed before this reconciliation record was prepared.

## Supabase CLI state

`supabase db pull` was attempted from `~/mylab` and returned:

> Cannot find project ref. Have you run supabase link?

`supabase status` is not supported by the installed Supabase CLI version.

`supabase/config.toml` currently does not provide a project reference.

## Important boundary

This record does not claim that the live Supabase database was freshly introspected on 2026-08-30.

Live database verification requires a valid Supabase project link or another authenticated database inspection path.

The repository-side state is reconciled and documented. Live-database introspection remains an explicit verification item and is not guessed or simulated.

## Phase 2.7 migration

The repository already contains:

`20260827184235_identity_authorization_foundation_reconciliation.sql`

Its purpose is validation rather than redesign. It checks the expected authorization foundation, RLS, required policies, and server-side authorization functions without recreating those objects.

The migration is intentionally non-destructive.

## Decision

No new database migration is created as part of this documentation-only reconciliation.

GitHub remains the source of truth for versioned migration files and architecture documentation. Live Supabase remains the runtime source of truth and must be introspected through an authenticated project connection before claiming a fresh database-to-repository match.

## Closure status

- [x] Temporary Supabase CLI artifacts removed.
- [x] Local migration inventory checked.
- [x] Git-tracked migration inventory checked.
- [x] Local and Git-tracked migration filenames match.
- [x] Existing Phase 2.7 reconciliation migration documented.
- [ ] Fresh live Supabase introspection completed.

**Status:** Repository reconciliation documented; live Supabase verification remains pending valid project linkage.
