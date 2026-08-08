# MyLab Community Architecture

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Purpose

The Community domain provides professional and educational interaction capabilities within MyLab.

Community allows users to participate in discussions, publish posts, comment on content, interact with other professionals and learners, and report inappropriate content.

Community is a production core domain from the beginning.

## Core Principle

Community functionality must be governed by explicit ownership, authorization, moderation, and content lifecycle rules.

Community must not directly own identity, learning, economy, knowledge, AI, or notification infrastructure.

The Community domain owns community content and community interaction rules.

## Community Structure

The conceptual structure is:

Community
→ Spaces
→ Posts
→ Comments
→ Interactions
→ Reports
→ Moderation

The structure may be extended when additional community capabilities are introduced.

## Community Spaces

A community space represents an organized area for discussion.

Examples may include:

- General laboratory discussion
- Clinical laboratory topics
- Academic discussion
- Student discussion
- Professional discussion
- Course-related discussion where explicitly supported

Spaces must have defined ownership and moderation rules.

A space may be public, restricted, or otherwise access-controlled according to the platform rules.

## Space Ownership

A community space must have an explicit ownership model.

Ownership may belong to:

- Platform administration
- An authorized moderator
- Another explicitly supported community authority

Users must not be able to change ownership through client-side operations.

## Space Access

Access to a community space must be authorized server-side.

Authorization may consider:

- Authentication state
- Account state
- User role
- Permissions
- Space visibility
- Membership where applicable
- Moderation restrictions

A user must not gain access to restricted content by manipulating client requests.

## Posts

A post represents user-generated community content.

A post may contain:

- Post identifier
- Author
- Space
- Content
- Creation timestamp
- Update timestamp
- Publication state
- Moderation state
- Visibility state
- Related resource where applicable

The author owns the post unless explicit moderation or administrative authority applies.

## Post Lifecycle

The post lifecycle should support explicit states.

Possible states include:

- Draft
- Published
- Hidden
- Removed
- Archived

The exact state transitions must be controlled by application rules.

A client must not directly change moderation-controlled states.

## Post Editing

An author may edit a post when authorized.

Editing must verify:

- Authenticated user
- Post ownership
- Account state
- Post state
- Applicable time or moderation restrictions

Moderators and administrators may have additional editing or moderation capabilities according to explicit permissions.

## Comments

Comments provide responses to community posts.

A comment belongs to:

- An author
- A post
- A community context

Comment ownership follows the same authorization principles as posts.

Comments must have their own lifecycle and moderation state.

## Comment Lifecycle

Possible comment states include:

- Published
- Hidden
- Removed
- Archived

Moderation state must be controlled server-side.

A removed comment should not be silently restored by a client request.

## Interactions

Community may support controlled interaction features.

Examples include:

- Likes or reactions
- Bookmarks
- Mentions
- Follows where explicitly introduced

Each interaction must have a defined ownership and uniqueness model.

For example, a user should not be able to create unlimited duplicate reactions to the same resource when the interaction is intended to be unique.

## Mentions

Community may support mentioning another user.

Mention processing must verify that:

- The mentioned identity exists
- The mentioned user is eligible for the interaction
- The author is authorized to create the mention
- The referenced content is accessible

Mentions may generate notification events.

Community does not directly implement notification delivery.

## Reporting

Users must be able to report inappropriate or problematic community content when the feature is enabled.

Reports may reference:

- Post
- Comment
- User
- Community space
- Other supported community resources

A report must include:

- Reporter
- Target resource
- Report reason
- Optional description
- Creation timestamp
- Processing state

Users must not be able to manipulate report ownership or processing state.

## Report Lifecycle

Possible report states include:

- Submitted
- Under Review
- Resolved
- Dismissed

Only authorized moderation personnel may change moderation-related report states.

## Moderation

Moderation is a core Community capability.

Moderation may include:

