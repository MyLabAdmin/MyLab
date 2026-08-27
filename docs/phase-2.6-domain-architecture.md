MyLab Phase 2.6 — Domain Architecture & Authorization Foundation

Status

Architecture Definition — In Progress

Objective

Define the production architecture for MyLab's core application domains, authorization model, data ownership boundaries, AI integration boundary, and future economy capabilities before beginning new domain implementation.

Phase 2.6 is an architecture-first phase.

No new domain feature implementation should begin until the architecture defined in this document has been reviewed and accepted.

Architectural Principle

MyLab must be designed as a set of clearly separated domains with explicit ownership, authorization, and data boundaries.

The architecture must remain:

- Production-ready
- Secure
- Maintainable
- Extensible
- Consistent with the existing MyLab application architecture

No prototype or temporary architecture should be introduced.

Domain Map

MyLab consists of the following primary domains:

- Identity
- Knowledge
- Courses
- AI
- Community
- Economy
- Subscription
- Verification
- Administration

The domains interact through defined service and authorization boundaries.

High-Level Architecture

Authentication
→ Identity/Profile Validation
→ Authorization
→ Application Surface
→ Domain
→ Domain Services
→ Database / External Services

AI follows a separate service boundary:

User Request
→ MyLab AI Service
→ MyLab Knowledge
→ Additional Domain Context when permitted
→ General Knowledge when required
→ Google Gemini API
→ MyLab AI Response

Identity Domain

The Identity domain owns:

- Authentication
- User account
- User profile
- Account status
- User-facing identity information
- Authentication-related flows

The application must continue using server-trusted authentication and authorization.

The client UI is never treated as the security boundary.

User Types

The architecture distinguishes between:

Regular User

A standard MyLab account.

A regular user may:

- Read Knowledge
- Use permitted AI capabilities
- Participate in Community
- Purchase subscriptions
- Purchase Coins
- Transfer Coins according to Economy rules
- Apply to become a Course Creator
- Apply for verification

Course Creator

A regular user who has been approved to create courses.

Course Creator status is a capability granted after approval.

Course Creator is not a staff role.

Flow:

User
→ Course Creator Application
→ Terms Acceptance
→ Super Admin Review
→ Approval
→ Course Creator Capability

Staff

Staff members receive administrative capabilities according to assigned roles.

Staff roles currently include:

- Super Admin
- Knowledge Manager
- Course Author
- Course Reviewer
- Community Moderator
- Finance/Economy Manager
- Support Staff

Authorization Model

MyLab will use role-based and capability-based authorization where appropriate.

Authorization must be enforced server-side.

UI visibility is not authorization.

The architecture must support:

- User permissions
- Staff roles
- Creator capabilities
- Verification capabilities
- Domain-specific permissions
- Administrative permissions

Administration

Super Admin

The Super Admin currently has the highest administrative authority.

Responsibilities include:

- System administration
- Knowledge administration
- Course Creator approval
- Professional Verification approval
- Administrative overrides
- Financial administration where applicable
- Moderation escalation
- User account actions
- Future administrative configuration

Other staff roles should receive only the permissions required for their responsibilities.

Knowledge Domain

MyLab Knowledge is owned by MyLab.

Knowledge is not user-generated content.

The Knowledge domain may contain:

- Laboratory information
- Tests
- Test interpretation information
- Equipment information
- Laboratory procedures
- Educational information
- Reference material
- Other officially managed MyLab knowledge

Knowledge is managed by authorized staff.

Users have read access according to the application's access rules.

Users cannot directly modify Knowledge.

Future corrections or suggestions from users must be submitted through an appropriate communication/support flow rather than direct database modification.

Knowledge Ownership

Knowledge
→ MyLab-owned
→ Staff-managed
→ User-readable

AI Domain

AI is an application service rather than an independent source of truth.

The AI layer will provide multiple capabilities, including:

- Simplifying Knowledge
- Explaining Knowledge
- Simplifying Course information
- Assisting Course preparation
- Assisting Course Authors
- Community data analysis where explicitly permitted
- Advertisement-related analysis where explicitly permitted
- Future AI-assisted application services

AI Knowledge Architecture

