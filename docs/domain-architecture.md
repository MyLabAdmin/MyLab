# MyLab Domain Architecture

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Core Domains

MyLab consists of seven core domains:

1. Identity
2. Knowledge
3. AI
4. Learning
5. Economy
6. Notifications
7. Community

These domains represent the core business capabilities of the platform.

## Dashboard

Dashboard is not a domain.

Dashboard is an Application UI surface that presents functionality and information from multiple domains according to the authenticated user's identity, permissions, and context.

The Dashboard must not own business rules or domain data.

## 1. Identity Domain

### Purpose

Identity manages the identity and access lifecycle of MyLab users.

### Responsibilities

- User registration
- Authentication
- User profile
- Professional profile
- Roles
- Permissions
- Account state
- User preferences
- Identity-related security controls

### Ownership

Identity owns the core user identity and access-related data.

### Rules

Identity must not own:

- Wallet balances
- Laboratory knowledge
- Courses
- Community content
- AI conversations or AI feature data

Those belong to their respective domains.

## 2. Knowledge Domain

### Purpose

Knowledge is the structured medical-laboratory knowledge base of MyLab.

### Responsibilities

- Laboratory tests
- Analytes
- Laboratory terminology
- Reference information
- Clinical and technical information
- Educational knowledge
- Structured laboratory content
- Knowledge categorization
- Knowledge search

### AI Relationship

Knowledge may invoke the AI domain when an AI-powered explanation or assistance is requested.

Example:

Laboratory Test
→ AI Explanation Request
→ AI Domain
→ Gemini
→ Validated Response

### Ownership

Knowledge owns structured laboratory knowledge and its content lifecycle.

## 3. AI Domain

### Purpose

AI provides centralized AI capabilities across MyLab.

AI is a core platform capability and is not limited to a standalone chat interface.

### Responsibilities

- AI requests
- Context preparation
- Prompt construction
- Provider integration
- Gemini integration
- Input validation
- Output validation
- AI safety controls
- AI usage tracking
- AI feature orchestration

### Usage

AI can be invoked by other domains.

Examples:

- Explain a laboratory test
- Explain a laboratory concept
- Assist with educational content
- Assist with learning
- Provide contextual explanations

### Provider Independence

The AI domain must isolate the application from the underlying AI provider.

Gemini is the initial provider.

The architecture must allow future provider replacement or multi-provider support without changing the business domains.

## 4. Learning Domain

### Purpose

Learning provides the educational platform and course marketplace.

### Responsibilities

- Courses
- Lessons
- Learning materials
- Course creation
- Course submission
- Course review
- Course approval
- Course publishing
- Course enrollment
- Learning progress
- Assessments where required
- Instructor capabilities
- Educational content management

### User-generated Courses

Users can create and submit courses.

The lifecycle is:

Create
→ Submit
→ Review
→ Approval
→ Publish
→ Enrollment

The platform must support moderation and approval before public publication.

### Ownership

Learning owns courses, lessons, learning progress, enrollment, and course lifecycle data.

## 5. Economy Domain

### Purpose

Economy manages the financial and wallet capabilities of MyLab.

Economy is a core domain from the beginning.

### Registration Requirement

A wallet is automatically created as part of the user registration/account initialization process.

Each wallet receives a unique wallet identifier.

### Responsibilities

- Wallet creation
- Wallet identity
- Wallet balance representation
- Ledger
- Transactions
- Credits
- Debits
- Payments
- Course-related financial operations
- Refunds where required
- Economy rules
- Transaction history

### Ledger Principle

The economy must use a transaction/ledger model.

Business operations must not directly manipulate a wallet balance as the primary source of truth.

The ledger is the authoritative record of financial movements.

### Ownership

Economy owns wallet and financial transaction data.

## 6. Notifications Domain

### Purpose

Notifications provide a centralized notification platform for MyLab.

### Responsibilities

- Notification generation
- Notification categories
- User notification preferences
- In-app notifications
- Push notifications
- Email notifications where required
- Delivery state
- Read/unread state
- Priority
- Scheduling
- Notification history

### Event-Based Principle

Notifications should be triggered by defined application events rather than being directly implemented inside unrelated UI components.

Examples:

Course approved
→ Notification Event
→ Notification System
→ User notification

Payment completed
→ Notification Event
→ Notification System
→ User notification

New learning activity
→ Notification Event
→ Notification System
→ User notification

### Ownership

Notifications owns notification records, preferences, delivery state, and notification history.

## 7. Community Domain

### Purpose

Community provides social and professional interaction capabilities.

### Responsibilities

- Community spaces
- Posts
- Discussions
- Comments
- Professional interaction
- Moderation
- Community reporting
- Community-related notifications

### Ownership

Community owns community content and interaction data.

## Domain Interaction Rules

Domains must communicate through explicit interfaces.

A domain must not directly manipulate another domain's internal data.

Allowed interaction mechanisms include:

- Application services
- Domain services
- Domain events
- Explicit read interfaces

## Cross-Domain Examples

### Registration

Identity
→ Account Initialization
→ Economy creates wallet
→ Notifications may create onboarding notification

### Knowledge + AI

Knowledge
→ AI request
→ AI
→ Gemini
→ Response
→ Knowledge UI

### Learning + Economy

Learning
→ Course purchase
→ Economy transaction
→ Enrollment confirmation
→ Learning

### Learning + Notifications

Learning event
→ Notification event
→ Notifications

### Economy + Notifications

Economy transaction
→ Notification event
→ Notifications

### Community + Notifications

Community event
→ Notification event
→ Notifications

## Domain Ownership Principle

Each domain owns its business rules and primary data.

Cross-domain operations must use explicit contracts.

No domain may bypass another domain's authorization or business rules.

## Production Architecture Principle

All seven domains are part of the production architecture from the beginning.

Implementation may be staged, but the architecture must not be designed as a temporary MVP structure.

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