- Reviewing reports
- Hiding content
- Removing content
- Restoring content where authorized
- Restricting users
- Managing community spaces
- Reviewing abusive behavior
- Applying moderation actions

Moderation decisions must be authorized through explicit permissions.

## Moderation Roles

Possible community-related roles include:

- Community Moderator
- Senior Moderator
- Administrator

Roles are not hard-coded into UI components.

Authorization must use explicit permissions.

## Moderation Permissions

Possible permissions include:

- View reports
- Review reports
- Hide post
- Remove post
- Restore post
- Hide comment
- Remove comment
- Restrict user
- Manage community space
- Review moderation history

Additional permissions may be introduced when required.

## User Restrictions

The Community domain may support restrictions on community participation.

Possible states include:

- Normal
- Restricted
- Suspended

A restriction may apply to:

- Posting
- Commenting
- Reactions
- Mentions
- Other community operations

Restrictions must be enforced server-side.

A restricted user must not bypass the restriction by modifying client requests.

## Community Safety

Community safety must be part of the production architecture.

The system should support:

- Content reporting
- Moderation workflows
- Abuse prevention
- Rate limiting
- Account restrictions
- Auditability
- Content visibility controls

Safety controls must be implemented at the appropriate application and server boundaries.

## Content Visibility

Community content must have explicit visibility rules.

Possible visibility models include:

- Public
- Authenticated users
- Space members
- Restricted audience

Visibility must be enforced server-side.

The UI must not be treated as the security boundary.

## Content Ownership

Users own the community content they create, subject to:

- Platform rules
- Moderation authority
- Legal requirements
- Account restrictions
- Explicit content policies

Ownership does not prevent authorized moderation actions.

## Deletion

Community content deletion must follow defined lifecycle rules.

Where permanent deletion would destroy required moderation or audit information, the system may use logical deletion or a moderation state instead.

The architecture must distinguish between:

- User-requested deletion
- Moderation removal
- Administrative deletion
- Permanent data deletion where legally required

## Editing History

For important moderated content, the system should support an auditable history of significant changes.

The history may record:

- Actor
- Operation
- Resource
- Previous state where appropriate
- New state
- Timestamp
- Reason where required

Sensitive content should not be unnecessarily duplicated in audit records.

## Search

Community search may support:

- Posts
- Discussions
- Spaces
- Authors
- Relevant community content

Search results must respect authorization and visibility rules.

A search index must not expose content that the requesting user cannot access.

## Pagination

Community feeds and search results must support pagination.

The application must not load an unbounded number of posts or comments into a single request.

Appropriate database indexes must be introduced during Database Architecture.

## Ranking and Feeds

Community may eventually support ranking or personalized feeds.

Ranking logic must remain separate from the authoritative content model.

Possible ranking signals may include:

- Recency
- Relevance
- Engagement
- User preferences
- Space relevance

Ranking must never bypass authorization or visibility rules.

## Localization

MyLab supports Arabic and English.

Community UI labels, moderation messages, system-generated content, and supported notification content must support localization.

User-generated content remains the responsibility of its author and should not be automatically altered by the platform unless an explicitly defined feature performs translation.

## Identity Boundary

Identity owns:

- Authentication
- User identity
- Profile
- Roles
- Permissions
- Account state

Community consumes trusted identity information.

Community owns:

- Community content
- Community spaces
- Posts
- Comments
- Community interactions
- Reports
- Moderation records

Community must not store authentication credentials.

## Knowledge Boundary

Knowledge owns authoritative laboratory knowledge.

Community may reference Knowledge resources when authorized.

For example:

Community Post
→ Laboratory Test Reference
→ Knowledge Resource

A community reference must not duplicate authoritative knowledge unnecessarily.

Knowledge remains the source of truth for laboratory information.

## Learning Boundary

Learning owns:

- Courses
- Lessons
- Enrollment
- Learning progress
- Assessments

Community may reference learning resources where supported.

For example:

Course
→ Community Discussion

Community does not own enrollment or course progress.

## AI Boundary

AI owns:

- AI requests
- AI provider integration
- Prompt construction
- AI safety controls
- AI usage tracking

Community may request approved AI capabilities through the AI domain.

Community must not directly integrate with Gemini.

For example:

Community Content
→ Approved AI Assistance Request
→ AI Domain
→ Validated Response
→ Community Feature

AI-generated content must follow the AI safety architecture.

## Economy Boundary

Economy owns:

- Wallets
- Transactions
- Ledger entries
- Payments
- Refunds

Community must not directly modify financial state.

If paid community capabilities are introduced, all financial operations must use explicit Economy contracts.

## Notifications Boundary

Community may emit events such as:

- Post created
- Comment created
- User mentioned
- Community report submitted
- Moderation action completed

Notifications consumes approved events and generates notifications according to notification rules.

Community does not directly implement notification delivery.

## Event Principles

Community events must have stable identifiers.

Events should contain only the information required by consumers.

Sensitive information must not be included unnecessarily.

Event processing should be idempotent where duplicate delivery is possible.

Examples:

Community
→ UserMentioned
→ Notifications

Community
→ ModerationActionCompleted
→ Notifications

## Authorization Principles

Community operations must be authorized server-side.

Authorization should verify:

- Authentication
- Account state
- Required permission
- Resource ownership
- Resource visibility
- Community restriction state
- Moderation authority where applicable

Authentication alone does not grant community moderation access.

## Rate Limiting

Community operations should support rate limiting.

Rate limits may apply to:

- Post creation
- Comment creation
- Reactions
- Mentions
- Reports
- Search
- Other abuse-sensitive operations

Rate limiting must be enforced outside the trust boundary of the client.

## Abuse Prevention

The system should support controls against:

- Spam
- Excessive posting
- Repeated mentions
- Malicious reporting
- Automated abuse
- Repeated reactions
- Other defined abusive behavior

Controls may include:

- Rate limits
- Account restrictions
- Moderation review
- Event monitoring
- Temporary suspension

## Privacy Principle

Community content may contain personal or professional information.

The system must minimize unnecessary collection and exposure of personal information.

Private or restricted community content must only be visible to authorized users.

Community search and notifications must respect the same authorization boundaries.

## Auditability

Important Community operations should be auditable.

Examples include:

- Moderation actions
- Report state changes
- User restrictions
- Administrative space changes
- Content removal
- Content restoration

Audit records should identify:

- Actor
- Operation
- Target
- Timestamp
- Result
- Reason where required

## Observability

Community operations should provide operational visibility into:

- Post creation
- Comment creation
- Report volume
- Moderation activity
- Failed operations
- Rate-limit events
- Abuse indicators
- Processing latency

Observability data must not expose unnecessary private content.

## Failure Handling

A failure in Notifications must not roll back successful Community operations.

For example:

Community
→ Comment Created
→ Notification Delivery Fails

The comment remains successfully created.

The notification system handles delivery failure independently.

Similarly, a failed optional AI assistance request must not corrupt the underlying community content.

## Data Ownership

Community owns the authoritative state of:

- Community spaces
- Posts
- Comments
- Community interactions
- Reports
- Moderation records
- Community restrictions

Other domains must access Community through explicit contracts.

Community must not directly modify another domain's authoritative data.

## Production Principle

Community is designed as the final production architecture from the beginning.

There is no temporary community implementation.

There is no UI-only moderation system.

There is no client-authoritative community state.

The implementation may be staged, but the underlying architecture remains production-oriented.

## Development Sequence

Community implementation should follow:

1. Community data model
2. Space model
3. Post model
4. Comment model
5. Authorization rules
6. Moderation model
7. Reporting system
8. Community restrictions
9. Interactions
10. Search
11. Rate limiting
12. Event integration
13. Notification integration
14. Observability
15. Production testing

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
