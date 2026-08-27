MyLab Project Status

Project: MyLab
Owner: Alfa
Version: 0.1.0

Current Status

Phase 2.5 — Application Shell — CLOSED

Phase 2.5 was successfully implemented, verified, reviewed, merged, and synchronized with "main".

Current phase:

Phase 2.6 — Domain Architecture & Authorization Foundation

Status:

Architecture Definition — IN PROGRESS

No new domain feature implementation should begin until Phase 2.6 architecture is reviewed and accepted.

Repository

git@github.com:MyLabAdmin/MyLab.git

GitHub is the single source of truth.

Current Main Commit

65b880e — Merge pull request #5 from MyLabAdmin/feat/phase-2.5-application-shell

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
