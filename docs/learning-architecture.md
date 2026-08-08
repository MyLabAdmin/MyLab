# MyLab Learning Architecture

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Purpose

The Learning domain provides the educational platform of MyLab.

It manages courses, lessons, learning materials, instructors, course lifecycle, enrollment, learning progress, assessments, and educational delivery.

Learning is a production core domain from the beginning.

## Core Principle

Learning owns educational delivery and learning lifecycle data.

Learning must not directly own:

- User authentication
- Wallets or financial transactions
- Laboratory knowledge ownership
- AI provider infrastructure
- Notification delivery
- Community content

Cross-domain operations must use explicit application contracts.

## Course

A course is the primary educational product in MyLab.

A course may contain:

- Course metadata
- Title
- Description
- Cover information
- Instructor information
- Lessons
- Learning materials
- Assessments where required
- Pricing information where applicable
- Publication state
- Course version information

The Learning domain owns course lifecycle and educational structure.

## Course Lifecycle

The production course lifecycle is:

Draft
→ Submitted
→ Under Review
→ Approved
→ Published
→ Archived

A course must not become publicly available before the required review and approval process is completed.

A rejected course may return to an editable state according to the defined review workflow.

Course lifecycle transitions must be validated server-side.

## Course Creation

Authorized instructors may create courses.

The creation flow is:

Instructor
→ Create Course
→ Draft
→ Add Lessons
→ Add Materials
→ Validate Course
→ Submit for Review

Creating a course does not automatically publish it.

## Course Submission

An instructor may submit a completed course for review.

Submission must verify:

- Course ownership
- Required course information
- Required lessons
- Required educational materials
- Valid course state
- Submission permission

A submitted course enters the review workflow.

## Course Review

Course review is a controlled application process.

Authorized reviewers may:

- Review course content
- Request changes
- Reject a course
- Approve a course

Review actions must be auditable.

The instructor must not be able to approve their own course unless an explicitly authorized future policy permits it.

## Course Approval

Approval changes the course lifecycle state according to the authorization rules.

Approval does not necessarily mean immediate publication if additional publication requirements exist.

Approved courses may proceed to publication.

## Course Publication

Only courses satisfying all publication requirements may become publicly available.

Publication must be performed through an authorized server-side operation.

The system must prevent unauthorized modification of publication state.

Published courses must have a stable published version.

Subsequent changes should use a controlled versioning or revision process where required.

## Course Versioning

Course content may evolve after publication.

The architecture should support controlled course revisions.

A published course revision must not silently invalidate historical learning records.

Where required, learners must remain associated with the course version applicable to their enrollment.

## Lessons

A course consists of ordered lessons.

A lesson may contain:

- Text
- Structured educational content
- Laboratory knowledge references
- Media references
- Learning materials
- AI-assisted educational elements
- Assessments where required

Lesson ordering belongs to Learning.

Lessons must remain associated with their owning course.

## Learning Materials

Learning materials may include:

- Documents
- Images
- Videos
- Structured educational resources
- External references where allowed

Storage of uploaded materials must follow the platform storage and security architecture.

Access to protected course materials must be authorized according to course and enrollment rules.

## Instructor Model

An instructor is an authenticated MyLab user with the required instructor capability.

Instructor capability must be represented through authorization rather than hard-coded UI assumptions.

An instructor may:

- Create courses
- Edit owned draft courses
- Submit courses for review
- Respond to review feedback
- Manage authorized course content

Instructor permissions must be enforced server-side.

## Course Ownership

Course ownership belongs to the Learning domain.

The system must track the authorized owner or instructor relationship for each course.

Ownership must be checked before allowing protected course operations.

Authentication alone does not grant permission to modify a course.

## Enrollment

Enrollment represents a learner's authorized participation in a course.

Enrollment may occur through:

- Free enrollment
- Successful course purchase
- Authorized administrative enrollment
- Other explicitly defined business flows

The Learning domain owns enrollment records.

## Paid Course Enrollment

For paid courses, Learning must request the financial operation from Economy.

The flow is:

Learner
→ Course Purchase Request
→ Learning
→ Economy Authorization
→ Economy Payment Transaction
→ Payment Confirmation
→ Learning Enrollment
→ Enrollment Confirmation

Learning must not directly modify wallet balances or ledger records.

Enrollment must only be confirmed after the required financial operation succeeds.

## Free Course Enrollment

For free courses, Learning may create enrollment directly after validating:

- Authentication
- Course availability
- Course publication state
- Enrollment eligibility
- Existing enrollment state

Duplicate enrollment must be prevented.

## Enrollment State

Enrollment may support states such as:

- Active
- Completed
- Cancelled
- Suspended

Additional states may be introduced when required.

State transitions must be validated by server-side business rules.

## Learning Progress

Learning owns learner progress.

Progress may include:

- Current lesson
- Completed lessons
- Completion percentage
- Assessment results
- Course completion state
- Last activity timestamp

Progress must belong to the correct authenticated learner and enrollment.

Clients must not be trusted as the authoritative source of completion state.

## Course Completion

Course completion must be determined by defined Learning rules.

Possible requirements include:

- Required lessons completed
- Required assessments completed
- Required minimum score
- Other explicitly defined completion criteria

Completion state must be calculated and persisted through controlled application logic.

## Assessments

Learning may provide assessments associated with courses or lessons.

Assessments may include:

