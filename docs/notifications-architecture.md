# MyLab Notifications Architecture

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Purpose

The Notifications domain provides the centralized notification platform for MyLab.

It manages notification generation, notification preferences, delivery state, read state, priority, scheduling, notification history, and supported delivery channels.

Notifications is a production core domain from the beginning.

## Core Principle

Notifications are generated from explicit application events.

Notification delivery must not be scattered across UI components or unrelated domains.

The Notifications domain owns notification records and delivery orchestration.

Other domains may emit events, but they must not directly implement notification delivery.

## Notification Flow

The general notification flow is:

Domain Event
→ Notification Event Processing
→ Notification Rule
→ Notification Record
→ Delivery Decision
→ Delivery Channel
→ Delivery Result

The notification system must support multiple consumers and delivery channels without coupling business domains to specific notification providers.

## Notification

A notification represents a user-facing or system-generated communication.

A notification may contain:

- Notification identifier
- Recipient
- Category
- Type
- Title
- Message
- Priority
- Read state
- Creation timestamp
- Expiration where required
- Related resource
- Related event
- Delivery information

Notifications must have stable identifiers.

## Notification Categories

Notifications should be categorized to support user preferences and filtering.

Possible categories include:

- Identity
- Security
- Learning
- Economy
- Knowledge
- AI
- Community
- System

Additional categories may be introduced when required.

Categories must be represented through controlled application values rather than arbitrary client-provided strings.

## Notification Types

Notification types represent specific notification meanings.

Examples:

- AccountRegistered
- EmailVerified
- PasswordChanged
- CourseApproved
- CourseRejected
- CoursePublished
- EnrollmentCreated
- CourseCompleted
- PaymentCompleted
- PaymentFailed
- RefundCompleted
- CommunityMention
- SystemAnnouncement

Notification types must remain associated with defined application events or notification rules.

## Notification Preferences

Users must be able to control supported notification preferences.

Preferences may include:

- Category enabled/disabled
- Channel enabled/disabled
- Security notifications
- Learning notifications
- Economy notifications
- Community notifications
- Promotional notifications where introduced

Critical security or account notifications may not be disableable where required by platform policy.

Preferences must be enforced server-side.

## In-App Notifications

In-app notifications are stored in the Notifications domain.

The system must support:

- Notification list
- Read/unread state
- Read timestamp where required
- Notification detail
- Related resource navigation
- Filtering
- Pagination
- Notification history

The client must not directly create authoritative notification records.

## Read State

Read state belongs to the notification record or an explicitly defined recipient-notification model.

A user may mark a notification as read only when authorized to access that notification.

The system should support:

- Unread
- Read

Read state changes must be server-controlled.

## Delivery Channels

The notification architecture should support multiple channels.

Initial channels may include:

- In-app
- Push
- Email

Future channels may be introduced without changing the event-producing domains.

Each channel should have its own delivery adapter or service boundary.

## Channel Abstraction

Business domains must not depend directly on:

- Email providers
- Push providers
- Browser notification APIs
- Third-party messaging services

The Notifications domain should expose a channel-independent application interface.

The architecture is conceptually:

Notification
→ Channel Selection
→ Channel Adapter
→ Provider
→ Delivery Result

Providers may be replaced without restructuring the business domains.

## Push Notifications

Push notifications may be used for supported devices and browsers.

The architecture must support:

- Device registration
- Device ownership
- Device token management
- Device revocation
- Delivery attempts
- Delivery failure handling

Push credentials and provider-specific information must be protected.

Invalid or expired device registrations must be handled without corrupting notification records.

## Email Notifications

Email notifications may be used for selected notification types.

Email delivery must use a provider abstraction.

The Notifications domain must not expose provider-specific implementation details to Identity, Learning, Economy, or other domains.

Email delivery should support:

- Template selection
- Localization
- Delivery status
- Failure handling
- Retry policy where appropriate

## Notification Templates

Notification presentation should be separated from event generation.

Templates may define:

- Title
- Message
- Channel-specific content
- Localization
- Required variables

Templates must not contain sensitive information that the recipient is not authorized to access.

## Localization

MyLab supports Arabic and English.

Notifications must support localized content.

The recipient's preferred language should determine the notification language where applicable.

Localization must not alter the underlying notification event semantics.

## Priority

Notifications may have explicit priorities.

Possible values include:

- Low
- Normal
- High
- Critical

Priority may influence:

- Delivery channel
- Delivery timing
- Retry behavior
- User presentation

Security-critical notifications may require elevated priority according to defined rules.

## Scheduling

The notification system should support scheduled delivery where required.

Scheduled notifications must include:

- Scheduled time
- Time zone handling
- Delivery state
- Cancellation state where supported

Scheduling must be server-controlled.

The client must not be trusted as the authority for scheduled delivery.

## Delivery State

Each channel delivery should have an explicit state.

Possible states include:

- Pending
- Processing
- Sent
- Delivered where provider information exists
- Failed
- Cancelled

Delivery state must be distinct from notification read state.

A notification can be read even if a specific external delivery channel failed.

## Retry Policy

Transient delivery failures may be retried.

Retry behavior must be controlled and bounded.

The system should distinguish between:

- Temporary failures
- Permanent failures
- Invalid recipient/device information
- Provider failures

Retries must be idempotent and must not create duplicate authoritative notification records.

## Event-Driven Architecture

Domains should emit explicit application events.

Examples:

Identity
→ AccountRegistered
→ Notifications

Identity
→ EmailVerified
→ Notifications

Economy
→ PaymentCompleted
→ Notifications

Economy
→ RefundCompleted
→ Notifications

Learning
→ CourseApproved
→ Notifications

Learning
→ EnrollmentCreated
→ Notifications

Community
→ CommunityMention
→ Notifications

Notifications consumes these events and applies the appropriate notification rules.

## Event Idempotency

Event processing must be idempotent.

If the same event is delivered more than once, the notification system must not create duplicate notifications unless duplication is explicitly required by the notification rule.

Events should have stable identifiers that can be used for deduplication.

## Notification Rules

Notification rules determine whether an application event results in a notification.

A rule may consider:

- Event type
- Recipient
- User preferences
- Notification category
- Priority
- Delivery channels
- Account state
- Resource authorization
- Scheduling requirements

Rules belong to the Notifications domain.

## Recipient Resolution

The Notifications domain must determine the valid recipient for each notification.

Recipient resolution must not rely on arbitrary client-provided user identifiers.

The system should use trusted event information and server-side authorization.

## Resource References

Notifications may reference application resources.

Examples:

- Course
- Lesson
- Payment
- Community post
- Account security event

Resource references must be authorized when the notification is opened.

A notification must not grant access to a resource that the user otherwise cannot access.

## Notification History

The system should retain notification history according to platform retention requirements.

History may support:

- User review
- Delivery troubleshooting
- Audit requirements
- Operational analysis

Retention policies must be defined before implementing large-scale notification storage.

## Security Principles

Notifications must follow these principles:

- Notification creation is server-controlled.
- Notification delivery is server-controlled.
- Recipient identity is server-trusted.
- Notification access requires authorization.
- Resource references are authorization-checked.
- Provider credentials are never exposed to clients.
- Sensitive data is minimized.
- Notification events must not expose unnecessary personal information.
- Critical notifications must follow defined security policies.
- Delivery processing must be auditable where required.

## Privacy Principle

Notifications may contain sensitive contextual information.

The system must minimize stored and transmitted personal information.

Notification content should contain only information necessary for the intended purpose.

Sensitive data should not be placed in notification titles, previews, push payloads, or email content unless explicitly required and authorized.

## Identity Boundary

Identity owns:

- Authentication
- User identity
- Profile
- Roles
- Permissions
- Account state

Notifications consumes identity-related events.

Notifications owns:

- Notification records
- Notification preferences
- Delivery state
- Notification history

Notifications does not own authentication or identity credentials.

## Economy Boundary

Economy owns:

- Wallets
- Transactions
- Ledger entries
- Payments
- Refunds

Economy emits financial events.

Notifications consumes those events and generates appropriate notifications.

Notifications does not modify financial state.

## Learning Boundary

Learning owns:

- Courses
- Enrollment
- Learning progress
- Assessments
- Completion records

Learning emits learning events.

Notifications consumes those events.

Notifications does not modify learning state.

## Knowledge Boundary

Knowledge owns authoritative laboratory knowledge.

Knowledge may emit defined knowledge-related events.

Notifications may consume those events when a user-facing notification is required.

Notifications does not own laboratory knowledge.

## AI Boundary

AI owns:

- AI requests
- Provider integration
- AI safety controls
- AI usage tracking

AI may emit defined AI-related events.

Notifications may consume approved AI events where required.

Notifications does not directly integrate with Gemini.

## Community Boundary

Community owns:

- Community spaces
- Posts
- Discussions
- Comments
- Moderation

Community emits community-related events.

Notifications consumes those events.

Notifications does not directly manipulate community content.

## Notification Access

A user may only access notifications belonging to that user or notifications explicitly authorized for that user.

Administrative notification access must require explicit elevated permissions.

Notification queries must be protected by server-side authorization.

## Pagination and Performance

Notification lists must support pagination.

The system should avoid loading an unbounded notification history into a client request.

Frequently accessed notification data may be optimized through appropriate indexes and derived counts where required.

Performance optimizations must not change the authoritative notification state.

## Observability

Notification processing should provide operational visibility into:

- Events received
- Rules evaluated
- Notifications created
- Delivery attempts
- Delivery failures
- Retry counts
- Provider failures
- Processing latency

Observability data must not expose sensitive notification content unnecessarily.

## Failure Handling

A failure in an external notification channel must not automatically roll back the originating business operation.

For example:

PaymentCompleted
→ Economy transaction succeeds
→ Notification delivery fails

The financial transaction remains successful.

The Notifications system must record the delivery failure and apply the appropriate retry or recovery policy.

## Auditability

Important notification operations should be auditable.

Examples include:

- Notification creation
- Preference changes
- Delivery attempts
- Delivery failures
- Administrative notification actions
- Security notification generation

Audit records should contain sufficient information to identify the operation, actor or event, target, timestamp, and result where required.

## Production Principle

Notifications is designed as the final production architecture from the beginning.

There is no temporary notification implementation.

There is no UI-only notification system.

There is no direct notification delivery from unrelated domain components.

The implementation may be staged, but the underlying architecture remains production-oriented.

## Development Sequence

Notifications implementation should follow:

1. Notification data model
2. Event contracts
3. Notification rules
4. Notification preferences
5. In-app notification delivery
6. Read/unread state
7. Delivery state
8. Push integration
9. Email integration
10. Scheduling
11. Retry and failure handling
12. Observability
13. Production testing

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
