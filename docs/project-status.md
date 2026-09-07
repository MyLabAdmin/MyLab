MyLab Project Status

Project: MyLab
Owner: Alfa
Version: 0.1.0

Current Status

Phase 2.9 — Knowledge Authoring & Laboratory Test Draft Editing — CLOSED

Phase 2.9 was successfully implemented, verified, documented, committed, pushed, and synchronized with "main".

Current phase:

Knowledge Experience & Master Application Architecture

Status:

ARCHITECTURE APPROVED — READY FOR KNOWLEDGE DATA MODEL

The Knowledge foundation and first production browse slice are complete. Further Knowledge implementation must continue from the established architecture and real data model.

Repository

git@github.com:MyLabAdmin/MyLab.git

GitHub is the single source of truth.

Current Main Commit

269a043 — feat(knowledge): add secure review detail

Current repository note:

The latest committed state is 269a043. Knowledge Review/Publish frontend changes are currently present locally and must be committed after final verification.

Development Environment

- Termux on Android
- Git
- GitHub CLI
- Node.js
- npm

Current Stack

- Next.js 16.3.0
- React 19.2.8
- TypeScript
- ESLint
- Tailwind CSS
- App Router
- next-intl 4.13.4
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- ImageKit
- Google Gemini AI — planned integration
- GitHub

Build Environment

The current Android ARM64 / Termux environment does not use Turbopack for production builds.

Production verification uses:

npm run build

The production build currently completes successfully.

Webpack cache warnings related to dependency snapshotting are present in the Termux/WASM environment but do not prevent successful compilation or production build completion.

Completed Phases

Phase 0 — Foundation

Completed:

- Termux development environment
- Git and GitHub SSH authentication
- Next.js foundation
- TypeScript
- ESLint
- Tailwind CSS
- App Router
- Production build verification

Phase 1 — Authentication & Identity

Completed:

- Bilingual Arabic/English authentication flow
- Localized authentication routing
- Authentication validation and hardening
- Protected dashboard/profile flow
- Profile completion architecture

Phase 2 — Profile & Brand UI

Completed:

- MyLab brand integration
- Design tokens and theme system
- Custom reusable UI component architecture
- Profile completion UI
- Undergraduate education section
- Postgraduate education section
- Work experience section
- Country selector with 249 ISO 3166-1 alpha-2 countries
- Deterministic Arabic/English country labels
- Removal of runtime "Intl.DisplayNames" dependency from country rendering
- Avatar presets
- Avatar upload
- ImageKit server-side authentication endpoint
- Local default avatar asset
- Client-side avatar preview
- JPEG/PNG/WebP validation
- 5 MB avatar size limit
- Supabase migrations for the signup/profile database flow
- Avatar storage security policies
- Bilingual profile validation and submission flow

Phase 2.4 — Brand UI / Profile Completion

Completed:

- Production build verification
- Working tree verification
- Feature branch push
- Pull request #3
- Pull request review
- Pull request #3 merged into "main"
- "main" synchronized with "origin/main"
- Final implementation commit before merge: "96c8c4f"
- Final merge commit: "c3b12ec"

Phase 2.5 — Application Shell

Status:

CLOSED

Completed:

- Production-ready authenticated application shell
- Protected application layout
- Server-side authentication validation
- Server-side profile existence validation
- Localized authentication redirects
- Existing profile-completion redirect flow
- Reusable application shell architecture
- Header
- Primary navigation
- Mobile navigation
- Dashboard integration
- Arabic/English shell translations
- RTL/LTR locale behavior
- Localized dashboard title
- Localized dashboard welcome message
- Localized authentication error mapping
- Stable authentication error translation keys
- Production build verification
- TypeScript verification
- "git diff --check" verification
- Runtime verification of "/en/dashboard"
- Runtime verification of "/ar/dashboard"
- Arabic RTL verification
- English LTR verification
- Documentation update

Phase 2.5 implementation commit:

"894bb72"

Documentation commit:

"581bc3a"

Pull request:

PR #5

Final merge commit:

"65b880e"

Phase 2.5 is CLOSED.

Architecture Status

The current production architecture includes:

- Next.js application frontend
- App Router
- Component-based UI architecture
- Tailwind CSS
- Design tokens
- CSS variables
- Custom reusable UI components
- next-intl localization architecture
- Arabic RTL support
- English LTR support
- Supabase PostgreSQL
- Supabase authentication
- Supabase Storage
- ImageKit
- Server-side API routes where sensitive credentials or authentication are required
- GitHub-based version control and project source of truth