- Questions
- Answers
- Attempts
- Scores
- Passing criteria
- Completion state

Assessment rules must be defined independently from UI components.

Sensitive assessment answers and scoring logic must not rely solely on client-side validation.

## Certificates

The architecture may support course completion certificates where required.

If certificates are introduced, they must be generated only after verified completion according to the Learning rules.

Certificate records must remain associated with the learner, course, completion event, and relevant course version.

## Learning and Knowledge Boundary

Knowledge owns authoritative laboratory knowledge.

Learning owns educational course structure and delivery.

A course may reference Knowledge resources.

The relationship is:

Learning Course
→ Knowledge Reference
→ Authoritative Knowledge Content

Learning must not duplicate authoritative knowledge unnecessarily.

Changes to Knowledge content must not silently corrupt historical course records where versioning is required.

## Learning and AI Boundary

Learning may invoke the AI domain for educational assistance.

Examples include:

- Explaining a lesson
- Generating study assistance
- Explaining laboratory concepts
- Creating practice questions where authorized
- Supporting learner understanding

The flow is:

Learning
→ AI Request
→ AI Domain
→ Context Preparation
→ Gemini
→ Validated AI Response
→ Learning UI

Learning must not directly integrate with Gemini.

The AI domain owns provider integration and AI safety controls.

## AI-Generated Educational Content

AI-generated content must not automatically become authoritative educational content.

Where AI is used to assist with course creation, generated content must remain subject to the appropriate instructor and review workflow.

AI assistance must not bypass course approval rules.

## Learning and Economy Boundary

Economy owns:

- Wallets
- Payments
- Transactions
- Ledger entries
- Refunds

Learning owns:

- Courses
- Pricing metadata where applicable
- Enrollment
- Learning progress
- Course completion

The boundary is:

Learning
→ Financial Request
→ Economy
→ Financial Result
→ Learning State Change

Learning must never directly create financial ledger entries.

## Refund and Enrollment Relationship

If a paid course is refunded, the resulting Learning state must follow an explicitly defined business rule.

Economy owns the financial refund.

Learning owns the resulting enrollment state.

The two domains must communicate through explicit application events or service contracts.

## Notifications Boundary

Learning may emit application events such as:

- Course submitted
- Course approved
- Course rejected
- Course published
- Enrollment created
- Lesson completed
- Course completed
- Assessment completed

Notifications may consume these events.

Learning does not directly implement notification delivery.

## Identity Boundary

Identity owns:

- Authentication
- User identity
- Profiles
- Roles
- Permissions
- Account state

Learning consumes authenticated identity and authorization information.

Learning does not own authentication credentials.

Instructor capability must be determined through the authorization architecture.

## Community Boundary

Community owns social interaction and community content.

Learning may expose approved course-related community interactions through explicit interfaces.

Learning must not directly manipulate Community internal data.

## Search

Learning may provide course discovery and filtering.

Search may include:

- Course title
- Description
- Instructor
- Category
- Difficulty
- Language
- Availability
- Price where applicable

Search must respect course publication state and authorization rules.

Draft, rejected, or private courses must not appear in public discovery.

## Localization

Learning must support the platform's Arabic and English languages.

Course content may require language metadata.

The architecture should support future multilingual course versions without coupling localization logic to UI components.

## Security Principles

Learning must follow these principles:

- Protected operations require an authenticated session.
- Authorization is enforced server-side.
- Course ownership is validated.
- Instructor permissions are validated.
- Reviewer permissions are validated.
- Course lifecycle transitions are validated.
- Enrollment ownership is validated.
- Learning progress cannot be trusted from the client.
- Protected course materials require authorization.
- Paid enrollment requires confirmed Economy results.
- AI-generated content cannot bypass review rules.
- Sensitive assessment logic must remain server-controlled where required.
- Important learning operations must be auditable.

## Data Ownership

Learning owns:

- Courses
- Course versions
- Lessons
- Learning materials metadata
- Instructor-course relationships
- Course lifecycle state
- Enrollment
- Learning progress
- Assessments
- Completion records
- Certificates where implemented

Learning does not own:

- Authentication credentials
- Wallets
- Financial ledger entries
- AI provider infrastructure
- Notification delivery
- Community content
- Authoritative laboratory knowledge

## Event Principles

Important Learning state changes should produce explicit application events.

Events must contain only the information required by consuming systems.

Examples:

CourseApproved
CoursePublished
EnrollmentCreated
LessonCompleted
CourseCompleted
AssessmentCompleted

Events must not expose sensitive data unnecessarily.

## Auditability

Important Learning operations should be auditable.

Examples include:

- Course creation
- Course submission
- Review decision
- Course approval
- Publication
- Enrollment
- Completion
- Assessment actions
- Instructor changes

Audit information should identify the actor, operation, resource, timestamp, and result where required.

## Production Principle

Learning is designed as the final production architecture from the beginning.

There is no temporary course model.

There is no prototype enrollment model.

There is no client-side authority over learning state.

The implementation may be staged, but the underlying architecture remains production-oriented.

## Development Sequence

Learning implementation should follow:

1. Learning database model
2. Authorization rules
3. Course lifecycle
4. Course ownership
5. Course creation
6. Course review
7. Course publication
8. Enrollment
9. Economy integration
10. Learning progress
11. Assessments
12. AI integration
13. Notifications integration
14. Search and discovery
15. Production testing

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