MyLab AI uses a layered knowledge architecture.

The AI service must not treat all available information as one undifferentiated knowledge source.

Knowledge is divided into three conceptual layers:

Layer 1 — MyLab Knowledge

MyLab Knowledge is the official knowledge owned and managed by MyLab.

It includes approved platform knowledge such as:

- Laboratory information
- Tests
- Test interpretation information
- Equipment information
- Laboratory procedures
- Educational information
- Reference material
- Other officially managed MyLab knowledge

When a request relates to MyLab Knowledge, this layer has the highest priority.

AI must consult MyLab Knowledge first whenever relevant.

Layer 2 — Domain Content

Domain Content consists of application-generated or user-generated content that may be relevant to an AI request.

Examples include:

- MyLab Courses
- Approved User Courses
- Community content
- Other domain-specific application content

Access to Domain Content must depend on the request context, ownership, authorization, privacy requirements, and domain-specific rules.

AI must not receive unrestricted access to all domain content.

Only the minimum required and permitted context should be provided to the AI service.

Layer 3 — General Knowledge

General Knowledge is external/general knowledge available through the AI provider.

For MyLab's initial AI integration, this capability is provided through the Google Gemini API.

General Knowledge may be used when:

- MyLab Knowledge is insufficient
- The request is outside MyLab Knowledge
- The requested information is permitted to use external/general knowledge

General Knowledge must not silently replace available MyLab Knowledge when the request concerns official MyLab information.

Knowledge Priority

The preferred decision flow is:

User Request
→ MyLab AI Service
→ Context and Permission Check
→ Layer 1: MyLab Knowledge
→ Layer 2: Permitted Domain Content
→ Layer 3: General Knowledge when required
→ Google Gemini API
→ MyLab AI Response

The exact retrieval and orchestration implementation will be defined during the future AI implementation phase.

The AI service must not claim that general AI-generated information is official MyLab Knowledge.

AI Data Boundary

The layered architecture does not grant the AI provider unrestricted access to MyLab data.

The MyLab AI Service remains responsible for:

- Selecting relevant context
- Enforcing authorization
- Removing unnecessary information
- Applying domain-specific data rules
- Controlling what is sent to the external AI provider

The external AI provider receives only the minimum information required for the approved AI operation.

AI Source Transparency

The application should clearly distinguish between:

- MyLab Knowledge
- General AI Knowledge

This distinction is especially important for medical and educational information.

AI External Provider

Google Gemini will be accessed through its API.

MyLab must not tightly couple application domains directly to the Gemini API.

The application should use an internal AI service boundary so that:

- API credentials remain server-side
- AI providers can be changed later
- Prompt and context policies remain centralized
- Domain-specific AI permissions remain controlled
- Logging and safety controls remain centralized

AI User Data Boundary

The AI system must not receive unnecessary user information.

The current approved boundary is:

- User name may be provided when required
- Sensitive user profile information must not be provided unless explicitly approved by future architecture
- Unrelated private user data must not be exposed to the AI provider

Courses Domain

The Courses domain contains two distinct course categories.

MyLab Courses

Official courses controlled by MyLab.

MyLab Courses may be created or maintained by authorized Course Authors and other explicitly authorized staff.

User Courses

Courses created by approved Course Creators.

User Course flow:

User
→ Course Creator Application
→ Terms Acceptance
→ Super Admin Approval
→ Course Creation
→ Course Pricing
→ Publication
→ Course Consumption

Course Creator

An approved Course Creator may:

- Create courses
- Set a course price
- Make a course free
- Manage their permitted course content
- Receive earnings from eligible paid courses
- Request withdrawals after reaching the configured withdrawal threshold

The exact course lifecycle and review requirements will be defined before Course implementation.

Course Content Governance

Because it is not practical for the current administration to manually investigate every course individually, the system must include:

- Course Creator terms
- Course content constitution/policy
- Automated policy checks where appropriate
- User reporting
- Administrative review
- Course restriction/removal mechanisms

Passing automated checks does not guarantee that content is permanently approved.

Reported content may still be reviewed by authorized staff.

Community Domain

Community is a user-generated content domain.

All users may publish Community content subject to Community policies.

Community may eventually support:

- Posts
- Images
- Videos
- Reactions
- Comments
- Reports
- Rewards
- Future monetized content

Community is governed by a Community Constitution / Policy.

Community Moderation

The moderation architecture must support:

- Automated policy checks
- User reports
- Moderator review
- Warnings
- Posting suspension
- Account suspension
- Account locking
- Content removal
- Content restriction
- User notifications

Possible moderation flow:

Post
→ Policy Evaluation
→ Publish / Restrict / Remove / Review
→ Reports
→ Moderator Action
→ Notification

Community Media Limits

Community media limits will differ according to subscription status.

The exact numerical limits are intentionally deferred.

The architecture must support:

- Daily media quotas
- Image quotas
- Video quotas
- Free-user limits
- Premium-user limits
- Coin-based quota extensions

The actual limits must be configurable rather than hard-coded into individual UI components.

Economy Domain

Economy is a shared application domain.

All users use the same currency system.

The Economy domain must support at least:

- Coins
- Coin purchases
- Coin transfers
- Fees
- Limits
- Rewards
- Spending
- Creator earnings
- Withdrawals
- Financial transactions

Coins

Coins are an application currency.

Users may:

- Purchase Coins using real money
- Receive Coins as rewards where supported
- Send Coins to other users
- Spend Coins on supported application features

Coin transfers must respect:

- Transfer limits
- Fees
- Account status
- Anti-abuse controls
- Future economy policies

Locked or suspended accounts cannot participate in restricted transfer operations according to Economy rules.

Coin Transactions

Coin movement must be represented as transactions rather than relying only on a mutable balance.

Conceptual transaction categories include:

- Purchase
- Reward
- Transfer
- Fee
- Spend
- Refund
- Adjustment

Financial records must remain auditable.

Creator Earnings

Creator Earnings are distinct from Coins.

A Course Creator may earn real monetary value from eligible paid courses.

Conceptual flow:

Course Purchase
→ Revenue Transaction
→ Creator Earnings
→ Withdrawal Eligibility
→ Withdrawal Request
→ Administrative Processing
→ Payout

Creator earnings must not be represented as ordinary Coins.

Withdrawals

Course Creators may request a withdrawal after reaching the configured minimum withdrawal threshold.

Withdrawal architecture must support:

- Minimum withdrawal threshold
- Withdrawal request
- Request status
- Available earnings
- Processing status
- Completed status
- Failed status
- Administrative review
- Payout records

Payment information collected from the Creator may be used to process approved withdrawals.

Payment information must be handled as sensitive financial data and must not be exposed to unrelated domains or external AI systems.

Subscription Domain

MyLab uses one subscription system for users.

Plans will support:

- Free
- Monthly
- Quarterly
- Yearly

Subscription status may affect:

- Community media quotas
- Feature access
- AI capabilities where explicitly defined
- Other application limits

Subscription does not replace authorization.

Verification Domain

Verification is separate from ordinary account status.

The architecture must support multiple verification types.

Identity Verification

Identity verification confirms the user's identity.

Successful verification grants an Identity Verified badge.

Professional Verification

Professional verification confirms that the user is a verified practicing professional according to MyLab's verification requirements.

Successful verification grants a Professional badge.

Currently:

Super Admin
→ Reviews Professional Verification
→ Approves / Rejects

The verification architecture must support future verification types without redesigning the Identity domain.

Badge Model

Badges must be derived from verified states rather than manually displaying arbitrary labels.

Examples include:

- Identity Verified
- Professional Verified

Additional badge types may be introduced later.

Data Ownership Boundaries

Knowledge

Owned by MyLab.

Managed by authorized staff.

User Profile

Owned by the user account and governed by Identity rules.

User Courses

Owned/managed according to Course Creator permissions and MyLab platform rules.

Community Posts

User-generated content governed by Community policies.

Economy Records

Owned by the Economy domain and must remain auditable.

Verification Records

Owned by the Verification domain.

AI Requests

Managed through the AI service boundary.

AI requests must receive only the minimum data required.

Domain Interaction Rules

Domains must not directly manipulate another domain's internal data without an approved service boundary.

Examples:

- Community must not directly modify Economy balances.
- Courses must not directly modify subscription records.
- AI must not directly modify Knowledge.
- Users must not directly modify Knowledge records.
- UI components must not directly bypass authorization rules.
- Staff interfaces must use authorized server-side operations.

Database Architecture Direction

The database must reflect domain ownership.

Before implementing each domain:

1. Define entities.
2. Define relationships.
3. Define ownership.
4. Define access policies.
5. Define indexes.
6. Define audit requirements.
7. Define migrations.
8. Then implement dependent application features.

Database changes must be version-controlled through migrations.

Security Requirements

Security-sensitive operations must be server-trusted.

This includes:

- Authentication
- Authorization
- Course Creator approval
- Professional Verification
- Moderation actions
- Account locking
- Economy transactions
- Coin transfers
- Withdrawal processing
- Payment information
- AI provider credentials

The client must never be treated as the authority for these operations.

External Services

Current and planned external services include:

Supabase

Used for:

- PostgreSQL
- Authentication
- Storage
- Server-side data operations

Google Gemini API

Used for:

- AI capabilities

Gemini must remain behind the MyLab AI service boundary.

ImageKit

Used for approved image delivery/storage-related functionality.

Sensitive credentials must remain server-side.

Future Administration Model

The current implementation may be operated by one administrator.

The architecture must nevertheless support separation of responsibilities for future staff.

Planned staff model:

- Super Admin
- Knowledge Manager
- Course Author
- Course Reviewer
- Community Moderator
- Finance/Economy Manager
- Support Staff

Permissions should be granular enough to allow a future organization to delegate responsibilities safely.

Phase 2.6 Scope

This phase defines:

- Domain boundaries
- Ownership
- Authorization direction
- AI boundary
- Course architecture direction
- Community architecture direction
- Economy architecture direction
- Subscription architecture direction
- Verification architecture direction
- Administrative role direction
- Security boundaries
- Database architecture requirements

Out of Scope

The following are not implemented as part of Phase 2.6:

- Full Knowledge UI
- Full Course UI
- Community implementation
- Economy implementation
- Payment integration
- Withdrawal integration
- AI production integration
- Full moderation engine
- Full verification workflow
- Detailed database migrations for every future domain
- Final numerical quotas
- Final pricing
- Final withdrawal thresholds
- Final transaction fees

Acceptance Criteria

- [ ] Domain boundaries are explicitly defined.
- [ ] Knowledge ownership is explicitly defined.
- [ ] User Course architecture is explicitly defined.
- [ ] Course Creator approval flow is explicitly defined.
- [ ] Course Author role is explicitly defined.
- [ ] Community ownership and moderation boundaries are defined.
- [ ] Economy and Coins are separated conceptually from Creator Earnings.
- [ ] Creator withdrawal architecture is defined.
- [ ] Subscription model is defined.
- [ ] Identity and Professional Verification are defined.
- [ ] Staff roles are defined.
- [ ] AI service boundary is defined.
- [ ] MyLab Knowledge is established as the preferred AI knowledge source.
- [ ] General AI knowledge fallback is defined.
- [ ] AI user-data boundary is defined.
- [ ] Security boundaries are defined.
- [ ] Database-first implementation requirements are defined.
- [ ] No domain implementation begins before architecture approval.

Architecture Gate

Phase 2.6 is complete only when:

1. Domain architecture is reviewed.
2. Authorization boundaries are reviewed.
3. AI boundary is reviewed.
4. Economy model is reviewed.
5. Course and Community models are reviewed.
6. Security boundaries are reviewed.
7. Database requirements are reviewed.
8. Documentation is committed and pushed.
9. The next implementation phase is explicitly defined.

Development Sequence

1. Review existing architecture.
2. Define domain boundaries.
3. Define ownership.
4. Define user/staff/creator capabilities.
5. Define authorization model.
6. Define AI service boundary.
7. Define Course architecture.
8. Define Community architecture.
9. Define Economy architecture.
10. Define Subscription architecture.
11. Define Verification architecture.
12. Define security boundaries.
13. Define database architecture requirements.
14. Review architecture.
15. Update project documentation.
16. Commit.
17. Push.
18. Define the next implementation phase.

Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
