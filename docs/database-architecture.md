# MyLab Database Architecture

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Purpose

The MyLab database is the authoritative persistence layer for application data.

The database architecture must implement the approved system and domain architecture without introducing temporary or prototype structures.

The database must prioritize:

- Data ownership
- Referential integrity
- Security
- Explicit domain boundaries
- Auditability
- Performance
- Extensibility
- Maintainability
- Safe migrations

## Core Principle

The database is part of the production architecture from the beginning.

Application code must not define an alternative source of truth outside the database.

Business-critical state must be persisted using explicit domain-owned structures.

The database must enforce important invariants wherever practical.

## Database Platform

The initial database platform is:

- Supabase PostgreSQL

Supabase provides the PostgreSQL database and the surrounding platform capabilities required by MyLab.

The PostgreSQL database remains the authoritative relational data store.

## Domain Ownership

Each domain owns its authoritative data.

The initial ownership model is:

Identity
→ identities
→ profiles
→ roles
→ permissions
→ account state

Economy
→ wallets
→ financial accounts
→ transactions
→ ledger entries

Knowledge
→ tests
→ analytes
→ knowledge content
→ categories
→ references

Learning
→ courses
→ lessons
→ materials
→ enrollments
→ progress
→ assessments
→ certificates

Notifications
→ notifications
→ preferences
→ deliveries
→ notification events

Community
→ spaces
→ posts
→ comments
→ interactions
→ reports
→ moderation records
→ restrictions

AI
→ AI requests
→ AI usage records
→ provider execution metadata
→ AI safety and validation records where required

## Identity Database Model

Identity must distinguish authentication-provider data from application identity data.

Authentication credentials are managed by Supabase Auth.

Application identity data belongs to MyLab database tables.

The conceptual structure is:

Supabase Auth User
→ MyLab Identity
→ Profile
→ Roles
→ Permissions

## Identity Table

The identity table represents the application's authenticated user.

It should contain an immutable reference to the authentication provider user identifier.

The authentication provider identifier must be unique.

Identity records must not contain authentication passwords or recovery credentials.

## Profile Table

The profile table contains application-level user information.

Possible fields include:

- Identity identifier
- Display name
- Preferred language
- Profile image reference
- Professional information
- Educational information
- Created timestamp
- Updated timestamp

Sensitive information must only be stored when required by an approved feature.

## Roles and Permissions

Roles and permissions must be modeled explicitly.

The conceptual relationship is:

Identity
→ Identity Roles
→ Roles
→ Role Permissions
→ Permissions

A many-to-many model must be used where a user may have multiple roles.

Permissions must represent explicit capabilities rather than UI labels.

## Account State

Account state must be stored explicitly.

Possible states include:

- Pending
- Active
- Suspended
- Disabled

Protected operations must be able to evaluate account state.

Account state changes should be auditable where required.

## Economy Database Model

Economy owns all authoritative financial state.

The conceptual structure is:

Identity
→ Wallet
→ Financial Account
→ Transactions
→ Ledger Entries

The wallet is associated with one primary MyLab identity.

## Wallet Table

Each user has one primary wallet.

The wallet table must contain:

- Wallet identifier
- Owner identity reference
- Wallet state
- Currency
- Created timestamp
- Updated timestamp

The owner identity reference must be unique for a primary wallet.

Wallet identifiers must remain stable.

## Financial Account Model

The architecture should support a financial account representation compatible with double-entry accounting.

A wallet may correspond to one or more financial accounts depending on the final ledger implementation.

Financial accounts must belong to Economy.

The application must not infer accounting state solely from a wallet display balance.

## Transaction Table

A transaction represents a financial operation.

Possible transaction types include:

- Course purchase
- Course refund
- Wallet credit
- Wallet debit
- Transfer
- Adjustment

Each transaction must have:

- Unique transaction identifier
- Transaction type
- Status
- Currency
- Amount representation
- Idempotency key where applicable
- Related resource reference where applicable
- Initiating identity where applicable
- Created timestamp
- Completed timestamp where applicable

