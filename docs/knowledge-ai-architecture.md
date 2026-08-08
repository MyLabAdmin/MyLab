# MyLab Knowledge & AI Architecture

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Purpose

The Knowledge and AI architecture defines how MyLab manages structured medical-laboratory knowledge and provides centralized AI capabilities across the platform.

Knowledge and AI are separate domains with explicit interaction boundaries.

Knowledge owns laboratory knowledge.

AI owns AI capabilities, provider integration, AI request orchestration, safety controls, and AI usage tracking.

Neither domain may bypass the authorization and application layers.

## Architectural Principle

MyLab treats medical-laboratory knowledge as structured domain data rather than unstructured text alone.

AI is a platform capability that can operate on approved context from Knowledge and other authorized domains.

The architecture must preserve a clear distinction between:

- Authoritative knowledge
- User-provided content
- AI-generated content
- AI-assisted explanations
- Application business rules

AI-generated output must never silently become authoritative medical-laboratory knowledge.

## Knowledge Domain

### Purpose

The Knowledge domain is the structured medical-laboratory knowledge base of MyLab.

It provides reliable, organized, searchable, and extensible laboratory information.

### Responsibilities

Knowledge owns:

- Laboratory tests
- Analytes
- Laboratory terminology
- Test categories
- Specimen information
- Methodology information
- Reference information
- Educational laboratory content
- Knowledge relationships
- Knowledge metadata
- Knowledge publication lifecycle
- Knowledge search interfaces

## Laboratory Tests

A laboratory test is a primary Knowledge domain entity.

A test may contain structured information such as:

- Test name
- Alternative names
- Test code where applicable
- Category
- Specimen type
- Collection requirements
- Methodology
- Analytes
- Reference information
- Clinical or educational description
- Related tests
- Status
- Version information

The exact schema will be defined during database architecture.

## Analytes

Analytes represent measurable or reportable laboratory entities associated with laboratory tests.

Examples may include:

- Glucose
- Hemoglobin
- Creatinine
- Sodium
- Potassium
- Alanine aminotransferase
- Thyroid-stimulating hormone

An analyte may be associated with multiple laboratory tests.

The relationship between tests and analytes must be explicitly represented in the data model.

## Reference Information

Reference information may include:

- Reference ranges
- Units
- Population considerations
- Age-related considerations
- Sex-related considerations where applicable
- Method-specific information
- Laboratory-specific variation
- Interpretation notes

Reference information must not be presented as universally applicable when the source or context does not support that assumption.

Reference ranges may vary according to methodology, laboratory, population, age, and other factors.

## Knowledge Content Lifecycle

Knowledge content must have an explicit lifecycle.

The conceptual lifecycle is:

Draft
→ Review
→ Approved
→ Published
→ Updated
→ Archived

Only approved and published content may be treated as authoritative platform knowledge.

Changes to important knowledge content must preserve appropriate version and audit information.

## Knowledge Ownership

Knowledge owns:

- Laboratory knowledge
- Knowledge structure
- Knowledge relationships
- Knowledge content lifecycle
- Knowledge publication state
- Knowledge metadata

Knowledge does not own:

- User authentication
- Wallets
- Financial transactions
- AI provider accounts
- AI provider credentials
- Community discussions
- Learning enrollment

## Knowledge Search

Knowledge must provide structured search capabilities.

Search may support:

- Test name
- Alternative test name
- Analyte
- Category
- Laboratory terminology
- Educational content
- Related concepts

Search implementation must remain behind an application interface.

The UI must not depend directly on database-specific search implementation details.

The search architecture must allow future improvements such as:

- Full-text search
- Structured filtering
- Ranking
- Synonym support
- Semantic search
- Vector-based retrieval where justified

## Knowledge and AI Boundary

Knowledge may request AI assistance.

The interaction is:

Knowledge UI
→ Application Layer
→ Knowledge Context
→ AI Service
→ Provider
→ Validated AI Response
→ Application UI

Knowledge does not directly call the external AI provider.

The AI domain must remain responsible for provider integration.

## AI Domain

### Purpose

The AI domain provides centralized AI capabilities for MyLab.

AI is not limited to a standalone chatbot.

The AI domain can be invoked by multiple application domains.

### Responsibilities

AI owns:

- AI request orchestration
- Prompt construction
- Context preparation
- Provider integration
- Input validation
- Output validation
- AI safety controls
- AI usage tracking
- Provider abstraction
- AI request lifecycle
- AI-related application events

## AI Provider Abstraction

Gemini is the initial AI provider.

The application must not couple domain logic directly to Gemini-specific implementation details.

The conceptual structure is:

Application
→ AI Service Interface
→ AI Provider Adapter
→ Gemini

Future providers may be introduced through additional adapters.

Examples:

AI Service
→ Gemini Adapter

or:

AI Service
→ Future Provider Adapter

Changing the provider must not require restructuring the Knowledge, Learning, or Community domains.

## Gemini Integration

Gemini credentials and provider configuration must remain server-side.

Client-side code must never contain:

- Gemini API keys
- Provider secrets
- Private provider configuration

AI requests requiring provider access must be executed through trusted server-side infrastructure.

## AI Request Lifecycle

The conceptual AI request flow is:

User Request
→ Authentication
→ Authorization
→ Input Validation
→ Context Authorization
→ Context Preparation
→ Prompt Construction
→ AI Provider
→ Provider Response
→ Output Validation
→ Safety Processing
→ Usage Recording
→ Application Response

Each stage must have a defined responsibility.

## Input Validation

AI requests must validate:

