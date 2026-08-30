# Phase 2.8 — Knowledge Domain Reconciliation

**Project:** MyLab  
**Owner:** Alfa  
**Phase:** 2.8 — Knowledge Domain Foundation  
**Date:** 2026-08-30  
**Repository:** `MyLabAdmin/MyLab`  
**Source of truth:** GitHub

---

## Purpose

This document records the reconciliation state of the Knowledge domain between the live Supabase database and the version-controlled MyLab repository.

The objective is to avoid recreating or redesigning an existing Knowledge schema blindly.

---

## Existing Knowledge Tables

The Knowledge domain identified in the live Supabase environment consists of:

- `knowledge_categories`
- `knowledge_items`
- `knowledge_item_versions`
- `knowledge_item_categories`
- `knowledge_references`

These tables represent the existing Knowledge-domain foundation.

---

## Repository Migration State

The repository currently contains the following Supabase migrations:

1. `20260815093000_baseline_identity_and_wallet.sql`
2. `20260815100000_remove_wallet_write_policies.sql`
3. `20260817090000_create_profile_for_current_user.sql`
4. `20260819011457_harden_avatar_storage_policies.sql`
5. `20260819012002_complete_signup_profile_flow.sql`
6. `20260827184235_identity_authorization_foundation_reconciliation.sql`

No dedicated Knowledge-domain migration is currently present in:

`supabase/migrations/`

Therefore the existing Knowledge database foundation must be reconciled into the repository before Knowledge application features are implemented.

---

## Reconciliation Principle

The existing live Knowledge schema must be treated as an existing production foundation.

The project must NOT:

- recreate existing tables unnecessarily;
- replace existing relationships without review;
- introduce destructive migrations;
- assume policies or constraints without inspecting them;
- implement Knowledge UI before the database foundation is version-controlled.

---

## Required Database Verification

Before creating the canonical Knowledge migration, the following must be verified against the live Supabase database:

- table definitions;
- columns and data types;
- nullable constraints;
- default values;
- primary keys;
- foreign keys;
- unique constraints;
- check constraints;
- indexes;
- triggers;
- functions referenced by Knowledge policies;
- grants;
- RLS status;
- RLS policies;
- ownership relationships;
- category hierarchy;
- Knowledge item/version relationships;
- item/category relationships;
- reference relationships;
- audit requirements.

---

## Security Boundary

Knowledge is owned by MyLab.

Ordinary users must not directly modify official Knowledge.

Knowledge administration must be controlled through authorized server-side operations and database authorization policies.

The client application is not a security boundary.

RLS must remain enabled and must reflect the approved Knowledge authorization model.

---

## Canonical Migration Requirement

After the live schema has been fully inspected, the repository must receive a canonical, production-ready Knowledge migration.

The migration must represent the existing approved schema rather than redesign it.

The migration must be:

- deterministic;
- non-destructive;
- version-controlled;
- reviewable;
- consistent with the Identity and Authorization foundation;
- compatible with the established MyLab architecture.

---

## Implementation Gate

Knowledge application features must not be implemented until:

1. The live Knowledge schema is fully inspected.
2. The schema is compared with GitHub.
3. Differences are documented.
4. The canonical migration is created.
5. RLS and authorization policies are verified.
6. The migration passes SQL verification.
7. The documentation is updated.
8. Changes are committed and pushed to `main`.

---

## Current Status

**Phase 2.8 — RECONCILIATION**

Repository-side Knowledge documentation has been established.

The remaining database reconciliation work is to capture the exact live schema definition and authorization policies and encode the approved result as a version-controlled migration.

No Knowledge UI implementation should begin before this gate is closed.

---

## Decision

GitHub remains the source of truth for version-controlled database migrations.

Supabase remains the live runtime database.

The two must be explicitly reconciled before Knowledge-domain implementation proceeds.

---

## Next Action

Create and verify the canonical Knowledge migration from the actual live Supabase schema.

Then:

- run database verification;
- run `npm run build`;
- update project documentation;
- commit;
- push;
- synchronize `main`;
- close Phase 2.8 reconciliation.