Google Gemini AI remains a planned external integration.

Phase 2.6 — Domain Architecture & Authorization Foundation

Objective:

Define the production architecture for MyLab's core domains, authorization model, ownership boundaries, AI service boundary, and future economy capabilities before beginning new domain implementation.

Primary domains under architectural definition:

- Identity
- Knowledge
- Courses
- AI
- Community
- Economy
- Subscription
- Verification
- Administration

Confirmed Architectural Decisions

Knowledge

- MyLab Knowledge is owned by MyLab.
- Users read Knowledge but do not directly modify it.
- Knowledge is managed by authorized administration.
- User corrections/suggestions should use a communication/support flow.
- AI must use MyLab Knowledge first when relevant.

AI Architecture Status

AI is an application service and not an independent source of truth.

Google Gemini is the planned external AI provider and will be accessed through its API.

The AI architecture uses three knowledge layers:

1. MyLab Knowledge

   - Official MyLab-owned knowledge.
   - Highest priority for relevant MyLab requests.
   - Managed by authorized administration.
   - Read-only for ordinary users.

2. Domain Content

   - MyLab Courses
   - Approved User Courses
   - Community content
   - Other permitted application-domain context
   - Access controlled according to domain permissions and privacy rules.

3. General Knowledge

   - External/general AI knowledge.
   - Used when MyLab Knowledge is insufficient or when the request is outside MyLab Knowledge.
   - Initial provider: Google Gemini API.

Preferred AI flow:

User Request
→ MyLab AI Service
→ Context & Permission Check
→ MyLab Knowledge
→ Permitted Domain Content
→ General Knowledge when required
→ Google Gemini API
→ MyLab AI Response

The AI service is responsible for selecting and minimizing context before sending information to the external provider.

The AI provider must not receive unrestricted access to MyLab databases or user data.

Where practical, AI responses should distinguish between MyLab Knowledge, Domain Content, and General AI Knowledge.

AI remains a planned implementation and is not yet a completed production domain.

Courses

Two course categories exist:

- MyLab Courses
- User Courses

A dedicated "Course Author" staff role is planned for official MyLab course creation/management.

Users may apply to become Course Creators.

Course Creator flow:

User
→ Application
→ Terms Acceptance
→ Super Admin Approval
→ Course Creator Capability

Approved Course Creators may:

- Create courses
- Set course prices
- Make courses free
- Earn from eligible paid courses
- Request withdrawals after reaching the configured threshold

Community

- Every user may publish subject to Community policy.
- Community supports user-generated content.
- Future monetized content is possible.
- Media quotas depend on subscription status.
- Coin-based quota extensions are planned.
- Exact quota numbers are deferred.
- Reports, warnings, posting suspension, account suspension, and account locking are required architectural capabilities.

Economy

The Economy domain is shared by all users.

Coins and Creator Earnings are separate concepts.

Coins may be:

- Purchased with real money
- Earned through rewards
- Transferred between users
- Spent on supported features

Coin transfers must support:

- Limits
- Fees
- Account status checks
- Anti-abuse controls

Creator Earnings represent real monetary value earned from eligible paid courses.

Creators may request withdrawals after reaching the configured threshold.

Withdrawal requests use previously supplied payout information and must be processed through a secure financial workflow.

Subscription

One subscription system applies to all users.

Plans:

- Free
- Monthly
- Quarterly
- Yearly

Subscription status may affect feature quotas and access but does not replace authorization.

Verification

At least two verification types are planned:

- Identity Verification
- Professional Verification

Identity Verification produces an Identity Verified badge.

Professional Verification produces a Professional badge.

Professional Verification approval is currently handled by Super Admin.

Administrative Roles

Planned staff roles:

- Super Admin
- Knowledge Manager
- Course Author
- Course Reviewer
- Community Moderator
- Finance/Economy Manager
- Support Staff

Course Creator is not a staff role.

It is a capability granted to an approved user.

Security Architecture

Security-sensitive operations remain server-trusted.

This includes:

- Authentication
- Authorization
- Course Creator approval
- Professional Verification
- Moderation
- Account locking
- Economy transactions
- Coin transfers
- Withdrawals
- Payment information
- AI provider credentials

