# MyLab Security & Authorization Architecture

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Purpose

The Security and Authorization architecture defines how MyLab protects identities, data, business operations, financial operations, AI capabilities, and cross-domain resources.

Security is a core architectural capability.

Security must be implemented from the beginning using the final production architecture.

## Core Principle

Authentication proves who the user is.

Authorization determines what the authenticated user is allowed to do.

Authentication and authorization are separate responsibilities.

The client must never be treated as the authoritative source of identity, permissions, roles, account state, or ownership.

The security flow is:

Client
→ Authentication
→ Session Validation
→ Account State
→ Authorization
→ Resource Ownership
→ Domain Rules
→ Operation

## Security Layers

MyLab uses defense in depth.

The security layers are:

1. Client security
2. Authentication
3. Session validation
4. Account-state enforcement
5. Server-side authorization
6. Domain business rules
7. Supabase Row Level Security
8. PostgreSQL constraints
9. Auditability
10. Monitoring and incident handling

No single layer is considered sufficient for sensitive operations.

## Authentication

Authentication is owned by the Identity domain.

Supabase Auth is the initial authentication provider.

Authentication must support:

- Registration
- Login
- Logout
- Session management
- Email verification
- Password recovery
- Password reset
- Authentication failure handling

The application must never implement custom password storage.

Passwords, recovery credentials, and provider authentication secrets remain managed by the authentication provider.

## Authentication Account Separation

Supabase Auth maintains authentication-provider identity.

MyLab application tables maintain application identity.

The relationship is:

Supabase Auth User
→ MyLab Identity

The authentication user identifier must be stored as a controlled reference in the Identity domain.

Authentication data must not be duplicated unnecessarily in application tables.

## Login Security

The login flow is:

Login Request
→ Input Validation
→ Authentication Provider
→ Session Creation
→ Session Validation
→ Account State Check
→ Authorization Context
→ Application UI

Invalid authentication attempts must not reveal whether an account exists through unnecessary error detail.

Protected application functionality must require a valid authenticated session.

## Session Management

Sessions are managed by the authentication system.

The server must validate the authenticated session before performing protected operations.

Client-provided identity information must never be trusted without session validation.

An expired or invalid session must not authorize protected operations.

Account state must be re-evaluated for sensitive operations.

## Logout

Logout must terminate the active authentication session according to the configured authentication strategy.

Protected operations must no longer be authorized after session termination.

## Email Verification

Email verification is part of the Identity lifecycle.

The application may restrict selected capabilities until the required verification state is satisfied.

Verification state must be evaluated server-side.

## Password Recovery

Password recovery must use the authentication provider's secure recovery flow.

The application must not create custom password-reset storage or credential mechanisms.

Recovery tokens must never be stored as ordinary application data.

## Account State

Identity owns account state.

Supported states include:

- Pending
- Active
- Suspended
- Disabled

Authorization must consider account state.

Suspended and disabled accounts must not continue accessing protected functionality merely because a client retains an old session.

## Authorization Model

Authorization is based on:

- Identity
- Account state
- Roles
- Permissions
- Resource ownership
- Domain rules
- Operation context

The conceptual decision is:

Authenticated?
→ Account Active?
→ Has Permission?
→ Owns Resource or Explicitly Authorized?
→ Domain Rule Valid?
→ Allow

Otherwise:

→ Deny

## Roles

Roles represent groups of capabilities.

Examples include:

- User
- Instructor
- Reviewer
- Knowledge Editor
- Community Moderator
- Administrator

Roles must not be hard-coded into individual UI components.

Role assignments must be stored and enforced through the Identity authorization model.

## Permissions

Permissions represent explicit capabilities.

Examples include:

- Create course
- Submit course
- Review course
- Approve course
- Publish course
- Edit knowledge
- Moderate community
- Manage users
- Perform administrative financial operations

Authorization should prefer explicit permissions over scattered role checks.

## Role-Permission Relationship

The relationship is:

Identity
→ Roles
→ Permissions

A role may grant multiple permissions.

An identity may have multiple roles.

Effective permissions are derived from the assigned roles and explicit authorization rules.

## Resource Ownership

Authorization must consider ownership where applicable.

