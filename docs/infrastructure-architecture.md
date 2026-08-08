# MyLab Infrastructure Architecture

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Purpose

The Infrastructure architecture defines the technical foundation required to run MyLab reliably in development, staging, and production environments.

Infrastructure supports the application domains but does not own their business rules.

Infrastructure must provide secure, observable, scalable, and maintainable technical services.

## Core Principle

MyLab infrastructure must be designed for the final production architecture from the beginning.

There must be no temporary infrastructure architecture that later requires a fundamental replacement.

Infrastructure decisions must support:

- Security
- Reliability
- Scalability
- Observability
- Maintainability
- Deployment safety
- Data integrity
- Environment separation

## Infrastructure Responsibilities

Infrastructure is responsible for the technical platform required by MyLab.

Its responsibilities include:

- Application runtime
- Frontend hosting and delivery
- Server-side execution
- Database infrastructure
- Authentication infrastructure
- Storage infrastructure
- AI provider connectivity
- Secrets management
- Environment configuration
- Version control
- Database migrations
- Deployment
- Backup and recovery
- Monitoring and observability
- Background processing
- Scheduled processing
- Event infrastructure
- Performance infrastructure
- Infrastructure security
- Dependency management
- Production readiness

Infrastructure does not own:

- Identity business rules
- Knowledge business rules
- Learning business rules
- Economy business rules
- Notification business rules
- Community business rules
- AI domain business rules

Domain ownership remains defined by the domain architecture.

## Application Architecture

MyLab uses a custom-coded application architecture.

The application must separate:

- Presentation
- Application services
- Domain logic
- Infrastructure services
- Data access

The frontend must not become the authoritative owner of business rules.

Sensitive business operations must execute through trusted server-side boundaries.

The application architecture must support:

- Arabic
- English
- Responsive interfaces
- Progressive Web Application capabilities
- Accessible user interfaces
- Secure authenticated sessions
- Domain-based feature organization

## Frontend Infrastructure

The frontend is responsible for presentation and user interaction.

The frontend infrastructure includes:

- Next.js application runtime
- Component-based UI architecture
- shadcn/ui components
- CSS variables
- Design tokens
- Brand layer
- Responsive layouts
- Localization
- Client-side state where appropriate
- Progressive Web Application capabilities

The frontend must not directly perform authoritative financial mutations.

The frontend must not bypass server-side authorization.

The frontend must not expose service-role credentials or other privileged secrets.

## Server-Side Operations

Server-side operations provide trusted execution boundaries for application workflows.

Server-side operations are responsible for:

- Authentication validation
- Authorization
- Domain service invocation
- Financial operations
- Protected database operations
- AI provider calls
- File authorization
- Event generation
- Audit-sensitive operations

Client-provided identity, permissions, ownership, price, balance, or security state must not be treated as authoritative.

## Supabase Platform

Supabase is the primary backend platform for MyLab.

Supabase provides:

- PostgreSQL
- Authentication
- Storage
- Row Level Security
- Server-side platform capabilities
- Database functions where required

Supabase must be used according to the domain and security architecture.

The application must not bypass established security boundaries merely because Supabase provides direct database capabilities.

## PostgreSQL

PostgreSQL is the authoritative relational database for MyLab.

The database must enforce important integrity rules in addition to application-level validation.

Database responsibilities include:

- Persistent domain data
- Referential integrity
- Unique constraints
- Check constraints
- Transactional operations
- Row Level Security
- Indexes
- Audit-related data
- Event and outbox data where required

Database schema changes must be version-controlled through migrations.

## Database Connectivity

Application database access must use the approved Supabase/PostgreSQL connectivity architecture.

Database access must distinguish between:

- Client-safe access
- Server-side privileged access

Privileged database credentials must never be exposed to the browser.

Database access must respect domain ownership and authorization boundaries.

## Supabase Authentication

Supabase Authentication provides the authentication infrastructure for Identity.

Authentication infrastructure must support:

- Registration
- Login
- Logout
- Session management
- Email verification
- Password recovery
- Password reset

Authentication credentials remain managed by the authentication provider.

Application profile and domain data must remain separated from authentication-provider data.

## Session Infrastructure

Authenticated sessions must be validated through trusted authentication infrastructure.

Protected server-side operations must verify the authenticated session.

The application must not trust client-provided user identifiers as proof of identity.

Account state and authorization must be checked before protected operations are executed.

## Row Level Security

Supabase Row Level Security is a core database security boundary.

RLS policies must be designed according to:

- Identity ownership
- Resource ownership
- Domain ownership
- Explicit permissions
- Required server-side operations

