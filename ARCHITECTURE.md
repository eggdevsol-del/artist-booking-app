# Calendair Architecture Rules

These rules are mandatory for all future changes.
Any PR or change that violates them must be refactored before features are added.

SSOT (Single Source of Truth): Every piece of state must have exactly one canonical source and must not be duplicated across layers.
Database SSOT: All persisted state lives only in the database and nowhere else.
API SSOT: tRPC procedures are the only authoritative interface for server-side data and mutations.
Query Cache SSOT: TanStack Query cache is the single client-side authority for all server state.
No Shadow State: Server-derived data must never be copied into React local state, context, or custom stores.
Derived State Only: UI values such as unread counts, badges, totals, timers, and flags must be derived from SSOT, never stored.
Selectors Required: All derived state must be computed via selector functions or hooks that read from the query cache or props.
No Inline Derivation: UI components must not calculate derived values directly inside render logic.
Domain Logic Centralization: All business rules must live in a dedicated domain/service layer and nowhere else.
No Business Logic in UI: UI components must never contain booking, messaging, policy, or workflow logic.
Presentational Components: Presentational components are props-only, stateless, and unaware of tRPC, routing, or domain logic.
Container Components: Container components handle data fetching, mutations, and selector usage and pass results to presentational components.
Strict Role Separation: A component must be either presentational or a container, never both.
Design Tokens SSOT: Colors, spacing, radii, shadows, and motion values must come exclusively from centralized design tokens.
No Hardcoded Styles: Components must not hardcode hex colors, spacing numbers, radii, or shadows.
Component API Contracts: Every reusable component must expose a clear, stable props interface with no hidden dependencies.
No Implicit Dependencies: Components must not rely on global state or side effects not expressed via props.
Barrel Exports Only: All UI components must be imported via barrel exports (e.g., ui/index.ts) and not deep paths.
Single Render Path: Each feature (e.g., Booking Wizard) must have exactly one render entry point and one layout shell.
No Legacy UI Paths: Legacy or duplicate UI render paths must be removed or redirected to the canonical implementation.
Event-Driven Side Effects: Notifications and side effects must be triggered via domain events, not inline calls.
Outbox Pattern: All external side effects must pass through an outbox or orchestration layer for reliability and idempotency.
PWA Cache Discipline: UI and logic changes must invalidate or bypass stale service worker caches on each deploy.
Version Truth: The running PWA must always display and reflect the currently deployed version.
Incremental Refactor Only: Changes must be minimal, scoped, and must not rewrite unrelated systems.
Refactor Before Feature: If a change violates these rules, it must be refactored before new functionality is added.