Transaction state must be controlled server-side.

## Ledger Entry Table

Ledger entries represent authoritative financial movements.

Ledger entries must be immutable after creation.

Corrections must use compensating entries rather than modifying historical records.

Ledger entries should contain:

- Entry identifier
- Transaction reference
- Financial account reference
- Debit or credit direction
- Amount in exact minor units
- Currency
- Created timestamp
- Reference metadata where required

## Financial Constraints

The database must enforce, where practical:

- Unique transaction identifiers
- Unique wallet ownership
- Unique idempotency keys within the applicable scope
- Valid positive financial amounts
- Supported currency values
- Valid transaction states
- Valid ledger directions
- Referential integrity

Floating-point values must not be used for authoritative monetary amounts.

## Knowledge Database Model

Knowledge owns structured laboratory knowledge.

The conceptual structure is:

Knowledge
→ Categories
→ Laboratory Tests
→ Analytes
→ Knowledge Content
→ References

## Laboratory Test Table

A laboratory test represents a structured laboratory examination.

Possible fields include:

- Test identifier
- Test code
- Name
- Description
- Category
- Status
- Created timestamp
- Updated timestamp

Test codes must be uniquely constrained according to the approved coding model.

## Analyte Table

An analyte represents a measurable laboratory substance or parameter.

Possible fields include:

- Analyte identifier
- Name
- Code
- Description
- Unit information where applicable
- Status
- Created timestamp
- Updated timestamp

An analyte may be associated with multiple laboratory tests.

## Test-Analyte Relationship

The relationship between tests and analytes may be many-to-many.

A dedicated relationship table should represent the association.

The relationship may include additional information such as:

- Expected unit
- Specimen context
- Reporting role
- Ordering information

The exact fields will be finalized during schema implementation.

## Knowledge Content

Knowledge content must be versionable where authoritative information changes over time.

Content may include:

- Educational explanation
- Laboratory methodology
- Clinical relevance
- Interpretation guidance
- Technical notes

The database should preserve sufficient history for important published content.

## Knowledge References

Authoritative or supporting references must be represented explicitly.

References may include:

- Publication
- Guideline
- Official source
- Textbook
- Other approved reference

References must be linked to the relevant knowledge content where applicable.

## Learning Database Model

Learning owns the educational platform.

The conceptual structure is:

Instructor
→ Course
→ Course Version
→ Lessons
→ Materials

User
→ Enrollment
→ Progress
→ Assessment
→ Completion
→ Certificate

## Course Table

A course must contain:

- Course identifier
- Owner identity
- Title
- Description
- Status
- Visibility
- Pricing information where applicable
- Current published version reference where applicable
- Created timestamp
- Updated timestamp

Course ownership must be explicit.

## Course Lifecycle State

Course state must support the approved lifecycle:

Draft
→ Submitted
→ Under Review
→ Approved
→ Published
→ Archived

State transitions must be controlled server-side.

## Course Versioning

Published educational content should be versionable.

A course version may contain:

- Version identifier
- Course reference
- Version number
- Content state
- Publication timestamp
- Created timestamp

Published versions must remain stable for enrolled learners where required.

## Lesson Table

Lessons belong to a course version.

Possible fields include:

- Lesson identifier
- Course version reference
- Title
- Description
- Ordering
- Status
- Created timestamp
- Updated timestamp

Lesson ordering must be deterministic.

## Learning Materials

Learning materials may include:

- Text
- Documents
- Images
- Videos
- External references
- Other approved educational resources

Storage objects should use Supabase Storage where appropriate.

Database records should reference storage objects rather than embedding large binary files directly in PostgreSQL.

## Enrollment

Enrollment connects an identity to a course.

Possible fields include:

- Enrollment identifier
- Course reference
- Identity reference
- Enrollment state
- Purchase transaction reference where applicable
- Created timestamp
- Completed timestamp where applicable