RLS must not be treated as a replacement for application authorization.

It is one layer within the overall security architecture.

## Supabase Storage

Supabase Storage provides managed file storage for MyLab.

Storage may be used for:

- Profile images
- Learning materials
- Course assets
- Community attachments
- Other approved application files

Files must be associated with explicit ownership and access rules.

Public access must only be enabled where the architecture explicitly permits it.

## File Ownership

Every protected file must have an identifiable ownership or authorization relationship.

File access must not rely only on obscurity of the file path.

The system must validate whether the requesting user is authorized to read, modify, or delete the file.

## File Upload Security

File uploads must be validated server-side.

Validation should include:

- File type
- File size
- File name handling
- Ownership
- Authorization
- Storage destination
- Malware/security controls where required

Uploaded files must not be trusted solely because the client declares their type.
## AI Infrastructure

MyLab uses Google Gemini as the initial AI provider.

AI infrastructure must isolate the application from provider-specific implementation details.

AI provider access must occur through controlled server-side infrastructure.

The frontend must never communicate with privileged AI provider credentials.

## AI Provider Isolation

The AI infrastructure must provide a provider abstraction between MyLab application services and external AI providers.

The abstraction must allow:

- Provider replacement
- Multiple providers in the future
- Provider-specific configuration
- Request normalization
- Response normalization
- Provider failure handling
- Provider usage tracking

Gemini is the initial implementation and must not become a hard-coded dependency throughout the application.

## Secrets Management

Secrets must be managed through secure environment configuration.

Secrets may include:

- Supabase service credentials
- Gemini API credentials
- Database credentials where required
- External service credentials
- Deployment credentials

Secrets must never be committed to GitHub.

Secrets must never be exposed to browser-side code.

Secrets must not be stored in database records unless explicitly required and appropriately protected.

## Environment Configuration

MyLab must separate configuration from application code.

Configuration must support:

- Development
- Staging
- Production

Environment-specific configuration must not require changes to business logic.

The application must fail safely when required production configuration is missing.

## Environment Isolation

Development, staging, and production environments must remain logically separated.

Production credentials and production data must not be used casually in development environments.

Deployment pipelines must explicitly identify the target environment.

Database migrations must be applied to the intended environment only.

## GitHub

GitHub is the single source of truth for MyLab source code and architecture documentation.

Repository:

git@github.com:MyLabAdmin/MyLab.git

All production code and architecture changes must be version-controlled.

Architecture documentation must remain synchronized with implementation decisions.

## Version Control

All application and infrastructure changes must be committed to Git.

Commits should represent intentional changes.

Important architectural changes must have clear commit messages.

Uncommitted local changes must not be treated as the project source of truth.

## Database Migrations

Database schema changes must be implemented through version-controlled migrations.

Migrations must be:

- Ordered
- Reproducible
- Reviewable
- Environment-aware
- Safe to execute

Direct undocumented production schema modifications are prohibited.

Database migrations must preserve existing production data unless an explicitly approved destructive migration is required.

## Deployment Architecture

Deployment must use a controlled production pipeline.

The deployment process must include:

- Source retrieval
- Dependency installation
- Build
- Validation
- Deployment
- Post-deployment verification

Production deployment must not depend on manual undocumented changes.

## Build Verification

Every production deployment must pass the required build and validation checks.

At minimum, the application must:

- Install dependencies successfully
- Compile successfully
- Pass required linting
- Pass required automated tests where configured
- Produce the expected production artifact

A failed build must prevent production deployment.

## Continuous Integration

Continuous Integration must validate changes before they are merged or deployed.

CI should validate:

- Formatting
- Linting
- Type safety
- Unit tests
- Integration tests where required
- Production build
- Database migration validity where applicable

CI configuration must be version-controlled.

## Continuous Deployment

Continuous Deployment may be used once the production deployment pipeline is established and verified.

Deployments must:

- Use approved source revisions
- Target the correct environment
- Apply required migrations
- Verify application health
- Preserve deployment traceability

## Deployment Rollback

The infrastructure must provide a controlled rollback strategy.

Rollback procedures must account for:

- Application version
- Database migrations
- Configuration changes
- Storage compatibility
- Event compatibility

Database rollback must not be assumed to be safe automatically.

Forward-compatible migration strategies should be preferred where possible.

## Backup and Recovery

Production data must be protected through reliable backups.

Backup architecture must cover:

- PostgreSQL data
- Required storage data
- Critical configuration where appropriate

Backups must be monitored and periodically tested.

A backup that has never been restored successfully must not be considered a verified recovery mechanism.

## Disaster Recovery

