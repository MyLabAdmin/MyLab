# MyLab Identity Model

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Purpose

The Identity domain manages authentication, user identity, profiles, roles, permissions, and account lifecycle.

Authentication is part of Identity.

The Dashboard is not part of Identity. It is an Application UI surface.

## Authentication

MyLab authentication must support:

- Registration
- Login
- Logout
- Session management
- Email verification
- Password recovery
- Password reset
- Authentication failure handling
- Account state enforcement

Authentication is responsible for proving the user's identity.

Authentication credentials and provider-specific authentication data must remain separated from application profile data.

## Registration

The registration flow is:

Registration
→ Authentication Account
→ MyLab Identity
→ Initial Profile
→ Initial Role
→ Account Initialization
→ Wallet Creation
→ Preferences Initialization
→ Ready

Registration must be implemented as a controlled application workflow.

Duplicate account initialization must be prevented.

## Login

Login is a core Identity capability.

The login flow is:

Login Request
→ Input Validation
→ Authentication Provider
→ Session Creation
→ Account State Check
→ Authorized Application Session
→ Application UI

A successfully authenticated user must still pass account-state and authorization checks before protected application functionality is available.

Invalid credentials must not reveal unnecessary account information.

## Logout

Logout terminates the authenticated application session.

Logout must invalidate the active authentication session according to the configured authentication strategy.

## Session Management

Sessions are managed by the authentication system.

Protected application operations must require a valid authenticated session.

The server must not trust client-provided identity information without validating the authenticated session.

## Email Verification

Email verification is part of the account lifecycle.

The system may restrict selected functionality until the required verification state is satisfied.

Verification state must be stored and enforced through the Identity architecture.

## Password Recovery

Password recovery must use a secure recovery flow provided by the authentication system.

The application must not implement password storage or custom password-reset mechanisms.

Recovery tokens and credentials must never be exposed through application data models.

## MyLab Identity

Authentication identifies the account.

MyLab Identity represents the authenticated user inside the platform.

The conceptual relationship is:

Authentication Account
→ MyLab Identity

MyLab Identity owns application-level identity information.

## Profile

The user profile contains application-level information.

Possible profile information includes:

- Display name
- Preferred language
- Profile image
- Professional information
- Educational information
- Account preferences

Sensitive or regulated information must only be collected when explicitly required by a defined feature and protected accordingly.

## Professional Profile

MyLab is intended for:

- Doctors
- Laboratory professionals
- Laboratory students

Professional or educational classification belongs to the profile/identity model rather than being implemented as the authentication role itself.

The system must support future verification workflows where required.

## Roles

Roles represent groups of capabilities.

Examples may include:

- User
- Instructor
- Reviewer
- Knowledge Editor
- Community Moderator
- Administrator

A user may have more than one role when authorized.

Roles must not be hard-coded into UI components.

## Permissions

Permissions represent specific actions that an authenticated user may perform.

Examples:

- Create course
- Submit course
- Review course
- Approve course
- Edit knowledge content
- Moderate community content
- Manage users

Authorization decisions should be based on explicit permissions and resource ownership where applicable.

A role may grant a defined set of permissions.

## Resource Ownership

Authorization must also consider resource ownership.

Example:

A course instructor may edit a course they own or are explicitly authorized to manage.

Authentication alone does not grant access to resources.

## Account State

The Identity domain must support explicit account states.

Examples:

- Pending
- Active
- Suspended
- Disabled

Account state must be enforced consistently by protected application operations.

A suspended or disabled account must not continue to access protected functionality simply because an old client session exists.

## Account Initialization

Account initialization is a controlled post-registration workflow.

It must ensure that required platform resources are created exactly once.

The initialization process includes:

1. Create or confirm MyLab Identity.
2. Create or confirm initial profile.
3. Assign the initial role.
4. Create or confirm Economy wallet.
5. Generate or confirm wallet identifier.
6. Initialize required preferences.
7. Mark initialization as completed.

The workflow must be safe to retry without creating duplicate resources.

## Economy Boundary

The Wallet belongs to the Economy domain.

Identity may initiate account initialization, but Identity does not own wallet balances, ledger entries, or financial transactions.

The boundary is:

Identity
→ Account Initialization
→ Economy Wallet Creation

Economy remains responsible for wallet and financial rules.

## Notifications Boundary

Identity may emit application events such as:

- Account registered
- Email verified
- Password changed
- Account suspended
- Account restored

The Notifications domain may consume these events and generate appropriate notifications.

Identity does not directly implement notification delivery.

## Security Principles

Identity must follow these principles:

- Authentication is server-trusted, not client-declared.
- Authorization is enforced server-side.
- Credentials are managed by the authentication provider.
- Sensitive authentication data is never stored in application tables unless explicitly required by the architecture.
- Protected operations require an authenticated session.
- Account state is checked during authorization.
- Resource ownership is checked where applicable.
- Security-sensitive operations are auditable where required.

## Domain Boundaries

Identity owns:

- Authentication integration
- MyLab identity
- Profile
- Roles
- Permissions
- Account state
- Identity preferences

Identity does not own:

- Wallets
- Financial transactions
- Laboratory knowledge
- Courses
- Learning progress
- AI provider data
- Community content
- Notification delivery

## Production Principle

Authentication and Identity are production capabilities from the beginning.

There is no temporary authentication implementation.

The final architecture must be used from the first implementation.

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