The client UI is never treated as the security boundary.

Database Architecture Direction

Before implementing each domain:

1. Define entities.
2. Define relationships.
3. Define ownership.
4. Define access policies.
5. Define indexes.
6. Define audit requirements.
7. Define migrations.
8. Implement dependent application features.

Database changes must be version-controlled through migrations.

Development Rules

- Production-ready implementation only.
- No prototypes or temporary architecture.
- Database architecture before dependent UI features.
- Security before sensitive features.
- Complete each step before starting the next.
- Every significant feature must be documented.
- Database changes must be version-controlled through migrations.
- GitHub is the single source of truth.
- Architecture decisions must remain consistent across phases.
- Domain boundaries must be respected.
- External AI services must remain behind controlled service boundaries.

Phase Completion Rule

Every completed phase must end with:

1. Verification
2. Documentation update
3. Commit
4. Push
5. Project status update
6. Pull request review/merge when applicable
7. Final synchronization with "main"

Current Gate

Phase 2.5 is CLOSED.

Current gate:

Phase 2.6 — Architecture Definition

No new domain feature implementation should begin until Phase 2.6 has passed architecture review and approval.

Phase 2.6 Required Outputs

The phase must produce:

- Domain architecture document
- Authorization model
- Ownership boundaries
- AI service boundary
- Course architecture
- Community architecture
- Economy architecture
- Subscription architecture
- Verification architecture
- Security boundaries
- Database architecture direction
- Acceptance criteria
- Verification strategy

Next Action

Complete and review:

"docs/phase-2.6-domain-architecture.md"

Then:

1. Review the architecture with Alfa.
2. Resolve any remaining architectural decisions.
3. Commit the documentation.
4. Push the documentation.
5. Mark Phase 2.6 architecture as approved.
6. Define the first implementation phase based on the approved architecture.

No new domain implementation should begin before this gate is passed.

Source of Truth

GitHub is the single source of truth.

Repository:

"git@github.com:MyLabAdmin/MyLab.git"

Phase 2.7 — Identity & Authorization Foundation

Status:

CLOSED

Completed:

- Defined the Identity and Authorization foundation.
- Established account status architecture.
- Established staff-role architecture.
- Established capability-based authorization direction.
- Established Course Creator as a user capability rather than a staff role.
- Established server-side authorization helpers.
- Established RLS requirements for authorization data.
- Established reconciliation migration for the existing authorization foundation.
- Confirmed that no destructive schema changes are introduced by the reconciliation migration.
- Database migration committed and pushed successfully.

Database migration:

20260827184235_identity_authorization_foundation_reconciliation.sql

Commit:

f2bb5f1 — chore(db): reconcile phase 2.7 authorization foundation

Verification:

- git diff --check — PASSED
- Working tree — CLEAN
- origin/main synchronized — PASSED

Phase 2.7 is CLOSED.

Current Gate:

Phase 2.8 — Knowledge Domain Foundation

No new domain implementation should begin until the Knowledge domain foundation is explicitly defined and implemented according to the approved architecture.

Next Phase Objective:

Establish the production-ready Knowledge domain foundation, including:

- Knowledge ownership
- Knowledge entities
- Knowledge relationships
- Knowledge access model
- Knowledge administration boundaries
- RLS policies
- Server-side access layer
- Audit requirements
- Database migrations
- Verification strategy

Phase 2.8 must preserve the architecture-first and database-first development workflow.


Phase 2.8 — Knowledge Domain Foundation & First Browse Slice

Status:

CLOSED

Completed:

- Knowledge database foundation reconciled and established.
- Knowledge ownership and read-access model preserved.
- Knowledge RLS/security boundaries verified.
- Server-side Knowledge read layer implemented.
- Published Knowledge item retrieval implemented.
- Published laboratory test retrieval aligned with published versions.
- Knowledge categories read layer implemented.
- Knowledge references read layer implemented.
- Production Knowledge route implemented.
- Arabic and English Knowledge UI implemented.
- Knowledge empty state implemented.
- Knowledge error state implemented.
- Knowledge desktop navigation implemented.
- Knowledge mobile navigation implemented.
- Light Theme enforced as the current official application theme.
- Automatic system Dark Mode override removed.
- Navigation contrast issue caused by system Dark Mode behavior resolved.
- Production build verified.
- TypeScript verification passed.
- ESLint verification passed with 0 errors and one pre-existing unrelated warning.
- git diff --check passed.
- Runtime verification completed for /ar/knowledge and /en/knowledge.

