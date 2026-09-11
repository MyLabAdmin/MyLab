# MyLab Session Handoff

## Project

MyLab

## Owner

Alfa

## Repository

`git@github.com:MyLabAdmin/MyLab.git`

GitHub is the single source of truth.

## Current Phase

**Knowledge Consolidation & Completion**

## Current Objective

Complete the Knowledge domain as a coherent production-ready system.

Immediate objective:

**Shared Knowledge Image Service**

Then:

1. Generic Knowledge Form
2. Laboratory Test Form integration
3. Creation menu
4. Listing/filtering/search
5. Knowledge Detail
6. Access boundary
7. Localization/navigation consistency
8. Full E2E verification
9. Documentation closure

## Development Environment

- Termux on Android ARM64
- Git
- GitHub CLI
- Node.js
- npm

Production verification:

`npm run build`

The project uses:

`next build --webpack`

for production builds in the current Termux environment.

## Core Stack

- Next.js 16.3.0
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui architecture
- CSS variables
- Design tokens
- App Router
- next-intl
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage where applicable
- ImageKit
- Google Gemini — planned
- GitHub

## Architecture Principles

Development follows:

**Decision → Action → Verification → Documentation → Commit → Push → Close**

Rules:

- production-ready implementation only;
- no prototypes;
- no temporary architecture;
- database before dependent domain UI;
- security before sensitive features;
- client is never the security boundary;
- version all database changes;
- preserve established domain boundaries;
- complete and verify each step before starting the next.

## Knowledge Architecture

Knowledge is owned by MyLab.

Ordinary users read published Knowledge.

Authorized staff manage Knowledge.

Authorized reviewers review and publish Knowledge.

Major types:

- Laboratory Tests
- Pathogens
- Equipment
- Procedures
- References
- Educational Content

Laboratory Test authoring remains specialized.

Other types use the Generic Knowledge Form architecture.

## Knowledge Separation

### Experience

Ordinary users:

- discovery
- catalog
- categories
- search
- detail
- language
- access

### Management

Authorized staff:

- create
- edit
- draft
- version
- images

### Review

Authorized reviewers:

- queue
- detail
- reject
- approve
- publish

These layers remain separate.

## Knowledge Lifecycle

`Draft → Pending Review → Rejected → Draft → Pending Review → Approved → Published`

Published versions are immutable.

Rejected versions remain editable and unpublished.

Rejection requires a reason.

## Versioning

A Knowledge Item represents logical identity.

Versions represent revisions.

Version status:

- draft
- published
- superseded

Review status:

- draft
- pending_review
- approved
- rejected

These states are separate.

## Translation

One Knowledge Item has Arabic and English representations.

Translations belong to a source version.

Translation lifecycle:

`Draft → Review → Approved → Published`

Gemini may assist with translation drafts.

Human medical review is required before final publication.

## Knowledge Taxonomy

Taxonomy is hierarchical and extensible.

Do not hard-code a fixed depth.

The common experience is:

`Type → Category → Subcategory → Detail`

Different Knowledge types may use different hierarchy depth.

## Knowledge Access

Publication and access are separate.

Access tiers:

- FREE
- PREMIUM

Rules:

- FREE → full content.
- PREMIUM + entitlement → full content.
- PREMIUM without entitlement → preview only.

Unauthorized premium content must never reach the client.

## Economy Boundary

Knowledge does not own:

- wallet
- currency
- balance
- transactions
- payment processing

Conceptual flow:

`Knowledge → Access Policy → Offer → Economy → MyLab Currency → Entitlement → User`

## Image Architecture

Physical Knowledge media is stored in ImageKit.

Supabase stores version-level image metadata and relationships.

Relationship:

`Knowledge Version → knowledge_version_images → ImageKit`

## ImageKit Production Decision

The current ImageKit plan does not support Draft Assets.

Therefore the production architecture uses:

**Private ImageKit Files**

with:

`isPrivateFile = true`

Do not use `isPublished` as the MyLab access-control mechanism.

MyLab controls access.

Private URLs are delivered through short-lived server-generated signed URLs.

Private ImageKit credentials remain server-side.

## Image Service

Current files:

- `src/lib/knowledge/imagekit.ts`
- `src/lib/knowledge/knowledge-image-upload.ts`
- `src/app/api/imagekit/auth/route.ts`
- `src/app/api/knowledge/images/route.ts`
- `src/app/api/knowledge/images/[id]/route.ts`
- `src/app/api/knowledge/images/[id]/url/route.ts`