Examples:

Course
→ Owner Identity

Post
→ Author Identity

Wallet
→ Owner Identity

Notification
→ Recipient Identity

A user must not access another user's resource merely because they are authenticated.

Ownership checks must be enforced server-side.

## Explicit Delegation

Some resources may be managed by another authorized identity without direct ownership.

Delegated access must be represented explicitly.

Examples include:

- Course reviewer
- Community moderator
- Knowledge editor

Delegated authorization must never be inferred from UI state.

## Server-Side Authorization

Sensitive authorization decisions must occur server-side.

The application/server layer is responsible for:

- Validating the session
- Resolving identity
- Evaluating account state
- Resolving permissions
- Checking ownership
- Applying domain rules
- Executing protected operations

The client may request an operation but must not decide whether the operation is allowed.

## UI Authorization

The UI may hide or disable controls based on the current authorization context.

However, UI restrictions are not security controls.

Every protected operation must independently enforce authorization on the server.

## Supabase Row Level Security

RLS is a core database security mechanism.

Protected application tables must have RLS enabled.

RLS policies must be based on authenticated identity and applicable authorization rules.

RLS must not rely on arbitrary client-provided identity identifiers.

## RLS Identity Principle

RLS should derive the authenticated user from the trusted Supabase authentication context.

The policy must not trust:

- Client-provided user IDs
- Client-provided role claims without validation
- Hidden form fields
- Query parameters as identity proof

## RLS Ownership Pattern

Where a resource belongs directly to an identity, RLS should enforce ownership.

Conceptually:

Authenticated Identity
→ Resource Owner
→ Allow

Otherwise:

→ Deny

## RLS and Domain Boundaries

RLS must respect domain ownership.

A domain must not receive unrestricted access to another domain's tables merely because an operation is initiated from that domain.

Cross-domain access must use explicit authorization and controlled access paths.

## RLS and Server Operations

Some sensitive operations may require controlled server-side execution.

Examples include:

- Financial mutations
- Administrative operations
- Account initialization
- Moderation actions
- AI operations involving protected data

Server-side execution does not eliminate the need for appropriate database security.

## Service Role

Supabase service-role credentials are highly privileged.

They must:

- Never be exposed to browsers
- Never be stored in client-accessible environment variables
- Never be committed to GitHub
- Never be embedded in frontend code

Service-role access must be server-side only.

Use of service-role privileges must be limited to operations that require them.

## Financial Security

Economy requires the strongest authorization controls.

Financial operations include:

- Wallet creation
- Credits
- Debits
- Purchases
- Refunds
- Transfers
- Adjustments

The client must never directly perform authoritative financial mutations.

Financial operations must:

1. Validate session
2. Validate account state
3. Validate authorization
4. Validate wallet ownership
5. Validate business rules
6. Validate transaction state
7. Execute atomically
8. Record ledger entries
9. Emit required events
10. Record audit information

## Financial Immutability

Financial ledger records are immutable.

Historical ledger records must not be updated or deleted through ordinary application operations.

Corrections must use compensating financial entries.

## Financial Idempotency

Financial operations must be idempotent.

The same operation submitted repeatedly must not produce duplicate financial effects.

Idempotency keys must be validated and persisted within the appropriate transaction boundary.

## Account Initialization Security

Account initialization is a protected workflow.

The workflow is:

Authentication Account
→ MyLab Identity
→ Profile
→ Initial Role
→ Economy Wallet
→ Preferences
→ Initialization Complete

The workflow must be safe to retry.

Duplicate initialization must be prevented through database constraints and controlled server-side logic.

## Registration Security

Registration must not allow the client to assign privileged roles.

The initial role must be determined by controlled server-side rules.

A newly registered user must not be able to create an administrator, reviewer, moderator, or other privileged role through client input.

## Privileged Operations

Privileged operations require explicit permissions.

Examples include:

- Manage users
- Assign privileged roles
- Approve courses
- Publish knowledge
- Moderate community content
- Perform financial adjustments
- Access protected administrative information

Privileged operations must be auditable.

## Administrator Security

Administrator access must not bypass all application security controls automatically.

Administrative actions must still be authorized, logged, and constrained by domain rules.