Implementation commits:

- 3d4d363 — feat(knowledge): add knowledge read layer
- 03ae3f7 — feat(knowledge): add knowledge browse UI

Phase 2.8 is CLOSED.

Current Knowledge Status:

- Database Foundation — COMPLETE
- Read Layer — COMPLETE
- Browse UI Vertical Slice 1 — COMPLETE
- Search — DEFERRED
- Categories UI — NEXT
- Knowledge Detail — PLANNED

Next Phase:

Knowledge Content & Discovery

Planned sequence:

1. Validate real Knowledge data.
2. Establish the production Category UI.
3. Implement production Knowledge cards.
4. Introduce Search when justified by real data and use cases.
5. Implement Knowledge Detail.

## Authorization Review Closure — September 2026

The Authorization Review for the Knowledge authoring/publishing foundation is complete.

Completed:
- Verified the existing authorization model and actual `staff_role` enum.
- Preserved the existing capability model without inventing Knowledge capabilities.
- Added a controlled public RPC boundary for server-side authorization checks.
- Restricted authorization RPC execution to authenticated users; anonymous execution is revoked.
- Hardened the public authorization RPCs with `search_path = ''`.
- Preserved the private authorization functions as the underlying source of authorization truth.
- Verified the remote Supabase function privileges and configuration.
- Verified production lint and build.
- No TypeScript errors.
- `git diff --check` passed.

Security boundary:
Client → Authentication → Session Validation → Account State → Authorization → Resource Ownership → Domain Rules → RLS → Operation.

Current decision:
Knowledge authoring must use the established authorization service and existing authorization model. No Knowledge-specific capability keys should be introduced until a capability design is explicitly approved and versioned in the database.

Next:
Knowledge Authoring & Versioned Publishing.

---

## Knowledge Authoring & Publishing — Migration Reconciliation Closed

**Status:** CLOSED
**Commit:** `6047dc1`
**Branch:** `main`
**Remote:** `origin/main`

### Completed
- Reconciled Knowledge Domain migration timestamp with Production.
- Reconciled Knowledge Version Images migration timestamp with Production.
- Added Knowledge authoring write authorization boundary.
- Added Knowledge archive authorization boundary.
- Hardened Knowledge table write privileges.
- Removed anonymous table access from Knowledge tables.
- Preserved the approved workflow:
  `Create → Draft → Edit/New Version → Publish → Superseded`.
- Preserved the approved Knowledge authorization model:
  active account + `knowledge_manager` or `super_admin`.
- Preserved ImageKit as the physical storage layer for Knowledge images.
- Verified staged diff with `git diff --cached --check`.
- Verified migration rename detection at 100%.
- Committed and pushed all migration changes successfully.

### Git State
`main` is synchronized with `origin/main` at:

`6047dc1 feat(knowledge): reconcile authoring and publishing migrations`

### Phase 2.9 — Knowledge Authoring & Laboratory Test Draft Editing

**Status: CLOSED**

Completed:

- Production Knowledge authoring authorization boundary.
- Laboratory Test creation flow.
- Laboratory Test draft read layer.
- Laboratory Test draft edit route.
- Laboratory Test draft update Server Action.
- Production Laboratory Test draft update RPC.
- Atomic draft updates.
- Category hierarchy validation.
- Specimen management.
- Method management.
- Interpretation management.
- Reference-range management.
- English and Arabic authoring UI.
- Authenticated-only execution for the draft update RPC.
- Draft/published read separation.
- Explicit row-count validation to prevent silent update no-ops.
- Anonymous execution revoked from the Laboratory Test draft update RPC.
- Supabase persistence verified through integration testing.
- Production build, TypeScript, and git diff verification completed.

Integration test record:

`GLU-INTEGRATION-0`

Implementation commit:

`6c5ee5f — feat(knowledge): complete laboratory test draft editing`

Phase 2.9 is CLOSED.

### Current Knowledge Status

- Database Foundation — COMPLETE
- Read Layer — COMPLETE
- Browse UI — COMPLETE
- Authoring Create Flow — COMPLETE
- Draft Read Layer — COMPLETE
- Draft Edit Flow — COMPLETE
- Draft Persistence Verification — COMPLETE
- Publishing Workflow — NOT YET IMPLEMENTED
- Search — DEFERRED
- Knowledge Detail — PLANNED