An identity should not have duplicate active enrollment for the same course unless explicitly supported.

## Learning Progress

Progress belongs to an enrollment.

Possible fields include:

- Progress identifier
- Enrollment reference
- Lesson reference
- Completion state
- Completion timestamp
- Last activity timestamp

Progress must not bypass enrollment authorization.

## Assessments

Assessments belong to Learning.

Possible structures may include:

- Assessment
- Questions
- Answers
- Attempts
- Results

Assessment data must be protected from unauthorized modification.

## Certificates

Certificates may reference:

- Identity
- Course
- Enrollment
- Completion state
- Issued timestamp
- Certificate identifier

Certificate issuance must be controlled by server-side rules.

## Notifications Database Model

Notifications owns notification persistence.

The conceptual structure is:

Event
→ Notification
→ Delivery
→ Read State

## Notification Table

A notification should contain:

- Notification identifier
- Recipient identity
- Category
- Type
- Title or localization key
- Body or localization data
- Priority
- Read state
- Related resource reference where applicable
- Created timestamp

Notifications must not expose resources the recipient is not authorized to access.

## Notification Preferences

Notification preferences belong to the Notifications domain.

Preferences may include:

- Notification category
- Channel
- Enabled state
- Identity reference
- Updated timestamp

Preferences must support future notification channels without redesigning the entire model.

## Notification Delivery

Delivery records may track:

- Notification reference
- Channel
- Delivery state
- Attempt count
- Last attempt timestamp
- Delivered timestamp
- Failure information where appropriate

Delivery state must be independent from notification creation.

## Community Database Model

Community owns community interaction data.

The conceptual structure is:

Space
→ Posts
→ Comments
→ Interactions
→ Reports
→ Moderation

## Community Space

A space should contain:

- Space identifier
- Name
- Description
- Visibility
- State
- Owner or managing authority
- Created timestamp
- Updated timestamp

Visibility must be enforced server-side.

## Post Table

A post should contain:

- Post identifier
- Space reference
- Author identity
- Content
- Publication state
- Moderation state
- Visibility state
- Created timestamp
- Updated timestamp

Post ownership must be explicit.

## Comment Table

A comment should contain:

- Comment identifier
- Post reference
- Author identity
- Content
- State
- Moderation state
- Created timestamp
- Updated timestamp

Comments must remain connected to their parent post through referential integrity.

## Community Interactions

Interactions such as reactions or bookmarks should use explicit relationship tables.

Uniqueness constraints should prevent duplicate interactions where the business rule requires one interaction per user/resource pair.

## Reports

Reports should contain:

- Report identifier
- Reporter identity
- Target resource
- Report reason
- Description where applicable
- State
- Created timestamp
- Resolved timestamp where applicable

Reports must be protected against unauthorized modification.

## Moderation Records

Moderation records should preserve important moderation actions.

Possible fields include:

- Moderation identifier
- Moderator identity
- Target resource
- Action
- Reason
- Created timestamp
- Related report where applicable

Moderation history should be append-oriented and auditable.

## Community Restrictions

Restrictions should contain:

- Restriction identifier
- Identity reference
- Restriction type
- State
- Start timestamp
- End timestamp where applicable
- Reason
- Created by

Restrictions must be enforced server-side.

## AI Database Model

AI owns AI operational records.

The database must not store provider credentials.

The conceptual structure is:

AI Request
→ Context
→ Provider Execution
→ Validation
→ Usage Record

## AI Request Table

An AI request may contain:

- Request identifier
- Requesting identity where applicable
- Calling domain
- Feature type
- Request state
- Created timestamp
- Completed timestamp
- Failure state where applicable

The request must be associated with the domain feature that initiated it when required for auditability.

## AI Usage

AI usage records may track:

- Identity
- Request
- Provider
- Model
- Input usage metrics where available
- Output usage metrics where available
- Estimated or authoritative cost metadata where applicable
- Created timestamp

Sensitive prompt content must not be retained unnecessarily.

## Provider Abstraction

