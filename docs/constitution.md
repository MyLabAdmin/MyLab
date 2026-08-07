# MyLab Constitution

**Version:** 1.0  
**Status:** Approved  
**Project:** MyLab

---

## 1. Project Identity

MyLab is a professional digital ecosystem dedicated exclusively to:

- Laboratory physicians
- Medical laboratory specialists and technicians
- Medical laboratory students

The platform is not designed as a general consumer or patient-facing platform.

---

## 2. Core Vision

MyLab aims to provide an integrated professional ecosystem combining:

- Medical laboratory knowledge
- Professional learning
- Artificial intelligence
- Professional community
- Digital economy
- Specialized tools and services

All major domains are designed to work together as one coherent ecosystem.

---

## 3. Development Principles

### 3.1 Architecture First

Architecture and system boundaries must be defined before implementation.

### 3.2 Database Before UI

Data models, relationships, security rules, and database behavior must be designed before building dependent UI features.

### 3.3 Security Before Features

Authentication, authorization, data protection, and access control must be considered before implementing business features.

### 3.4 Production Ready From Day One

MyLab will not be developed as an MVP, prototype, proof of concept, or temporary implementation.

Every implemented feature must be production-oriented from the beginning.

### 3.5 Simple and Maintainable Architecture

The architecture must prioritize:

- Simplicity
- Maintainability
- Clear separation of responsibilities
- Extensibility
- Testability

Unnecessary abstraction and architectural complexity must be avoided.

### 3.6 Documentation Is Part of Development

Important features, architectural decisions, database changes, and project progress must be documented.

### 3.7 GitHub Is the Single Source of Truth

GitHub is the authoritative source for:

- Source code
- Documentation
- Database migrations
- Architecture decisions
- Project status
- Roadmap
- Configuration templates
- Change history

Local files or external notes are not authoritative when they conflict with GitHub.

### 3.8 Medical Accuracy First

Medical and scientific content must prioritize accuracy, evidence, and traceable references.

AI-generated information must not replace validated medical knowledge.

### 3.9 Step-by-Step Delivery

Every implementation step follows:

1. Idea
2. Implementation
3. Testing
4. Confirmation
5. Commit and Push

A step is not considered complete until it has been tested and confirmed.

---

## 4. Technology Foundation

### Frontend

- Next.js
- TypeScript
- React
- App Router
- Tailwind CSS

### Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions when required

### Artificial Intelligence

- Google Gemini

### Development Environment

- Termux on Android

### Version Control

- Git
- GitHub

---

## 5. Core Domains

MyLab consists of the following primary domains:

### Knowledge

The scientific and professional knowledge system of the platform.

### AI

Artificial intelligence is a platform-wide capability integrated into relevant features and content.

AI is not limited to a standalone chatbot.

### Learning Marketplace

Users can create and publish educational courses.

Courses are subject to MyLab review and approval before publication.

### Community

A professional community dedicated to the target laboratory audience.

### Economy

The digital economic system of MyLab.

A wallet is created for each user as part of account registration.

---

## 6. Core Platform Systems

The following systems support multiple domains:

- Identity and Authentication
- User Profiles
- Authorization and Permissions
- Wallet
- Notification Engine
- AI Engine
- Knowledge Graph
- Search
- File Storage
- Administration
- Audit and Activity Tracking

These systems must remain modular and reusable across domains.

---

## 7. Artificial Intelligence Principle

AI is a cross-platform capability.

It may be integrated contextually into:

- Knowledge
- Laboratory test information
- Learning
- Community
- Other appropriate platform features

Example:

A laboratory test page may provide an AI action allowing the user to request a deeper explanation of a specific piece of information.

AI should understand the context in which it is invoked.

---

## 8. Economy Principle

The economy is a foundational part of MyLab from the beginning.

Every registered user receives a wallet identifier as part of account creation.

The economy may later support:

- Course purchases
- Course creator earnings
- Platform fees
- Rewards
- Transactions
- Withdrawals
- Other approved digital services

Financial operations must be designed with strong security, auditing, and transactional integrity.

---

## 9. Notification Principle

Notifications are a core platform system.

The notification system must support contextual, categorized, and extensible notifications across MyLab domains.

Examples include:

- Learning events
- Community interactions
- Wallet transactions
- Security events
- System events
- Knowledge updates
- AI-related events

The notification architecture must support future expansion without requiring redesign of individual domains.

---

## 10. Learning Marketplace Principle

MyLab does not depend exclusively on internally produced courses.

Qualified users may become course creators and publish educational content.

The platform is responsible for:

- Course submission
- Review
- Approval
- Publication
- Course management
- Student enrollment
- Financial processing
- Quality and policy enforcement

Course creators and students are different platform capabilities, not necessarily different account types.

---

## 11. Development Workflow

For every feature:

### Step 1 — Define

Understand the requirement and its architectural position.

### Step 2 — Design

Define data, security, dependencies, interfaces, and behavior.

### Step 3 — Implement

Build the production-ready implementation.

### Step 4 — Test

Verify expected behavior and relevant failure cases.

### Step 5 — Document

Record important changes and decisions.

### Step 6 — Commit

Create an intentional Git commit.

### Step 7 — Push

Push the verified change to GitHub.

Only then is the step considered complete.

---

## 12. No Temporary Architecture

The project must not introduce temporary implementations with the intention of replacing them later.

If a feature cannot yet be implemented correctly, implementation should wait until the required architecture is defined.

---

## 13. Change Management

Any change to an established architectural principle must:

1. Identify the affected principle.
2. Explain the reason for the change.
3. Evaluate its impact.
4. Update the relevant documentation.
5. Record the decision.
6. Commit and push the change to GitHub.

---

## 14. Project Continuity

The project must maintain persistent documentation that allows development to continue from any future session.

Required project continuity documents include:

- `docs/project-status.md`
- `docs/session-handoff.md`

These files must be updated as the project progresses.

---

## 15. Quality Standard

The final system must prioritize:

- Reliability
- Security
- Medical accuracy
- Maintainability
- Scalability
- Performance
- Clear architecture
- Testability
- Long-term sustainability

Feature quantity must never take priority over system quality.
