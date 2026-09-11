# Knowledge UI Architecture

**Status:** Approved for implementation
**Domain:** Knowledge
**Phase:** Knowledge Consolidation & Completion
**Branch:** feature/knowledge-ui-consolidation

## 1. Purpose

This document defines the production architecture for the unified MyLab Knowledge user interface.

The goal is to consolidate Knowledge discovery, reading, authoring, review, publishing, media, access, language, and state experiences into one coherent UI architecture without rewriting the existing Knowledge domain foundation.

The UI must remain aligned with the existing domain model, authorization boundaries, lifecycle, versioning, and publication rules.

## 2. Knowledge Experiences

Knowledge is divided into three distinct experiences.

### Knowledge Experience

For ordinary users and authorized readers.

Responsibilities:

- Knowledge discovery
- Search
- Filtering
- Type browsing
- Category browsing
- Knowledge detail
- Related Knowledge
- References
- Media
- Language selection
- Access presentation

The Knowledge Experience must expose only content permitted by application authorization and publication policy.

### Knowledge Management

For authorized Knowledge managers and administrators.

Responsibilities:

- Create Knowledge
- Edit Knowledge
- Save drafts
- Manage taxonomy
- Manage metadata
- Manage structured content
- Manage translations
- Manage version-owned media
- Submit Knowledge for review
- View version history

The UI is not a security boundary.

### Knowledge Review

For authorized reviewers.

Responsibilities:

- Review queue
- Review detail
- Inspect submitted versions
- Inspect metadata
- Inspect taxonomy
- Inspect media
- Approve
- Reject
- Provide rejection reason
- Publish approved versions

Review and management remain separate experiences even when shared components are used.

## 3. Target Navigation

The Knowledge experience should converge toward:

Knowledge
├── Discovery
│   ├── Overview
│   ├── Search
│   ├── Types
│   ├── Categories
│   └── Filters
├── Knowledge Results
│   ├── Cards / List
│   ├── Type
│   ├── Category
│   ├── Access
│   └── Language
├── Knowledge Detail
│   ├── Header
│   ├── Summary
│   ├── Structured Content
│   ├── Images / Media
│   ├── References
│   ├── Related Knowledge
│   └── Access Boundary
├── Management
│   ├── Knowledge Items
│   ├── Create
│   ├── Edit
│   ├── Versions
│   └── Media
└── Review
    ├── Queue
    ├── Review Detail
    ├── Decisions
    └── Publish

The actual Next.js route structure may differ where required by existing architecture, but the user experience must preserve this separation.

## 4. Knowledge Types

The UI must support:

1. Laboratory Tests
2. Pathogens
3. Equipment
4. Procedures
5. References
6. Educational Content

Each type should have:

- Stable type identifier
- Arabic label
- English label
- Description
- Icon
- Discovery representation
- Detail representation
- Authorization behavior
- Available actions

Type configuration should be centralized rather than duplicated across pages.

## 5. Generic and Specialized UI

Knowledge detail follows:

KnowledgeDetail
└── GenericKnowledgeDetail
    ├── Core sections
    ├── Taxonomy
    ├── Metadata
    ├── Media
    ├── References
    └── Type-specific sections

Laboratory Tests remain specialized because their domain structure is materially different.

Other Knowledge types should use the generic detail architecture with type-specific sections where required.

Authoring follows the same principle:

KnowledgeForm
└── GenericKnowledgeForm
    ├── Core
    ├── Taxonomy
    ├── Metadata
    ├── Media
    └── Specialized section

Existing reusable Knowledge form components must be extended and consolidated rather than duplicated.

## 6. Shared UI Vocabulary

The Knowledge domain should converge on reusable components where justified:

- KnowledgeShell
- KnowledgeHeader
- KnowledgeBreadcrumbs
- KnowledgeTypeBadge
- KnowledgeStatusBadge
- KnowledgeAccessBadge
- KnowledgeCard
- KnowledgeGrid
- KnowledgeList
- KnowledgeSearch
- KnowledgeFilters
- KnowledgeCategoryTree
- KnowledgeDetail
- KnowledgeSection
- KnowledgeMediaGallery
- KnowledgeMetadata
- KnowledgeRelatedItems
- KnowledgeEmptyState
- KnowledgeErrorState
- KnowledgeLoadingState

Existing equivalent components must be reused instead of creating duplicates.

## 7. Discovery Contract

Knowledge discovery must use an application-level search/query contract.

The UI must not depend directly on PostgreSQL search implementation details.

Conceptually:

KnowledgeSearch
→ Knowledge Query Contract
→ Filters
→ Results
→ KnowledgeCard / KnowledgeList

The contract should support evolution toward:

- Full-text search
- Ranking
- Synonyms
- Terminology
- Alternative names
- Analytes
- Categories
- Educational content
- Related concepts
- Semantic search

The initial UI must not require semantic search to be implemented.

## 8. Knowledge Detail Contract

Knowledge detail must provide a consistent shell across Knowledge types.

The common structure is:

- Breadcrumbs
- Header
- Type
- Title
- Status
- Access
- Summary
- Media
- Structured Content
- Taxonomy
- References
- Related Knowledge
- Access Boundary

Type-specific structured content is rendered inside the common detail shell.

## 9. Lifecycle

Knowledge lifecycle is:

Draft
→ Pending Review
→ Approved
→ Published

Alternative path:

Pending Review
→ Rejected
→ Draft

Published versions may become:

Superseded

The UI must distinguish:

- Review state
- Publication state
- Version state