### Next Knowledge Decision

Before implementing the next capability, select and document the next production workflow.

Primary candidates:

1. Knowledge Publishing / Approval Workflow
2. Knowledge Detail
3. Production Category UI
4. Search after validating real Knowledge data

No new implementation should begin until the next capability and its architecture are explicitly selected.


---

# Master Application Architecture — September 2026

## Status

APPROVED

The MyLab application architecture now treats the Dashboard as the primary application portal and keeps each major domain independently responsible for its own experience and business logic.

## Application Portal

The Dashboard is the main entry point for authenticated users.

It is not a Knowledge page and does not own Knowledge business logic.

The Dashboard provides entry points and future widgets for:

- Knowledge
- Learning
- AI
- Community
- Economy
- Account
- Settings
- Help

The Dashboard is designed to remain extensible as new MyLab domains are introduced.

## Domain Separation

The application is organized around independent domains:

- Knowledge
- Learning
- AI
- Community
- Economy
- Account
- Settings
- Help
- Legal

Knowledge itself is divided into:

- Knowledge Experience
- Knowledge Management
- Knowledge Review

The user-facing Knowledge Experience must not be mixed with administrative authoring or review interfaces.

## Master Navigation Principle

The approved navigation model is:

Dashboard
→ Domain
→ Domain Experience

For Knowledge:

Dashboard
→ Knowledge
→ Knowledge Type
→ Category
→ Subcategory
→ Knowledge Detail
→ Language
→ Access

---

# Knowledge Experience Architecture — Approved

## Knowledge Catalog

Knowledge is presented to ordinary users as a structured laboratory knowledge catalog, not as one large generic listing.

The Knowledge home provides major entry points such as:

- Laboratory Tests
- Pathogens
- Equipment
- Procedures
- References
- Educational Content

Each Knowledge type may have its own taxonomy structure.

## Laboratory Tests

Example structure:

Laboratory Tests
→ Hematology
→ Clinical Chemistry
→ Immunology
→ Microbiology
→ Blood Bank
→ Coagulation
→ Hormones
→ other approved categories

## Pathogens

Example structure:

Pathogens
→ Bacteria
→ Gram Positive
→ Gram Negative

and:

Pathogens
→ Viruses
→ Fungi
→ Parasites
→ other approved categories

The taxonomy must therefore support hierarchical structures and must not assume that every Knowledge type uses the same number of category levels.

## Knowledge Detail

The user-facing Knowledge Detail page is:

`/[locale]/knowledge/[id]`

It is the central presentation page for published Knowledge.

It must support:

- common Knowledge information;
- type-specific sections;
- language selection;
- access control;
- Free content;
- Premium preview;
- full Premium content for entitled users;
- related Knowledge in future iterations.

---

# Access Architecture — Approved

Free/Premium is not a publication status.

Publication lifecycle and access level are separate concepts.

Publication status:

- draft
- published
- archived

Access:

- free
- premium

## Access Rules

Free:

User
→ Full Content

Premium + Entitled:

User
→ Entitlement
→ Full Content

Premium + Not Entitled:

User
→ Preview
→ Unlock / Purchase / Subscribe

Premium content must not be sent to an unauthorized client and hidden only through UI logic.

Authorization and entitlement checks must happen through the trusted server/database boundary.

---

# Economy Boundary — Approved

MyLab uses an internal application currency as part of the Economy domain.

The Knowledge domain does not own wallets, balances, transactions, or currency logic.

The conceptual relationship is:

Knowledge
→ Access Policy
→ Offer
→ Economy
→ MyLab Currency
→ Entitlement
→ User

The internal MyLab Currency is distinct from external real-world currencies.

External currencies may be introduced later only for external payment processing where required. They are not the application's internal Knowledge pricing currency.

The Economy architecture must remain reusable for:

- Knowledge
- Courses
- AI features
- future services
- bundles
- subscriptions
- rewards
- other monetized features

---

# Translation Architecture — Approved

A Knowledge Item represents one logical piece of MyLab knowledge.

Arabic and English are language representations of the same Knowledge identity.

Conceptually:

Knowledge Item
→ Arabic Version
→ English Version

Translations must not create unrelated duplicate Knowledge Items.

## Translation Lifecycle

Translation:

Draft
→ Translation Review
→ Approved
→ Published

