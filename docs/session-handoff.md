# MyLab Session Handoff

## Project

MyLab

## Owner

Alfa

## Repository

git@github.com:MyLabAdmin/MyLab.git

GitHub is the single source of truth.

## Development Environment

- Termux on Android
- Git
- GitHub CLI
- Node.js
- npm

## Current Stack

- Next.js 16.3.0
- React 19.2.8
- TypeScript
- ESLint
- Tailwind CSS 4
- App Router
- next-intl 4.13.4
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- ImageKit
- Google Gemini — planned integration

## Android Build Constraint

The project runs in Termux on Android ARM64.

Production verification uses:

npm run build

with:

next build --webpack

Turbopack is not used for production builds in the current Android environment.

Webpack/WASM cache warnings may appear but do not prevent a successful production build.

## Current Phase

**Knowledge Content & Discovery**

Status:

**Ready to begin after Phase 2.8 closure**

## Completed Phases

### Phase 2.5 — Application Shell

CLOSED

Completed and merged into `main`.

### Phase 2.6 — Domain Architecture

Architecture defined across:

- Identity
- Knowledge
- Courses
- AI
- Community
- Economy
- Subscription
- Verification
- Administration

### Phase 2.7 — Identity & Authorization Foundation

CLOSED

Completed:

- Identity authorization foundation
- Account status architecture
- Staff roles
- Capability-based authorization
- Course Creator capability
- RLS requirements
- Server-side authorization direction
- Reconciliation migration

Migration:

`20260827184235_identity_authorization_foundation_reconciliation.sql`

### Repository Reconciliation

Completed:

- Local Supabase migration inventory verified.
- Git-tracked migration inventory verified.
- Local and Git migration filenames match.
- Temporary `supabase/.temp` directory removed.
- Supabase CLI `db pull` identified as unavailable without project linking.
- Reconciliation state documented.
- Documentation committed and pushed to `main`.

Latest repository commit:

`169ed8e docs: record Supabase reconciliation state`

## Phase 2.8 — Knowledge Domain Foundation & First Browse Slice

**CLOSED**

Completed:

- Knowledge database foundation established and reconciled.
- Knowledge ownership and read-access architecture preserved.
- Knowledge RLS/security boundaries verified.
- Server-side Knowledge read layer implemented.
- Published Knowledge item retrieval implemented.
- Knowledge categories and references read layers implemented.
- Production Knowledge browse route implemented.
- Arabic and English UI implemented.
- Empty and error states implemented.
- Desktop and mobile Knowledge navigation implemented.
- Light Theme established as the current official application theme.
- Automatic system Dark Mode override removed.
- Navigation contrast issue resolved.
- Production build verified.
- TypeScript verification passed.
- ESLint verification passed with 0 errors and one pre-existing unrelated warning.
- `git diff --check` passed.
- `/ar/knowledge` verified.
- `/en/knowledge` verified.

Implementation commits:

- `3d4d363` — `feat(knowledge): add knowledge read layer`
- `03ae3f7` — `feat(knowledge): add knowledge browse UI`

Phase 2.8 is officially CLOSED.

## Current Knowledge Foundation

The live Supabase environment contains the following Knowledge tables:

- `knowledge_categories`
- `knowledge_items`
- `knowledge_item_versions`
- `knowledge_item_categories`
- `knowledge_references`

RLS is enabled on these Knowledge tables.

The repository does not yet contain a dedicated Knowledge migration representing this existing live schema.

## Phase 2.8 Objective

Reconcile the existing live Knowledge database foundation with GitHub before implementing Knowledge application features.

Required areas:

- entities;
- relationships;
- ownership;
- constraints;
- indexes;
- triggers;
- grants;
- RLS;
- RLS policies;
- authorization functions;
- audit requirements;
- versioning model.

## Architecture Decisions

MyLab Knowledge is owned by MyLab.

Ordinary users read Knowledge but do not directly modify official Knowledge.

Knowledge administration is restricted to authorized administrative capabilities.

The client is never treated as the security boundary.

Database authorization and server-side authorization must enforce sensitive operations.

## Critical Rule

Do not recreate or redesign the existing Knowledge schema blindly.

The existing live schema must first be inspected and represented accurately in a canonical version-controlled migration.

The database foundation and authorization model were reconciled before the Knowledge browse slice was implemented. Future Knowledge work must continue from the established schema, security model, and read layer.

## Phase 2.8 Closure

The required Phase 2.8 workflow has been completed for the current Knowledge foundation and first production browse slice.

The phase is closed and must not be reopened for cosmetic or incremental changes.

## Current Repository State

Expected branch:

`main`

Expected relationship:

`main` synchronized with `origin/main`

Working tree should remain clean after each completed phase.

## Next Action

Begin **Knowledge Content & Discovery**.

Planned sequence:

1. Validate real Knowledge data.
2. Establish production Category UI.
3. Implement production Knowledge cards.
4. Introduce Search when justified by real data and use cases.
5. Implement Knowledge Detail.

Do not introduce Search or additional discovery complexity before validating the available real Knowledge data and its actual product use cases.

## Communication Protocol

Alfa is the project owner and final decision authority.

Execution should remain:

**Decision → Action → Verification → Commit → Push → Close phase**

Avoid prototypes, temporary fixes, or undocumented schema changes.