These concepts must not be collapsed into one generic status.

## 10. Lifecycle UI Rules

### Draft

Editable by authorized management users.

Possible actions:

- Save
- Continue editing
- Submit for review

### Pending Review

Controlled by review workflow.

Management editing must respect existing backend rules.

Reviewer actions may include:

- Approve
- Reject

### Rejected

Must remain unpublished.

The rejection reason must be visible to authorized users.

The content can return to Draft for correction.

### Approved

Eligible for publication according to existing publishing rules.

### Published

Published content is protected from mutation.

A new version must be created for future changes.

### Superseded

Historical version retained for audit and version history.

## 11. Versioning

Knowledge identity and Knowledge version are separate concepts.

Knowledge Item
├── Version 1
├── Version 2
└── Version 3

A version owns its content and media.

The UI must make version context explicit whenever users manage, review, or inspect non-current versions.

Published versions must remain immutable.

## 12. Translation

Arabic and English are representations of the same Knowledge identity/version.

The UI must not treat translations as unrelated Knowledge items.

Conceptually:

Knowledge Item
└── Version
    ├── Arabic representation
    └── English representation

Language switching must preserve:

- Knowledge identity
- Version context
- Access rules
- Publication state

Arabic and English must both support existing RTL/LTR architecture.

## 13. Media

Knowledge media is version-owned.

The UI must support:

- Upload
- Preview
- Caption
- Alt text
- Ordering
- Removal where permitted
- Published rendering

Media authorization must follow backend authorization and publication policy.

The UI must never assume media is public merely because an upload exists.

## 14. Access

Access and publication are separate concepts.

The UI should communicate access using reusable access indicators.

Potential presentation:

- Free
- Restricted
- Premium
- Authorized users only

The exact policy must come from the existing Knowledge access model and must not be hard-coded as a client-side security decision.

## 15. State UX

All major Knowledge routes must provide production-ready states for:

- Loading
- Empty
- Error
- Forbidden
- Not found
- Unauthorized action

These states must use the existing MyLab Brand Layer and shared UI primitives.

## 16. Responsive Design

Knowledge UI must support:

- Desktop
- Tablet
- Mobile

Responsive composition should be used instead of duplicated desktop/mobile implementations.

Particular attention is required for:

- Search
- Filters
- Knowledge cards
- Detail sections
- Authoring action bars
- Review actions
- Media galleries

## 17. Navigation and Breadcrumbs

Knowledge navigation must provide a consistent contextual path.

Examples:

Knowledge
→ Laboratory Tests
→ CBC

Knowledge
→ Management
→ Edit Knowledge

Knowledge
→ Review
→ Pending Review
→ Knowledge Item

Breadcrumbs must reflect actual route and context.

## 18. Authorization

Authorization is enforced outside the UI.

The UI may:

- Hide unavailable actions
- Present forbidden states
- Adapt navigation based on known authorization state

The UI must never rely on hidden buttons as the security mechanism.

Sensitive mutations must continue through the existing secure application/backend boundary.

## 19. Implementation Sequence

### Phase 1 — Discovery

- Knowledge landing
- Type navigation
- Category navigation
- Search
- Filters
- Results
- Cards/list
- Empty/loading/error states

### Phase 2 — Detail

- Shared detail shell
- Generic detail
- Type-specific sections
- Media
- Metadata
- References
- Related Knowledge
- Access presentation

### Phase 3 — Authoring Consolidation

- Existing generic form consolidation
- Lifecycle presentation
- Metadata
- Taxonomy
- Translation
- Media
- Version context
- Action bar

### Phase 4 — Review Consolidation

- Review queue
- Review detail
- Version context
- Decision UI
- Rejection reason
- Approval
- Publication flow

### Phase 5 — Cross-cutting UX

- Arabic/English
- RTL/LTR
- Responsive behavior
- Loading states
- Empty states
- Error states
- Forbidden states
- Navigation consistency

### Phase 6 — Production Verification

- TypeScript
- ESLint
- Production build
- Route verification
- Authorization verification
- Lifecycle verification
- Responsive verification
- Translation verification
- Regression verification

## 20. Non-Goals

This consolidation does not authorize:

- Rewriting Supabase architecture
- Replacing existing authorization
- Replacing the Knowledge database model without architectural review
- Rebuilding the Brand Layer
- Creating temporary UI prototypes
- Duplicating existing components
- Moving security decisions into the client
- Automatically publishing AI-generated content
- Introducing semantic search before the application query contract is stable

## 21. Source of Truth

GitHub is the project source of truth.

All architectural and implementation changes must be:

1. Made in the repository.
2. Reviewed.
3. Verified locally.
4. Committed.
5. Pushed.
6. Reflected in project documentation where applicable.

## 22. Completion Criteria

Knowledge UI consolidation is complete only when:

- Discovery is unified.
- Search and filtering are coherent.
- Knowledge types and categories are connected.
- Detail pages use a shared architecture.
- Laboratory Tests retain required specialization.
- Generic Knowledge types use the generic architecture.
- Authoring uses the shared Knowledge form system.
- Review uses the same Knowledge visual language.
- Lifecycle and version states are explicit.
- Media follows version ownership.
- Access is clearly represented.
- Arabic and English are coherent.
- RTL/LTR behavior is verified.
- Responsive behavior is verified.
- Loading, empty, error, forbidden, and not-found states exist.
- Authorization boundaries remain backend-enforced.
- TypeScript, lint, and production build pass.
- Changes are committed and pushed to GitHub.