Provider-specific execution data must remain separated from domain business data.

Gemini is the initial provider.

The database model must allow additional providers without changing the core domain tables.

## Cross-Domain References

Cross-domain references must be explicit.

Examples:

Learning Enrollment
→ Economy Transaction

Knowledge Content
→ AI Request

Community Post
→ Knowledge Resource

Community Post
→ AI Request

Notification
→ Related Resource

Cross-domain references must not create uncontrolled coupling.

## Referential Integrity

Foreign keys should be used for authoritative relational relationships.

Deletion behavior must be explicitly defined.

Financial records must never be cascade-deleted as a side effect of deleting an unrelated application record.

Important historical records should generally use controlled retention or logical state rather than destructive cascading deletion.

## UUID Strategy

MyLab should use UUID identifiers for primary entities where appropriate.

Identifiers must be generated using secure, database-compatible mechanisms.

Public identifiers must not expose sequential business-sensitive numbering.

## Timestamps

Authoritative records should include creation timestamps.

Mutable records should include update timestamps where appropriate.

Timestamp handling must use a consistent timezone strategy.

The database should store authoritative timestamps in UTC.

## Audit Fields

Important mutable records should support audit information where required.

Common fields may include:

- Created by
- Updated by
- Created at
- Updated at

Audit requirements must be determined per domain.

## Soft Deletion

Soft deletion must not be used automatically for every table.

It should be used where business history, moderation, recovery, or auditability requires retained records.

Financial and audit records must not be destructively deleted through ordinary application operations.

## Row Level Security

Supabase Row Level Security is a core security mechanism.

RLS must be enabled for protected application tables.

Policies must be designed according to domain ownership and authorization rules.

RLS must not be treated as a replacement for server-side business logic.

## RLS Principles

RLS policies should enforce:

- User ownership
- Resource access
- Public versus private visibility
- Role-based access where applicable
- Account restrictions
- Domain boundaries

Sensitive operations may require server-side execution in addition to RLS.

## Client Access

Client applications must only receive data they are authorized to access.

The database must not rely on hidden UI elements as an access-control mechanism.

Sensitive mutations must use controlled server-side operations.

## Service Role

Supabase service-role credentials must never be exposed to the browser.

Service-role access is server-side only.

Service-role operations must remain limited and auditable.

## Database Functions

Database functions may be used when they provide a clear integrity or atomicity benefit.

They must not become a substitute for a maintainable application architecture.

Financial atomicity or security-critical database invariants may justify controlled database functions.

## Transactions

Database transactions must be used for operations requiring atomic state changes.

Examples include:

- Account initialization
- Financial operations
- Enrollment after successful payment
- Moderation operations with related records
- Other multi-table state transitions

## Idempotency

Idempotent operations must use explicit idempotency mechanisms.

Examples include:

- Account initialization
- Financial operations
- Payment processing
- Event processing
- Notification delivery

Database constraints should support idempotency wherever practical.

## Indexing Strategy

Indexes must be created according to real access patterns.

Expected indexed fields may include:

- Identity references
- Foreign keys
- Status fields used in filtering
- Created timestamps for feeds
- Transaction identifiers
- Wallet identifiers
- Course identifiers
- Enrollment lookups
- Notification recipient and read state
- Community post and comment relationships

Indexes must be reviewed as query patterns evolve.

## Uniqueness Constraints

Database uniqueness constraints should enforce business invariants where practical.

Examples include:

- Authentication user reference
- Wallet owner for primary wallet
- Wallet identifier
- Transaction identifier
- Idempotency key within defined scope
- Course version number within a course
- Enrollment identity/course pair where applicable
- Unique community interaction
- Notification preference identity/category/channel where applicable

## Check Constraints

Check constraints should enforce simple database-level invariants.

Examples include:

- Positive monetary amounts
- Valid state values
- Valid enum-like values
- Valid ledger direction
- Valid ordering values
- Valid timestamps where applicable

Complex business workflows remain application responsibilities.

