# MyLab Economy & Wallet Architecture

## Status

Approved

## Phase

Phase 1 — Architecture Design

## Purpose

The Economy domain manages MyLab wallets, financial transactions, ledger entries, payments, credits, debits, refunds, and financial business rules.

Economy is a production core domain from the beginning.

## Core Principle

The financial ledger is the authoritative record of financial movements.

A wallet balance must not be treated as the primary source of financial truth.

Financial operations must be represented by immutable ledger records.

## Wallet

Each MyLab user has one primary wallet.

The wallet is owned by the Economy domain.

The wallet is automatically created during Account Initialization.

The conceptual relationship is:

MyLab Identity
→ Account Initialization
→ Economy
→ Wallet

Identity does not own the wallet.

## Wallet Identifier

Every wallet receives a unique wallet identifier.

The wallet identifier is an Economy-owned identifier and must not be derived from sensitive authentication information.

Wallet identifiers must remain stable throughout the wallet lifecycle.

## Wallet Lifecycle

The wallet lifecycle is:

Create
→ Active
→ Suspended when required
→ Closed when supported by explicit business rules

A wallet must not be silently deleted when financial history exists.

## Ledger

The ledger is the authoritative record of financial movements.

Ledger records must be immutable after creation.

Corrections must be represented by new compensating entries rather than modifying historical financial records.

The ledger must support:

- Credits
- Debits
- Transfers where required
- Refunds
- Reversals
- Adjustments
- Transaction references
- Timestamps
- Audit information

## Transactions

A transaction represents a financial operation.

Examples:

- Course purchase
- Course refund
- Wallet credit
- Wallet debit
- Platform adjustment
- Future marketplace transaction

A transaction must have a unique identifier.

Financial operations must be idempotent.

Retrying the same operation must not create duplicate financial effects.

## Atomicity

Financial operations must be atomic.

A transaction must not produce a partial financial result.

For example:

Course purchase
→ Payment transaction
→ Ledger entries
→ Financial state update
→ Purchase confirmation

The complete operation must succeed as one controlled operation or fail without leaving an inconsistent financial state.

## Balance

The application may maintain a derived or cached wallet balance for efficient reads.

However, the ledger remains the authoritative financial source.

The system must provide a mechanism to reconcile the derived balance against ledger records.

## Double-Entry Principle

Financial operations should use a double-entry ledger model where applicable.

Each financial movement must have balanced entries.

Example:

User wallet debit
→ Platform or recipient credit

The total debits and credits for a completed transaction must balance according to the defined currency/accounting model.

## Currency

The Economy domain must explicitly define the supported currency model.

Currency must not be inferred from display formatting.

Amounts must use precise integer-based minor units or another explicitly defined exact representation.

Floating-point arithmetic must not be used for authoritative financial calculations.

## Course Purchases

Learning may request a course purchase through Economy.

The flow is:

Learning
→ Economy Purchase Request
→ Authorization
→ Validate Wallet
→ Validate Price
→ Create Financial Transaction
→ Create Ledger Entries
→ Confirm Payment
→ Learning Enrollment

Learning does not directly modify wallet balances or ledger records.

## Refunds

Refunds are financial operations owned by Economy.

A refund must reference the original transaction.

Refunds must create new ledger entries rather than modifying the original transaction.

Refunds must be idempotent.

## Credits

Credits represent funds or internal value added to a wallet.

Credits must have an explicit source.

Examples:

- Authorized platform credit
- Refund
- Approved promotional credit
- Other defined business operation

Uncontrolled client-side credit operations are prohibited.

## Debits

Debits represent value removed from a wallet.

A debit must pass:

- Authentication
- Authorization
- Wallet ownership validation
- Balance validation where applicable
- Business-rule validation

The client must never directly create an authoritative debit.

## Transfers

If wallet-to-wallet transfers are introduced, they must be implemented as atomic financial operations.

A transfer must create balanced ledger entries and must not expose an intermediate inconsistent state.

## Authorization

Economy operations must be authorized server-side.

Authorization must verify:

- Authenticated user
- Wallet ownership
- Operation permission
- Transaction state
- Resource ownership where applicable

Administrative financial operations require explicit elevated permissions.

## Auditability

Financial operations must be auditable.

The system must retain sufficient information to determine:

- Who initiated the operation
- What operation occurred
- Which wallet was affected
- Amount
- Currency
- Related resource
- Transaction identifier
- Timestamp
- Result
- Relevant system metadata

Sensitive authentication credentials must never be stored in financial records.

## Notifications Boundary

Economy may emit application events such as:

- Wallet created
- Payment completed
- Payment failed
- Refund completed
- Wallet suspended

Notifications may consume these events.

Economy does not directly implement notification delivery.

## Identity Boundary

Identity may initiate wallet creation during Account Initialization.

Identity does not:

- Own wallet balances
- Create ledger entries directly
- Modify financial transactions
- Process refunds
- Perform financial authorization

These responsibilities belong to Economy.

## Learning Boundary

Learning owns:

- Courses
- Enrollment
- Learning progress

Economy owns:

- Payments
- Wallets
- Transactions
- Ledger entries
- Refunds

Cross-domain operations must use explicit application contracts.

## Security Principles

Economy must follow these principles:

- No authoritative financial mutation from the client.
- All financial mutations occur server-side.
- All financial operations require authorization.
- Ledger records are immutable.
- Financial operations are idempotent.
- Financial operations are atomic.
- Amounts use exact arithmetic.
- Wallet ownership is validated.
- Financial history is auditable.

## Production Principle

Economy is designed as the final production architecture from the beginning.

There is no temporary wallet implementation.

There is no client-side balance authority.

There is no prototype financial model.

## Source of Truth

GitHub is the single source of truth.

Repository:

git@github.com:MyLabAdmin/MyLab.git
