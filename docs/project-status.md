# MyLab Project Status

## Project

**MyLab**

Owner: Alfa
Version: 0.1.0

## Current Status

**Knowledge Domain — In Progress**

Current phase:

**Knowledge Consolidation & Completion**

The Knowledge domain foundation, authoring workflow, review/publishing workflow, and first production browse slices are implemented. The remaining work is the completion and consolidation of the Knowledge experience and shared media architecture.

## Repository

Repository:

`git@github.com:MyLabAdmin/MyLab.git`

GitHub is the single source of truth.

Expected branch:

`main`

## Current Architecture

MyLab is a Progressive Web Application for medical laboratory professionals and students.

Core stack:

- Next.js 16.3.0
- React 19
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui architecture
- CSS variables and design tokens
- next-intl
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage where applicable
- ImageKit for Knowledge media
- Google Gemini AI — planned integration
- GitHub

Supported languages:

- Arabic
- English

The application follows:

**Brand → Design Tokens → CSS Variables → UI Components → Application UI**

The client is never treated as the security boundary.

## Development Rules

All implementation must be:

- production-ready;
- architecture-first;
- database-first for domain data;
- security-first for sensitive operations;
- version-controlled;
- documented;
- maintainable;
- extensible without introducing unnecessary complexity.

Do not introduce:

- prototypes;
- temporary fixes;
- throwaway architecture;
- undocumented schema changes;
- client-side security decisions.

## Domain Architecture

Primary domains:

- Identity
- Knowledge
- Learning
- AI
- Community
- Economy

Supporting application areas:

- Account
- Settings
- Help
- Legal

The Dashboard is the authenticated application portal. It does not own domain business logic.

## Knowledge Domain

MyLab Knowledge is owned by MyLab.

Ordinary users may read published Knowledge according to access policy but cannot directly modify official Knowledge.

Knowledge management is restricted to authorized staff.

Major Knowledge types:

- Laboratory Tests
- Pathogens
- Equipment
- Procedures
- References
- Educational Content

The Knowledge architecture is extensible and must not assume that every type has the same fields.

Laboratory Tests remain specialized because their scientific structure requires dedicated entities and validation.

Other Knowledge types use the Generic Knowledge Form architecture where appropriate.

## Knowledge Layer Separation

Knowledge is separated into three application areas.

### Knowledge Experience

For ordinary users:

- discovery;
- catalog browsing;
- category browsing;
- search;
- detail;
- language selection;
- access-controlled content.

### Knowledge Management

For authorized staff:

- create;
- edit;
- save draft;
- create new versions;
- manage metadata;
- manage images.

### Knowledge Review

For authorized reviewers:

- review queue;
- review detail;
- approve;
- reject;
- publish.

These layers must remain separate in both routing and authorization.

## Knowledge Lifecycle

The approved Knowledge publishing lifecycle is:

`Draft → Pending Review → Rejected → Draft → Pending Review → Approved → Published`

Rules:

- Draft content is editable.
- Pending Review content is controlled by the review workflow.
- Rejected content remains unpublished and editable.
- Rejection requires a reason/note.
- Approved content may be published.
- Published versions are protected from mutation.
- Previous versions remain part of the audit/version history.
- Publishing must never expose invalid Knowledge.

## Knowledge Versioning

A Knowledge Item represents the logical identity of the content.

A Knowledge Item may contain multiple versions.

Version states include:

- draft
- published
- superseded

Review state is separate:

- draft
- pending_review
- approved
- rejected

Publication status and review status must not be conflated.

## Translation

One Knowledge Item represents one logical Knowledge identity.

Arabic and English are representations of the same Knowledge.

Translations are tied to a source version.

Translation lifecycle:

`Draft → Review → Approved → Published`

When the source version changes, an existing translation may become stale and require update.

Gemini may assist with translation drafts.

Human medical review is required before final publication of medical translations.

## Knowledge Taxonomy

Knowledge supports hierarchical taxonomy.

The hierarchy is extensible and must not be restricted to a fixed number of levels.

Example:

`Type → Category → Subcategory → Detail`

Different Knowledge types may use different taxonomy depth.

## Knowledge Access

Publication and access are separate concepts.

Publication determines whether Knowledge is officially available.

Access determines whether a user may receive the complete content.

Access tiers:

- FREE
- PREMIUM

Rules:

- FREE → full published content.
- PREMIUM + valid entitlement → full published content.
- PREMIUM without entitlement → preview only + unlock path.

Premium content must never be exposed to an unauthorized client.

## Economy Boundary

Knowledge does not own financial state.

Knowledge must not directly own:

- wallet;
- balance;
- currency;
- transactions;
- payment processing.

The architectural relationship is:

`Knowledge → Access Policy → Offer → Economy → MyLab Currency → Entitlement → User`

The internal MyLab Currency is an application concept and is separate from external payment currencies.

## Knowledge Image Architecture

