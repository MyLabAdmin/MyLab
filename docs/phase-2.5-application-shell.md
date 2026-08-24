# MyLab Phase 2.5 — Application Shell

## Status

Planned

## Objective

Establish the production-ready authenticated application shell that will provide the structural UI foundation for MyLab domain features.

## Scope

- Application shell
- Header
- Primary navigation
- Main content area
- Responsive behavior
- Arabic/English support
- RTL/LTR support
- Brand integration
- Reusable UI component structure
- Identity-aware presentation
- Dashboard integration

## Out of Scope

- Knowledge feature implementation
- Learning feature implementation
- Community feature implementation
- Economy feature implementation
- AI feature implementation
- Notification feature implementation
- New database domain implementation
- New authorization model

## Architectural Flow

Authentication
→ Account/Profile Validation
→ Application Shell
→ Navigation
→ Domain Page

## Component Architecture

The shell must use reusable production components.

Components must have clear responsibilities and must not contain domain-specific business logic.

## Internationalization

The shell must support:

- English
- Arabic
- LTR
- RTL

All user-facing shell text must use the existing i18n architecture.

## Responsive Strategy

The shell must support:

- Desktop
- Tablet
- Mobile

Navigation behavior must adapt to viewport size without duplicating application logic.

## Brand Integration

The shell must use the existing MyLab:

- Brand layer
- Design tokens
- CSS variables
- Existing visual identity

No replacement design system should be introduced.

## Security Boundary

The shell is a presentation/application surface.

Authentication and authorization remain server-trusted.

The UI must never be treated as the security boundary.

## Dashboard

The existing dashboard page will become the first consumer of the application shell.

Dashboard domain functionality beyond the shell is out of scope for Phase 2.5.

## Acceptance Criteria

- Authenticated users enter the application through the shell.
- Unauthenticated users cannot access protected shell routes.
- Users without a completed profile follow the existing profile-completion flow.
- Arabic and English rendering work correctly.
- RTL and LTR layouts work correctly.
- Shell is responsive across desktop, tablet, and mobile.
- Navigation is reusable and maintainable.
- Existing brand tokens are used consistently.
- No domain business logic is embedded in shell components.
- Production build passes.
- TypeScript validation passes.
- Git working tree is clean before completion.
- Changes are committed and pushed.
- Pull request is reviewed and merged when applicable.

## Development Sequence

1. Review current layout and routing architecture.
2. Review existing reusable components and design tokens.
3. Finalize shell component boundaries.
4. Implement shell foundation.
5. Implement navigation.
6. Integrate i18n and RTL/LTR behavior.
7. Integrate responsive behavior.
8. Integrate dashboard.
9. Verify authentication/profile redirects.
10. Run production verification.
11. Update project documentation.
12. Commit.
13. Push.
14. Pull request review/merge.

## Phase Gate

Phase 2.5 is complete only when the application shell is production-ready, documented, verified, committed, and merged into `main`.

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