Gemini may generate or assist with translation drafts.

Gemini is not the final authority for medical translation.

Human review and approval are required before publication.

## Translation Synchronization

When a source version changes, existing translations must be able to indicate that they require updating.

A translation must not silently be considered current when its source content has changed.

---

# User-Facing vs Administrative Knowledge

## User Experience

User-facing:

- Knowledge Home
- Knowledge Type
- Category
- Subcategory
- Knowledge Detail
- Free/Premium access experience

## Management

Administrative:

- Knowledge Management
- Authoring
- Editing
- Versioning

## Review

Administrative/reviewer:

- Review Queue
- Review Detail
- Reject
- Approve
- Publish

These layers must remain separated in routing, authorization, UI, and server-side data access.

---

# Master Application Sitemap — Approved

## Public

- Landing
- About
- Features
- Pricing
- FAQ
- Contact
- Privacy Policy
- Terms & Conditions
- Cookie Policy
- Medical Disclaimer

## Authentication

- Login
- Register
- Forgot Password
- Reset Password

## Authenticated Portal

- Dashboard

## Core Domains

- Knowledge
- Learning
- AI
- Community
- Economy

## User

- Account
- Profile
- Saved Content
- Purchases
- Subscription
- Security

## Settings

- General
- Appearance
- Language
- Notifications
- Privacy
- Security

## Help

- How MyLab Works
- Getting Started
- Help Center
- FAQ
- Contact
- Report a Problem

## Legal

- Privacy
- Terms
- Cookies
- Subscription Terms
- Refund Policy
- Medical Disclaimer

## Internal Knowledge Operations

- Knowledge Management
- Knowledge Review

All applicable pages must support the existing Arabic/English localization architecture.

---

# Navigation Architecture Rule

Internal navigation must use the project's existing locale-safe i18n navigation layer wherever applicable.

Avoid manually constructing locale-prefixed URLs inside application components when the existing navigation abstraction can provide the route.

This prevents inconsistent `/ar` and `/en` routing and avoids repeating the previously encountered Review navigation problem.

---

# Current Knowledge Implementation State

Completed:

- Knowledge database foundation
- Knowledge read layer
- First Knowledge browse slice
- Knowledge authoring
- Laboratory Test draft creation
- Laboratory Test draft editing
- Knowledge versioning
- Knowledge review workflow
- Review Queue
- Secure Review Detail
- Approve
- Reject
- Publish
- Review-state edit lock
- Arabic/English Knowledge UI
- Production verification for the implemented slices

Current integration test state:

- The original laboratory test integration record was successfully published through the full workflow.
- The published integration record must not be mutated merely to test another workflow state.
- A separate draft was created for rejection testing.
- Rejection E2E remains the next workflow verification item if still required.

---

# Current Gate

The Knowledge Experience architecture and Master Application Navigation are approved.

The next architecture gate is:

## Knowledge Data Model v1

The Data Model must cover:

- Knowledge identity
- Knowledge types
- hierarchical taxonomy
- versions
- language representations
- translation lifecycle
- publication lifecycle
- access policy
- Free/Premium
- offers
- entitlements
- Economy boundary
- MyLab Currency boundary
- secure content delivery
- RLS
- RPC/service boundaries
- audit requirements
- indexes and constraints

No production schema migration should be created until this model is explicitly reviewed and approved.

---

# Next Implementation Sequence

1. Knowledge Data Model v1
2. Reconcile the model with the existing Knowledge schema
3. Define required migrations
4. Define secure read/access boundaries
5. Define Knowledge Experience routes
6. Implement Knowledge Catalog
7. Implement Knowledge Detail
8. Implement Generic Knowledge Form
9. Standardize Knowledge UI with Brand → Tokens → CSS Variables → shadcn/ui
10. Review Knowledge image architecture
11. Complete navigation linking
12. Complete E2E verification
13. Documentation update
14. Commit
15. Push
16. Close the phase

---

# Architecture Principles Preserved

- Production-ready implementation only.
- No prototypes or temporary solutions.
- Architecture first.
- Database before dependent UI.
- Security before sensitive features.
- GitHub is the source of truth.
- Supabase migrations are version-controlled.
- Client UI is never the security boundary.
- Domain boundaries must remain explicit.
- Economy must remain independent from Knowledge.
- Translation must remain independent from Knowledge identity while staying linked to it.
