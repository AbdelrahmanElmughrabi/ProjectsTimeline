# ProjectsTimeline Constitution

Draft for owner review, 2026-11-11. This document consolidates existing approved decisions
for Spec Kit planning and analysis. The linked decisions retain their original history.

## Core Principles

### I. Approved, bounded work

Agents MUST implement within the authorized scope and preserve unrelated work. Scope
expansion, schema changes, security-boundary changes and another milestone require the
owner's approval. Routine in-scope engineering activities proceed under existing host
permissions and session authorization. Follow the current approval gates and workflow.
[Agent instructions](../../AGENTS.md) and [engineering workflow](../../docs/engineering-workflow.md).

### II. Validated application boundaries

Renderer calls MUST use the named typed preload/IPC API. Main MUST validate inputs and
own SQLite. Preserve the existing sandbox, context isolation, trusted-sender checks and
content-security policy when implementing a change. Follow the accepted runtime design.
[ADR 0001](../../docs/adr/0001-foundation.md) and [ADR 0008](../../docs/adr/0008-durable-knowledge-formation.md).

### III. Durable data and preserved history

Changes MUST preserve previous migrations, exact captured source and confirmed release
history. Schema upgrades MUST retain the existing backup, transaction and version-refusal
behavior. Acknowledged writes and subsequent read failures MUST retain their distinct
outcomes, with refresh retries performing reads. Apply the accepted persistence contracts.
[ADR 0001](../../docs/adr/0001-foundation.md), [ADR 0002](../../docs/adr/0002-resume-workspace.md),
[ADR 0004](../../docs/adr/0004-release-progress.md) and [ADR 0008](../../docs/adr/0008-durable-knowledge-formation.md).

### IV. Verification matched to the change

Agents MUST run relevant checks, use isolated test profiles and report actual commands,
results, failures and open manual checks. Changes to persistence, IPC, navigation or
recovery MUST exercise the affected boundary and the approved milestone's failure and
recovery criteria. Packaged behavior requires rebuilt-package evidence where specified.
Owner acceptance and executed automated checks MUST retain their separate status.
[Engineering workflow](../../docs/engineering-workflow.md#verification-and-owner-review).

### V. Reuse and proportional engineering

Agents MUST reuse the existing architecture, tools and authoritative records where they
meet the requested behavior. Use installed Spec Kit skills for meaningful feature work
and keep localized fixes proportional. Complete relevant review and continuity updates
within the authorized scope. Additional process or infrastructure requires a demonstrated
need and the applicable owner approval.
[Engineering workflow](../../docs/engineering-workflow.md#workflow-selection).

## Project Constraints

ProjectsTimeline uses the accepted Windows-first Electron, React/TypeScript, Vite and
main-owned SQLite foundation. Knowledge formation, proposed engineering work and confirmed
delivery history retain their accepted domain boundaries. Reuse these decisions when
planning the next approved slice.
[ADR 0001](../../docs/adr/0001-foundation.md), [ADR 0005](../../docs/adr/0005-reusable-workflows.md)
and [ADR 0008](../../docs/adr/0008-durable-knowledge-formation.md).

## Engineering Workflow

Follow the existing issue, branch, verification, review and handoff process. Read current
status and approvals in the fresh-session briefing. Remote publication, merge and
repository-setting changes require explicit authorization under the established workflow.
[Engineering workflow](../../docs/engineering-workflow.md) and
[fresh-session briefing](../../docs/design/product-implementation-roadmap.md#fresh-session-briefing).

## Governance

This first draft records the existing decisions and the approved V0.2 integration
direction. Ratification awaits owner review. Resolve conflicts against explicit owner
authorization and the applicable accepted ADR amendments before dependent work. Amend
this document through a reviewable change with its source decisions and verification.
Version changes use major for incompatible principles, minor for material additions and
patch for clarification. Instructions guide agent behavior, and executed checks supply
verification evidence.

**Version** 0.1.0 | **Ratification** Pending owner review | **Last amended** 2026-11-11