High-risk administrative operations should support additional verification where required.

## Knowledge Security

Knowledge content may have different visibility states.

Authorization must distinguish:

- Public knowledge
- Draft knowledge
- Restricted knowledge
- Editorial content

Only authorized users may create, modify, approve, or publish protected knowledge content.

## Learning Security

Learning authorization must enforce:

- Course ownership
- Instructor permissions
- Reviewer permissions
- Enrollment ownership
- Progress ownership
- Assessment access
- Certificate rules

A learner must not modify another learner's progress.

An instructor must not modify courses they do not own or manage.

## AI Security

AI requests must be authorized according to the feature that initiated them.

The AI layer must not become an unrestricted path to protected application data.

AI requests must validate:

- Requesting identity
- Calling domain
- Resource access
- Input permissions
- Allowed context

## AI Data Privacy

Sensitive information must not be sent to an AI provider unless the operation is explicitly authorized and the data handling policy permits it.

The system should minimize personal or sensitive information included in AI context.

Provider requests must use controlled server-side integrations.

Provider credentials must never be exposed to clients.

## AI Output Safety

AI-generated content must not automatically become authoritative medical or educational content.

AI output must pass the appropriate validation and business workflow before being stored as authoritative content.

High-risk outputs may require human review.

## Community Security

Community authorization must enforce:

- Space visibility
- Post ownership
- Comment ownership
- Moderation permissions
- Reporting permissions
- User restrictions

Blocked or restricted users must be prevented from performing prohibited actions server-side.

## Moderation Security

Moderation operations are privileged operations.

Moderators may only perform actions covered by their permissions.

Moderation records must be auditable.

A moderator must not be able to silently remove or alter moderation history.

## Notification Security

Notifications must only be accessible to their intended recipients or explicitly authorized administrators.

A notification must not expose unauthorized resource data.

Notification delivery must not reveal sensitive information through uncontrolled channels.

## Cross-Domain Authorization

Cross-domain operations require explicit authorization.

Examples:

Learning
→ Economy
→ Payment

Knowledge
→ AI
→ Explanation

Learning
→ Notifications
→ Course event

Community
→ Notifications
→ Community event

The calling domain must not bypass the authorization rules of the target domain.

## Domain Service Boundary

Cross-domain operations should use explicit application or domain service contracts.

A service must validate:

- Calling context
- Identity
- Permission
- Resource ownership
- Target-domain rules

## Event Security

Domain events must not contain unnecessary sensitive data.

Events should use stable identifiers and references rather than duplicating sensitive records.

Event consumers must verify authorization before acting on protected resources.

## Webhook Security

External webhooks must be treated as untrusted input.

Webhook processing must validate:

- Signature
- Source
- Event type
- Payload structure
- Idempotency
- Replay protection where required

Invalid webhook requests must be rejected.

## Input Validation

All externally controlled input must be validated.

Validation must occur at appropriate layers:

Client
→ Server
→ Domain
→ Database constraints

Client validation improves usability.

Server validation provides security.

Database constraints protect integrity.

## Output Security

Application output must respect authorization.

The system must not expose:

- Unauthorized records
- Sensitive identifiers
- Authentication secrets
- Provider credentials
- Internal security metadata
- Private financial information

## Injection Protection

Database access must use parameterized queries or safe database abstractions.

Raw SQL must never concatenate untrusted user input.

User-generated content must be safely handled according to its rendering context.

## File Upload Security

File uploads must validate:

- Authorization
- File type
- File size
- Storage location
- File naming
- Access policy

Uploaded files must not automatically become publicly accessible.

Storage policies must enforce ownership and access rules.

## Secrets Management

Secrets must remain outside source control.

Sensitive values include:

- Supabase service-role keys
- Supabase secrets
- Gemini API keys
- Webhook secrets
- Encryption keys
- Other provider credentials

Environment variables or a managed secret store must be used.

Secrets must never be logged.

## Environment Security

Development and production environments must remain separated.

Production credentials must never be placed in development source files.

Production data must not be casually copied into development environments.

## Auditability

Security-sensitive actions should be auditable.

Audit records should capture where required:

- Actor identity
- Operation
- Target resource
- Result
- Timestamp
- Relevant context

Audit data must itself be protected from unauthorized modification.

## Security Events

Important security events may include:

- Login failure
- Successful login
- Logout
- Password reset
- Email verification
- Account suspension
- Account restoration
- Role assignment
- Permission changes
- Privileged operation
- Financial operation
- Moderation action
- Security policy violation

Security events should be generated through controlled application workflows.

## Rate Limiting

Rate limiting should protect:

- Login attempts
- Password recovery
- Registration
- AI requests
- Community posting
- Comments
- Reports
- Financial operations
- Webhooks

Rate limits should be applied according to operation risk and expected usage.

## Abuse Prevention

The platform should detect and limit abusive behavior.

Potential controls include:

- Request throttling
- Account restrictions
- Content moderation
- Suspicious activity detection
- Repeated failure detection
- Temporary lockouts where appropriate

Abuse controls must not become a substitute for authorization.

## Data Minimization

MyLab should collect only data required by approved features.

Sensitive information should have:

- Defined purpose
- Defined owner
- Access restrictions
- Retention policy

Unused sensitive data should not be collected merely for future possibilities.

## Privacy by Design

Privacy must be considered when designing new features.

Before storing sensitive information, determine:

- Why it is required
- Who can access it
- How long it is retained
- Whether it must be shared externally
- Whether it can be minimized or removed

## Error Handling

Security-related errors must avoid leaking sensitive information.

Errors should be:

- Useful to authorized users
- Generic where disclosure could assist attackers
- Logged internally when required
- Free from secrets

## Logging

Logs must not contain:

- Passwords
- Authentication tokens
- Service-role keys
- API keys
- Recovery tokens
- Sensitive financial credentials

Sensitive user information should be minimized in logs.

## Monitoring

Security monitoring should consider:

- Authentication failures
- Authorization failures
- Privileged actions
- Financial anomalies
- AI abuse
- Community abuse
- Repeated webhook failures
- Database security failures

Monitoring should support investigation without unnecessarily exposing private data.

## Incident Response

Security incidents must follow a controlled process:

Detect
→ Contain
→ Investigate
→ Remediate
→ Verify
→ Document

Critical incidents must be documented.

Security architecture should be updated when incidents reveal architectural weaknesses.

## Dependency Security

Dependencies must be kept current according to project policy.

Security-sensitive dependency updates must be reviewed before deployment.

Untrusted packages must not be introduced without evaluation.

## Migration Security

Database migrations must be reviewed for security impact.

Changes to:

- Permissions
- RLS
- Constraints
- Sensitive columns
- Privileged functions

require explicit review.

Destructive security changes must not be introduced casually.

## Security Testing

Security must be tested at multiple levels.

Testing should include:

- Authentication tests
- Authorization tests
- Ownership tests
- RLS tests
- Privileged operation tests
- Financial authorization tests
- Input validation tests
- File access tests
- Webhook validation tests
- Rate-limit tests

Negative tests are required.

A feature is not considered secure merely because the authorized path works.

## Authorization Test Principle

For every protected operation, test at minimum:

1. Authorized user succeeds.
2. Unauthenticated user fails.
3. Authenticated but unauthorized user fails.
4. Authenticated user accessing another user's resource fails.
5. Restricted account fails.
6. Invalid input fails.
7. Repeated operation behaves according to idempotency rules.

## Security Documentation

Important security decisions must be documented.

Security documentation must remain synchronized with:

- Database schema
- RLS policies
- Authentication configuration
- Authorization code
- Domain architecture

## Production Principle

Security and authorization are production capabilities from the beginning.

There is no temporary security model.

There is no client-authoritative authorization.

There is no prototype authentication architecture.

All protected operations must use the final security model.

## Development Sequence

Security implementation should follow:

1. Finalize authentication configuration
2. Finalize authorization model
3. Finalize roles and permissions
4. Finalize RLS strategy
5. Define security-sensitive database constraints
6. Define server-side authorization services
7. Define audit requirements
8. Implement authentication
9. Implement authorization
10. Implement RLS
11. Test negative authorization paths
12. Test protected operations
13. Commit
14. Push

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