Knowledge images are version-owned.

Relationship:

`Knowledge Version → knowledge_version_images → ImageKit`

Supabase stores:

- ImageKit file ID;
- file metadata;
- MIME type;
- dimensions;
- size;
- purpose;
- caption;
- alt text;
- sort order;
- Knowledge Version relationship;
- specimen relationship where applicable.

ImageKit stores the physical media.

## Image Security Model

The current production ImageKit architecture uses:

**Private Files**

because the current ImageKit plan does not provide Draft Assets.

Knowledge images are uploaded with:

`isPrivateFile = true`

`isPublished` is not used as the MyLab access-control mechanism.

MyLab controls access through:

1. Authentication
2. Authorization
3. Knowledge publication state
4. Access policy
5. Entitlement
6. Image ownership validation
7. ImageKit private-file validation
8. Short-lived signed URL generation

Private ImageKit credentials remain server-side.

The browser never receives the ImageKit private key.

## Image Lifecycle

The approved image lifecycle is:

`Draft Version → Upload → Pending Review → Approved → Published`

Rules:

- Images may be added to editable versions.
- Published versions are immutable.
- Rejected versions retain their images.
- A new Knowledge Version may reference the same physical ImageKit file through a new metadata relationship.
- Image ownership must always be validated against the expected Knowledge Version folder.
- Client-provided ImageKit paths and URLs are never trusted.
- ImageKit Details API is the server source of truth for uploaded-file verification.
- Local object URLs may be used for immediate browser preview.
- Private ImageKit files require server-generated signed URLs for actual delivery.

## Shared Knowledge Image Service

The shared image service is being implemented for all Knowledge types.

Current implementation files:

- `src/lib/knowledge/imagekit.ts`
- `src/lib/knowledge/knowledge-image-upload.ts`
- `src/app/api/imagekit/auth/route.ts`
- `src/app/api/knowledge/images/route.ts`
- `src/app/api/knowledge/images/[id]/route.ts`
- `src/app/api/knowledge/images/[id]/url/route.ts`

Responsibilities include:

- secure ImageKit authentication;
- version-scoped folders;
- client-side image validation;
- private upload;
- server-side ImageKit verification;
- Knowledge Version ownership validation;
- database metadata persistence;
- secure deletion;
- short-lived signed URL delivery;
- cleanup of owned orphan files after failed metadata persistence.

Current maximum Knowledge image size:

`5 MB`