MyLab must define disaster recovery procedures for production failures.

The architecture must define, where appropriate:

- Recovery Point Objective
- Recovery Time Objective
- Recovery procedures
- Responsible operators
- Communication procedures
- Verification steps

Disaster recovery documentation must remain current.

## Availability

Infrastructure must be designed to avoid unnecessary single points of failure.

Availability requirements must be appropriate to the current production scale while allowing future growth.

Critical dependencies must have documented failure behavior.

## Scalability

Infrastructure must support horizontal and vertical scaling where appropriate.

Scaling decisions must be driven by:

- Traffic
- Database load
- Storage usage
- AI usage
- Background workload
- Resource utilization

Scaling must not require redesigning domain ownership.

## Background Processing

Long-running or asynchronous work must not block interactive application requests unnecessarily.

Background processing may be used for:

- Notification delivery
- AI-related asynchronous work
- File processing
- Event processing
- Maintenance operations
- Analytics processing where required

Background jobs must be idempotent where retries are possible.
## Scheduled Processing

Scheduled processing may be used for controlled recurring operations.

Examples include:

- Maintenance tasks
- Reconciliation
- Notification scheduling
- Data cleanup
- Monitoring tasks
- Periodic synchronization

Scheduled jobs must be:

- Idempotent
- Observable
- Auditable where required
- Protected against duplicate execution

## Event Infrastructure

MyLab uses explicit application events for cross-domain asynchronous communication where appropriate.

Events may be generated by:

- Identity
- Economy
- Knowledge
- Learning
- Notifications
- Community
- AI

Events must use explicit contracts.

An event must not expose unnecessary sensitive information.

## Outbox Principle

Important domain events that must not be lost should use an outbox pattern or an equivalent reliable delivery mechanism.

The outbox pattern provides:

Domain Transaction
→ Persist Business Change
→ Persist Event
→ Commit Atomically
→ Process Event
→ Deliver to Consumer

Event publication must not depend on an unreliable in-memory operation after the database transaction has completed.

## Event Idempotency

Event consumers must tolerate duplicate delivery.

Each processable event should have a stable identifier.

Consumers must prevent duplicate side effects when the same event is delivered more than once.

## Notification Infrastructure

The Notifications domain uses infrastructure services for delivery.

Supported channels may include:

- In-app
- Push
- Email

Delivery infrastructure must remain separate from notification business rules.

Notification delivery must support:

- Retry
- Delivery state
- Failure handling
- Provider abstraction
- Observability
- Idempotency

## Observability

Production infrastructure must provide sufficient observability to understand system health and failures.

Observability includes:

- Logs
- Metrics
- Health checks
- Error tracking
- Operational events
- Performance measurements

Observability data must not expose secrets or unnecessary sensitive information.

## Logging

Application and infrastructure logs must be structured where practical.

Logs should contain sufficient context to diagnose failures.

Logs must not contain:

- Passwords
- Authentication credentials
- API keys
- Access tokens
- Unnecessary personal information
- Sensitive financial information

Security-sensitive events must be logged according to the security architecture.

## Metrics

Infrastructure metrics should monitor:

- Application availability
- Request latency
- Error rates
- Database performance
- Storage usage
- AI usage
- Background job health
- Notification delivery
- Resource utilization

Metrics should support detection of abnormal behavior and capacity problems.

## Health Checks

Production services must expose appropriate health information.

Health checks should distinguish between:

- Application availability
- Dependency availability
- Database availability
- Critical service availability

Health endpoints must not expose secrets or internal security information.

## Error Tracking

Production errors must be captured through an appropriate error-tracking mechanism.

Error tracking must provide enough context to diagnose failures without exposing sensitive data.

Errors should include:

- Operation context
- Environment
- Application version
- Relevant request correlation information
- Stack information where appropriate

## Rate Limiting

Rate limiting must protect infrastructure and application services from excessive requests.

Rate limits may apply to:

- Authentication
- AI requests
- File uploads
- Community operations
- Financial operations
- Public APIs
- Expensive database operations

Rate limits must not replace authorization.

## Abuse Protection

Infrastructure must support protection against abusive behavior.

Protection mechanisms may include:

- Rate limiting
- Request validation
- Authentication requirements
- Suspicious activity detection
- Temporary restrictions
- Operational monitoring

Abuse controls must respect the domain authorization architecture.

## Performance

Infrastructure performance must be monitored and optimized based on evidence.

Performance work should prioritize:

- Database efficiency
- Network efficiency
- Server response time
- Frontend performance
- AI latency
- Background processing
- Storage access

Premature infrastructure complexity should be avoided.

