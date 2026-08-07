# MyLab System Architecture

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Architectural Principle

MyLab is designed as a production-ready, modular platform from the beginning.

The architecture must prioritize:

- Maintainability
- Security
- Clear separation of responsibilities
- Extensibility
- Testability
- Simple and understandable code
- Avoidance of temporary or prototype architecture

## Core Application Flow

The primary application flow is:

UI
→ Application / Server Layer
→ Domain Logic
→ Authorization
→ Supabase
→ PostgreSQL

The UI must not directly implement sensitive business logic.

Sensitive database operations must be controlled through the appropriate application/server and authorization layers.

## Main Layers

### 1. Presentation Layer

Responsible for:

- User interface
- Pages
- Components
- Forms
- Navigation
- Client-side interaction
- Accessibility
- Arabic and English presentation

Technology:

- Next.js
- React
- shadcn/ui where appropriate
- CSS variables and design tokens

The presentation layer must remain independent from database implementation details.

### 2. Application / Server Layer

Responsible for:

- Application use cases
- Server-side operations
- Request validation
- Calling domain services
- Coordinating workflows
- Protecting sensitive operations

This layer connects the presentation layer with domain logic.

### 3. Domain Layer

Contains the business rules of MyLab.

Domains must remain modular and independently understandable.

Initial domains:

- Identity
- Knowledge
- AI
- Learning
- Community
- Economy
- Notifications

Additional domains may be introduced when required by the architecture.

### 4. Authorization and Security Layer

Responsible for:

- Authentication state
- Authorization
- Role and permission enforcement
- Resource ownership
- Access control
- Protection of sensitive operations

Security must be designed before implementing features that depend on protected data.

### 5. Data Layer

Supabase is the backend platform.

It provides:

- PostgreSQL
- Authentication
- Storage
- Realtime capabilities where required

Database access must follow the defined security model and Row Level Security policies.

The database schema is part of the production architecture and must be versioned.

### 6. AI Service Layer

AI is a core architectural capability of MyLab.

AI must not be implemented only as a standalone chat interface.

The AI Service Layer can be invoked by multiple domains and features.

Examples:

- Explaining laboratory test information
- Explaining a medical laboratory concept
- Assisting with interpretation of educational content
- Generating learning assistance
- Other approved AI-powered features

The AI layer is responsible for:

- Prompt construction
- Context preparation
- Input validation
- Output handling
- Safety controls
- Provider integration

Initial AI provider:

- Google Gemini

The architecture must allow the AI provider to be replaced or extended in the future without restructuring the application domains.

### 7. Notification Layer

Notifications are a core platform capability.

The notification architecture must support specialized notification types and delivery rules.

Potential channels include:

- In-app notifications
- Push notifications
- Email where required

Notifications must be generated from defined application events rather than being scattered throughout UI components.

The notification system must support:

- User preferences
- Notification categories
- Read/unread state
- Delivery status
- Priority
- Scheduling where required
- Extensible event-driven notification rules

## Domain Interaction Principle

Domains may communicate through clearly defined application services, domain events, or other explicitly defined interfaces.

Domains must not become tightly coupled through direct access to each other's internal implementation.

## Data Ownership Principle

Each domain must have clearly defined ownership of its data and business rules.

Cross-domain data access must be explicit and authorized.

## Production Principle

There is no separate MVP architecture.

The architecture implemented from the beginning is intended to become the production architecture.

Temporary shortcuts, throwaway implementations, and prototype-only structures are not permitted.

## Development Sequence

Architecture work follows:

1. System Architecture
2. Domain Architecture
3. Identity Model
4. Economy and Wallet Architecture
5. Knowledge and AI Architecture
6. Learning Architecture
7. Notification Architecture
8. Community Architecture
9. Database Architecture
10. Security and Authorization Architecture
11. Infrastructure Configuration
12. Production Implementation

## Source of Truth

GitHub is the single source of truth for the project code and project documentation.

Repository:

git@github.com:MyLabAdmin/MyLab.git