Allowed MIME types:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`
- `image/avif`

## Image Authorization

Image upload requires:

- authenticated user;
- active account;
- `knowledge.manage`;
- editable Knowledge Version;
- draft or rejected review state.

Image metadata mutation follows the same ownership and version-state boundaries.

Image delivery requires:

- authenticated user;
- published Knowledge;
- valid FREE access or PREMIUM entitlement;
- or authorized staff access.

Review access must remain compatible with the Knowledge review authorization model.

## Knowledge Database Foundation

The Knowledge database contains the production foundation for:

- Knowledge Items;
- Knowledge Versions;
- Categories;
- Knowledge/Category relationships;
- Laboratory Tests;
- Specimens;
- Methods;
- Interpretations;
- Reference Ranges;
- Procedures;
- Equipment;
- References;
- Images;
- Translations;
- Pathogens;
- controlled laboratory entities;
- access policies;
- offers;
- entitlements.

Database security uses:

- PostgreSQL constraints;
- foreign keys;
- indexes;
- triggers;
- RLS;
- grants;
- server-side authorization;
- secure RPC boundaries where required.

## Authorization

The authorization architecture is capability-based and server-trusted.

Sensitive operations are enforced through:

`Authentication → Account State → Authorization → Resource Ownership → Domain Rules → RLS → Operation`

Existing authorization roles/capabilities must be reused rather than duplicated.

Knowledge authorization is based on the established administrative authorization model.

No arbitrary client-side role or capability checks are considered sufficient security.

## Knowledge Review Security

The review system uses secure server-side boundaries.

Reviewer operations are restricted to authorized reviewers.

The review queue and review detail must not expose draft content to unauthorized users.

Review decisions must remain auditable.

## Current Production Verification

The production build is verified with:

`npm run build`

Current build status:

**PASS**

The current Android/Termux environment uses:

`next build --webpack`

Webpack/WASM cache warnings may occur in the Termux environment. These are non-fatal when compilation and production build complete successfully.

Lint currently has known non-blocking warnings unrelated to the Knowledge image service.

## Safe Test Data

A separate draft Knowledge Item exists for safe workflow/media testing.

Knowledge Version:

`93ea2145-c7f4-4385-9976-b81efd6bdf13`

Knowledge Item:

`b8e771a1-03b6-40c3-90f3-2aba1dc11ec8`

Version:

`1`

Status:

`draft`

Review Status:

`draft`

Title:

`jdgdk`

This draft is separate from the original published integration Knowledge Item.

The original published integration record must not be mutated for testing.

## ImageKit Verification

ImageKit credentials and API connectivity were verified successfully.

Private ImageKit upload was verified successfully.

A private test file was uploaded and verified through the ImageKit Details API with:

- `isPrivateFile = true`
- valid version-scoped folder
- image file type
- valid MIME type
- valid file size

The diagnostic file was deleted successfully.

No production Knowledge image metadata rows were created by the diagnostic test.

## Current Repository State

At the beginning of the current work:

- `main` is the active branch.
- Shared Image Service changes are currently uncommitted.
- Knowledge documentation must remain synchronized with the actual implementation state.

Current uncommitted implementation:

- `src/app/api/imagekit/auth/route.ts`
- `src/app/api/knowledge/`
- `src/lib/knowledge/imagekit.ts`
- `src/lib/knowledge/knowledge-image-upload.ts`

## Remaining Knowledge Work

The remaining Knowledge completion sequence is:

1. Complete and verify Shared Knowledge Image Service.
2. Integrate shared image upload into the Generic Knowledge Form.
3. Integrate shared image upload into the Laboratory Test Form.
4. Verify all supported Knowledge types can own images correctly.
5. Complete Knowledge creation menu:
   - Laboratory Test
   - Pathogen
   - Equipment
   - Procedure
   - Reference
   - Educational Content
6. Complete Knowledge listing.
7. Add type/category filtering.
8. Add search after validating real data/use cases.
9. Complete Knowledge Detail.
10. Complete language representation behavior.
11. Complete FREE/PREMIUM access boundary.
12. Complete localization and navigation consistency.
13. Run full Knowledge E2E verification.
14. Close the Knowledge Consolidation & Completion phase.
15. Update project documentation.
16. Commit and push to `main`.

## Knowledge Navigation

The approved user journey is:

`Dashboard → Knowledge → Type → Category → Subcategory → Detail → Language → Access`

Management and Review remain separate:

`Knowledge → Management`

`Knowledge → Review`

Internal navigation must use the existing locale-safe i18n navigation abstraction.

Do not manually construct locale-prefixed URLs when the project's navigation abstraction can provide the route.

## Master Application Navigation

Public:

- `/`
- `/about`
- `/features`
- `/pricing`
- `/faq`
- `/contact`
- legal pages

Authentication:

- login
- register
- forgot password
- reset password

Authenticated:

- dashboard
- knowledge
- learning
- AI
- community
- economy
- account
- settings
- help

Knowledge operations:

- Knowledge Management
- Knowledge Review

## AI Architecture

Google Gemini is a planned external AI provider.

AI is an application service and is not a source of truth.

Preferred flow:

`User Question → MyLab AI → Context & Permission Check → MyLab Knowledge → Permitted Domain Content → External Knowledge when required → Gemini → MyLab AI Response`

MyLab Knowledge has the highest priority for relevant official MyLab questions.

The AI service must minimize and control context before sending information to an external provider.

Gemini must never receive unrestricted database or user-data access.

AI remains a planned implementation and is not currently a completed production domain.

## Phase History

### Phase 2.5 — Application Shell

**CLOSED**

Production-ready authenticated application shell completed and merged.

### Phase 2.6 — Domain Architecture

**CLOSED**

Core domain architecture, ownership boundaries, AI service boundary, Economy boundary, subscription direction, verification direction, and security principles established.

### Phase 2.7 — Identity & Authorization Foundation

**CLOSED**

Identity, account status, staff roles, capabilities, server-side authorization, and RLS direction established and reconciled.

### Phase 2.8 — Knowledge Domain Foundation & First Browse Slice

**CLOSED**

Knowledge database foundation, read layer, first browse slice, bilingual UI, navigation, empty/error states, and production verification completed.

### Phase 2.9 — Knowledge Authoring & Laboratory Test Draft Editing

**CLOSED**

Production Knowledge authoring, Laboratory Test creation/editing, draft lifecycle, atomic updates, validation, and supporting authoring infrastructure completed.

### Knowledge Review & Publishing

**CLOSED**

Review queue, review detail, rejection, approval, publication, review-state validation, and published-state protection completed.

### Shared Knowledge Image Service

**IN PROGRESS**

Secure private ImageKit upload, server-side verification, metadata relationship, deletion, and signed URL delivery are being consolidated into the shared production image service.

## Phase Completion Rule

Every completed phase must end with:

1. Verification
2. Documentation update
3. Commit
4. Push
5. Project status update
6. Pull request review/merge when applicable
7. Final synchronization with `main`

## Current Gate

The current gate is:

**Knowledge Consolidation & Completion**

The immediate implementation target is:

**Complete and verify Shared Knowledge Image Service.**

After this service is verified, continue with Generic Knowledge Form and Laboratory Test Form image integration.

## Source of Truth

GitHub is the single source of truth.

Repository:

`git@github.com:MyLabAdmin/MyLab.git`