## Caching

Caching may be used for data that is safe to cache and does not require authoritative real-time state.

Caching must not become the authoritative source for:

- Financial balances
- Authorization decisions
- Account state
- Security-sensitive information

Cache invalidation must be explicitly designed.

## Security Boundary

Infrastructure is a security boundary of the MyLab system.

Infrastructure security must include:

- Secure credentials
- Access control
- Environment isolation
- Network security where applicable
- Database security
- Storage security
- Deployment security
- Dependency security
- Monitoring

Security controls must be layered rather than relying on one mechanism.

## Service Role

Supabase service-role credentials provide privileged server-side access.

Service-role credentials must:

- Never reach browser code
- Never be committed to GitHub
- Be stored securely
- Be used only in trusted server-side contexts
- Be restricted to operations that require elevated privileges

Service-role access bypasses normal RLS protections and therefore requires explicit authorization at the application/service boundary.

## External Services

External services must be integrated through controlled infrastructure boundaries.

Potential services include:

- Google Gemini
- Email providers
- Push notification providers
- Analytics providers
- Error tracking providers
- Other approved platform services

External integrations must isolate provider-specific implementation details from business domains.

## Dependency Management

Dependencies must be intentionally selected and maintained.

Dependency management must include:

- Version control
- Security review
- Compatibility checks
- Update strategy
- Removal of unused dependencies

Critical vulnerabilities must be assessed and addressed according to their risk.

## Infrastructure Documentation

Infrastructure architecture must be documented in the repository.

Documentation should cover:

- Environment structure
- Deployment
- Database
- Storage
- Authentication
- AI infrastructure
- Event infrastructure
- Observability
- Backup and recovery
- Security boundaries

Documentation changes must be committed alongside relevant architectural changes.

## Testing Strategy

Infrastructure must be tested at the appropriate levels.

Testing may include:

- Unit tests
- Integration tests
- Database tests
- Authentication tests
- Authorization tests
- Migration tests
- Storage tests
- Event processing tests
- Deployment verification
- Recovery testing

Production-critical infrastructure must not depend solely on manual testing.

## Production Readiness

Before a production capability is considered complete, the infrastructure must provide:

- Secure configuration
- Authentication integration
- Authorization enforcement
- Database integrity
- Backup capability
- Observability
- Failure handling
- Deployment verification
- Recovery procedures
- Documentation

A feature is not production-ready merely because its UI works.

## Infrastructure Ownership

Infrastructure responsibilities must have clear technical ownership.

Application domains own their business rules.

Infrastructure owns:

- Runtime
- Platform configuration
- Deployment
- Database infrastructure
- Storage infrastructure
- Authentication infrastructure
- AI provider infrastructure
- Event infrastructure
- Observability
- Recovery

Cross-domain infrastructure concerns must use explicit contracts.

## Domain Boundary Principle

Infrastructure must support domains without becoming the owner of their business rules.

For example:

Infrastructure provides database and transaction capabilities.

Economy owns:

- Wallet rules
- Financial rules
- Ledger rules
- Payment rules

Infrastructure must not implement Economy business logic.

The same principle applies to Identity, Knowledge, Learning, Notifications, Community, and AI.

## Change Management

Infrastructure changes must be intentional and traceable.

Changes should include:

- Reason for change
- Affected systems
- Risk assessment where appropriate
- Migration requirements
- Verification procedure
- Rollback or recovery strategy where applicable

Architectural changes must update the relevant documentation.

## Cost Management

Infrastructure costs must be monitored as MyLab grows.

Cost management should consider:

- Database usage
- Storage usage
- AI provider usage
- Network usage
- Background processing
- Notification delivery
- Monitoring services

Cost optimization must not compromise required security, reliability, or data integrity.

## Production Principle

MyLab infrastructure is part of the production architecture from the beginning.

There is:

- No temporary deployment architecture
- No prototype infrastructure
- No client-side privileged infrastructure
- No undocumented production configuration
- No direct uncontrolled production database modification

Infrastructure must evolve through controlled, versioned, documented changes.

## Development Sequence

Infrastructure implementation should follow the architecture-first sequence:

1. Confirm infrastructure architecture.
2. Confirm environment strategy.
3. Confirm database and migration strategy.
4. Confirm authentication infrastructure.
5. Confirm storage infrastructure.
6. Confirm AI provider infrastructure.
7. Confirm event infrastructure.
8. Confirm deployment pipeline.
9. Confirm observability.
10. Confirm backup and recovery.
11. Implement application infrastructure services.
12. Verify production readiness.

Each stage must be verified before dependent implementation proceeds.

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