- Authenticated session
- User permissions
- Request type
- Input size
- Input structure
- Allowed context
- Domain-specific constraints

Invalid or unauthorized requests must be rejected before reaching the provider.

## Context Preparation

AI must only receive context that the requesting user and application operation are authorized to access.

Context may originate from:

- Knowledge
- Learning
- User-provided content
- Other approved application domains

Context must be explicitly selected and structured.

The AI layer must not automatically retrieve unrestricted application data.

## Prompt Construction

Prompt construction belongs to the AI domain.

Prompts must be generated through controlled application logic rather than being constructed arbitrarily in UI components.

Prompt construction may include:

- System instructions
- Task instructions
- Authorized domain context
- User input
- Output requirements
- Safety instructions

Provider-specific prompt formatting must remain inside the provider integration boundary where appropriate.

## AI Output Validation

AI output must be treated as untrusted generated content.

The application must validate output before exposing it to downstream workflows that require structured or controlled data.

Validation may include:

- Response structure validation
- Required field validation
- Length limits
- Content safety checks
- Domain-specific constraints
- Structured output validation where required

AI output must not automatically modify authoritative Knowledge data.

## Medical Safety Principle

MyLab is a medical-laboratory platform.

AI responses must therefore be treated as assistance rather than an unquestioned source of medical truth.

AI features must clearly distinguish generated explanations from authoritative Knowledge content.

Where appropriate, AI responses should identify relevant limitations, uncertainty, context dependence, and the need to consult authoritative laboratory information.

The exact user-facing safety language will be defined during feature implementation.

## AI and Authoritative Knowledge

The relationship is:

Authoritative Knowledge
→ Approved Context
→ AI Processing
→ Generated Explanation

Not:

AI Output
→ Automatic Authoritative Knowledge

AI-generated content may be proposed for review or used as an assistance layer, but authoritative Knowledge publication requires the Knowledge domain's defined review and approval process.

## AI Usage Tracking

The AI domain must track usage required for:

- Operational monitoring
- Rate limiting
- Cost control
- Abuse detection
- Feature analytics
- Provider usage analysis
- Future Economy integration where required

Usage records must not expose sensitive provider credentials.

The exact usage schema will be defined during database architecture.

## AI Rate Limiting

AI operations must support server-side rate limiting.

Limits may depend on:

- User
- Feature
- Role
- Request type
- Provider capacity
- Platform policy

Rate limiting must not rely solely on client-side controls.

## AI Failure Handling

The AI layer must handle provider failures explicitly.

Possible states include:

- Request accepted
- Processing
- Completed
- Validation failed
- Provider failed
- Rate limited
- Rejected
- Cancelled where supported

Provider errors must not expose sensitive internal implementation details to users.

## AI Observability

AI operations should provide sufficient observability for:

- Request lifecycle
- Provider latency
- Provider failures
- Usage volume
- Token or equivalent usage where available
- Validation failures
- Safety events
- Rate-limit events

Logging must avoid unnecessary exposure of sensitive user content.

## Knowledge Events

Knowledge may emit events such as:

- Knowledge created
- Knowledge submitted for review
- Knowledge approved
- Knowledge published
- Knowledge updated
- Knowledge archived

Other domains may consume these events through explicit contracts.

## AI Events

AI may emit events such as:

- AI request created
- AI request completed
- AI request failed
- AI request rejected
- AI safety event
- AI usage recorded

Notifications or analytics systems may consume approved events.

## Learning Boundary

Learning may use Knowledge content as educational material.

Learning may request AI assistance for:

- Lesson explanation
- Educational assistance
- Learning support
- Assessment assistance where explicitly authorized

Learning must not directly access internal AI provider implementation.

## Community Boundary

Community may use approved AI capabilities for explicitly defined features.

Examples may include:

- Content assistance
- Moderation assistance
- Educational explanation

Community must not directly call the AI provider.

## Identity Boundary

Identity provides authentication and authorization context.

AI and Knowledge must not implement independent authentication systems.

Protected Knowledge and AI operations require a valid authenticated application session where required by the feature.

## Economy Boundary

AI usage may eventually be connected to Economy when MyLab introduces usage-based financial rules.

Such integration must use explicit application contracts.

AI must not directly modify wallet balances or ledger records.

## Security Principles

Knowledge and AI must follow these principles:

- Authentication is server-trusted.
- Authorization is enforced server-side.
- AI provider credentials remain server-side.
- Clients cannot directly call protected provider integrations.
- AI receives only authorized context.
- AI output is treated as untrusted generated content.
- Authoritative Knowledge requires explicit approval.
- Sensitive data must not be unnecessarily sent to AI providers.
- AI usage must be auditable where required.
- Rate limiting is enforced server-side.
- Provider failures are handled explicitly.
- Cross-domain access uses explicit contracts.

## Data Privacy Principle

Only the minimum required data should be sent to an external AI provider.

Sensitive or unnecessary personal information must not be included in AI context without a defined business and security requirement.

The detailed data classification and retention policy will be defined during Security Architecture.

## Production Principle

Knowledge and AI are production domains from the beginning.

There is no temporary AI integration.

There is no direct client-to-Gemini architecture.

There is no prototype Knowledge data model.

The implemented architecture must be suitable for the final production system.

## Development Sequence

Knowledge and AI implementation will follow:

1. Finalize Knowledge domain model.
2. Finalize AI service contracts.
3. Define database schema.
4. Define authorization rules.
5. Configure secure provider integration.
6. Implement Knowledge services.
7. Implement AI services.
8. Implement application UI surfaces.
9. Add testing and observability.
10. Verify production build.

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