Responsibilities:

- secure upload authentication;
- version-scoped ImageKit folders;
- client-side validation;
- private uploads;
- ImageKit Details API verification;
- metadata persistence;
- ownership validation;
- deletion;
- signed URL delivery;
- controlled cleanup.

Maximum Knowledge image size:

`5 MB`

Allowed:

- JPEG
- PNG
- WebP
- GIF
- AVIF

## Image Authorization

Upload:

- authenticated;
- active account;
- `knowledge.manage`;
- editable version;
- draft/rejected review state.

Mutation:

- same authorization boundary;
- version ownership;
- published protection.

Delivery:

- published Knowledge;
- valid FREE access or PREMIUM entitlement;
- or authorized staff preview.

## Safe Test Draft

Version:

`93ea2145-c7f4-4385-9976-b81efd6bdf13`

Knowledge Item:

`b8e771a1-03b6-40c3-90f3-2aba1dc11ec8`

Title:

`jdgdk`

Status:

`draft`

Review:

`draft`

Use this separate draft for media/workflow testing.

Do not mutate the original published integration record.

## ImageKit Verification History

Verified:

- ImageKit credentials configured.
- ImageKit API connectivity successful.
- Private upload successful.
- ImageKit Details API confirmed `isPrivateFile = true`.
- Version-scoped folder confirmed.
- Test file successfully deleted.

No production Knowledge image metadata was created by the diagnostic test.

## Current Local Working Tree

Current uncommitted files:

- `src/app/api/imagekit/auth/route.ts`
- `src/app/api/knowledge/`
- `src/lib/knowledge/imagekit.ts`
- `src/lib/knowledge/knowledge-image-upload.ts`

Branch:

`main`

## Important Current Technical Point

`@imagekit/next` upload `responseFields` does not expose `filePath` or `url`.

The client upload helper must request only supported response fields, currently:

`responseFields: ['isPrivateFile']`

The server must retrieve authoritative file details from the ImageKit Details API.

The client must never be trusted for:

- file path;
- public URL;
- ownership;
- privacy state;
- file size;
- MIME type;
- Knowledge Version ownership.

## Secure Signed URL

Private Knowledge image delivery follows:

`Authenticated User → Knowledge Access Check → Image Ownership Check → ImageKit Details Check → Private File Check → Version Folder Check → Signed URL`

Signed URLs are short-lived.

The ImageKit private key remains server-side.

## Next Implementation Sequence

### Step 1

Finish Shared Image Service verification.

Verify:

- upload;
- metadata persistence;
- private state;
- version folder ownership;
- MIME validation;
- size validation;
- delete;
- signed URL;
- access denial;
- staff access;
- published/free access;
- premium entitlement access;
- rejection behavior.

### Step 2

Integrate shared image service into Generic Knowledge Form.

### Step 3

Integrate shared image service into Laboratory Test Form.

Laboratory Test remains specialized.

### Step 4

Complete Knowledge creation menu.

### Step 5

Complete Knowledge listing:

- type;
- category;
- status;
- search;
- pagination where required.

### Step 6

Complete Knowledge Detail.

### Step 7

Complete FREE/PREMIUM access boundary.

### Step 8

Verify Arabic/English and locale-safe navigation.

### Step 9

Run complete Knowledge E2E verification.

### Step 10

Close the Knowledge Consolidation & Completion phase.

## Verification Standard

Before closing the phase:

- `npm run lint`
- `npm run build`
- `git diff --check`
- runtime verification of relevant Arabic routes;
- runtime verification of relevant English routes;
- database integrity checks;
- authorization checks;
- image access checks;
- workflow checks.

## Documentation Standard

At phase closure:

1. Update `docs/project-status.md`.
2. Update `docs/session-handoff.md`.
3. Add a project progress comment.
4. Commit changes.
5. Push to `main`.
6. Verify `main` equals `origin/main`.

## Communication Protocol

Alfa is the final decision authority.

Technical execution should remain concise:

**Decision → Action → Verification → Commit → Push**

Do not create unnecessary intermediate steps.

## Final Handoff Rule

A future session must be able to continue from this document without reconstructing the Knowledge architecture or repeating completed work.

The current immediate task is:

**Shared Knowledge Image Service verification and completion.**