## Data Retention

Data retention must be defined by domain.

Financial and audit records require stronger retention guarantees.

Community content may follow moderation and deletion policies.

AI records should minimize unnecessary retention of sensitive content.

Notification history may follow defined retention policies.

## Privacy

The database must minimize sensitive data collection.

Sensitive fields must be protected by:

- Appropriate RLS
- Server-side access control
- Restricted queries
- Explicit ownership rules
- Retention policies

Secrets and authentication credentials must never be stored in ordinary application tables.

## Storage

Supabase Storage should be used for large binary objects.

Database tables should store references and metadata rather than large binary payloads.

Storage access must follow the same authorization principles as database records.

## Event Data

Cross-domain events should be represented through an explicit event architecture.

Where durable event processing is required, the database may contain an event or outbox structure.

Events must support:

- Stable identifier
- Event type
- Aggregate reference
- Payload
- Created timestamp
- Processing state where required

## Outbox Principle

Important domain events that must not be lost should use a transactional outbox pattern where appropriate.

The business transaction and event creation should occur atomically.

Example:

Course Purchase
→ Financial Transaction
→ Ledger Entries
→ Outbox Event

All occur within the same database transaction.

A separate worker or processing mechanism can then deliver the event to consumers.

## Migration Strategy

All schema changes must be version-controlled.

Database migrations must be stored in the repository.

The migration history must be reproducible.

Manual production schema changes are prohibited except for controlled emergency procedures that are subsequently documented and represented in migrations.

## Schema Change Rules

Schema changes must follow:

1. Design
2. Review
3. Migration creation
4. Local or controlled testing
5. Verification
6. Commit
7. Push
8. Deployment

Destructive schema changes require explicit impact analysis.

## Naming Conventions

Database naming must be consistent.

The project should use:

- Lowercase snake_case
- Singular or plural table naming according to one approved convention
- Explicit foreign key names
- Descriptive constraint names
- Descriptive index names

The final naming convention must be applied consistently across the schema.

## Environment Separation

Database environments must remain separated.

At minimum:

- Development
- Production

Production data must not be casually copied into development environments.

Secrets and environment-specific credentials must remain outside the repository.

## Backup and Recovery

Production database recovery must be supported by the Supabase platform configuration and operational procedures.

Backup strategy must consider:

- Financial data
- Identity data
- Learning data
- Community data
- Knowledge data

Recovery procedures must be tested rather than assumed.

## Observability

Database observability should monitor:

- Query performance
- Slow queries
- Failed transactions
- Connection usage
- Storage growth
- Index effectiveness
- RLS-related failures
- Migration failures

Sensitive application data must not be unnecessarily exposed through logs.

## Performance Principle

Database performance must be designed around actual access patterns.

The architecture must avoid:

- Unbounded queries
- N+1 access patterns
- Missing relationship indexes
- Unnecessary duplication
- Excessive cross-domain joins

Caching may be introduced where justified by measured requirements.

## Security Principle

Database security must follow defense in depth.

The layers are:

Client
→ Application/Server
→ Authorization
→ RLS
→ PostgreSQL

No single layer should be treated as the only security mechanism for sensitive operations.

## Domain Boundary Principle

A domain must not directly modify another domain's authoritative data.

Cross-domain operations must use explicit application contracts, database events, or controlled server-side workflows.

The database schema must make ownership understandable.

## Production Principle

The database architecture defined here is intended for production.

There is no temporary database schema.

There is no prototype-only table structure.

There is no client-authoritative business state.

All future schema implementation must remain consistent with the approved domain architecture.

## Development Sequence

Database implementation should follow:

1. Finalize entity model
2. Finalize relationships
3. Finalize constraints
4. Finalize RLS strategy
5. Finalize indexes
6. Finalize migration strategy
7. Create initial migration
8. Apply to development environment
9. Verify schema
10. Verify RLS
11. Verify critical transactions
12. Commit migration
13. Push to GitHub
14. Configure production deployment

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
