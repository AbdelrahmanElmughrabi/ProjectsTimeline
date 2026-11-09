# V3 consolidated implementation roadmap

2026-11-09 · **V2/V3a1a baseline and advisory Windows CI integrated into `main` at `1e18dd7`. V5a design under review.** [Merged baseline PR #1](https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/pull/1) · [Merged CI PR #2](https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/pull/2) · [Stabilization acceptance and open checks](../v3a1a-stabilization-verification.md#manual-acceptance).

## Fresh-session briefing

- **Product and architecture.** ProjectsTimeline is a local Windows engineering workspace for project memory, authored knowledge and verified delivery history. React uses a named typed Electron bridge. Main owns validation and SQLite. Schema v4 holds reviewed PTB knowledge and exact source alongside legacy journals, workflows and frozen releases. [Product direction and decisions](../product-architecture-alignment.md#product-direction-and-decision-handoff) · [Run and verify](../../README.md#run-and-verify).
- **Verified baseline.** Base new approved work on updated `main` at `1e18dd7`. The CI PR passed 92 Node tests with zero skips on hosted Windows. The prior application baseline recorded 28 Electron, five packaged recovery and seven packaged knowledge checks passing. [Hosted CI run](https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/actions/runs/42566363806) · [Application verification](https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/pull/1) · [Engineering checklist](../engineering-checklist.md).
- **Next review.** [V5a UX decisions](v5a-issue-draft.md#owner-decisions-before-implementation) and its [technical proposal](v5a-linked-development-continuity.md), including migration 005, require owner approval. Native picker, screen-reader checks, owner-run Vivarium restart and dense-map polish remain open. [Visual backlog](visual-engineering-backlog.md).
- **Start work.** Read [AGENTS.md](../../AGENTS.md) and the assigned task, then run `git status --short --branch`, `git log -5 --oneline` and `git worktree list`. Verify the intended base includes the latest briefing. Preserve unrelated edits and existing checkouts. Follow the [engineering workflow](../engineering-workflow.md) for roles, approvals, verification and handoff. The prior worktrees are inventoried in the [documentation audit](../documentation-audit.md).

Use this briefing and the linked evidence for current status. Dated ADRs, checklists and handoff reports may describe an earlier approval gate.

## Preservation and delivery choice

V1/V2 remain working foundations. Migration 004 adds durable knowledge and preserves existing release, Resume and workflow records. Source/runtime history for V2 remains at bb2fd95/b16f212, tooling/paused research at 47f73c6 and visual handoff at 63c18e9. Antigravity's design study stays on its own branch.

The user approved refined Concept C and separately authorized production V3a1a. The implemented slice tests the persisted graph inside the real app:// renderer and the rebuilt ASAR. The later scope, work-state and continuity paths have independent gates.

## Smaller complete vertical slices

| Order / stable slice | Complete path and scope | Dependencies / acceptance gate |
| --- | --- | --- |
| 0 · Consolidated design review — complete | Independently inspect A/B/C, reproduce important defects, source/digest/IPC audit, select visual/domain boundaries | User approved refined C and the revised concrete schema and implementation scope at 1b3be92. |
| 1 · V3a1a Durable knowledge formation — implemented | Review a real PTB capture → create a project → explore its Overview / Map / inspector / stored source → restart and reopen the same graph. | **Automatically verified.** Vivarium retains all 47 definitions and 86 native links and creates zero operational actions or releases. Backup, rollback and receipt replay pass. Subsequent UX stabilization accepted. [Evidence](../v3a1a-verification-report.md). |
| 2 · V5a Linked Development Continuity — proposed | Save a checkpoint from a supported Map record → Resume from Home → see the linked record and next step after restart → find earlier entries in Journal. | Formation provides stable record IDs and revisions. The proposal uses the existing Map reveal path and a Journal fallback. Review scope, UI choices and additive schema before implementation. [Issue draft](v5a-issue-draft.md) · [Technical design](v5a-linked-development-continuity.md). |
| 3 · V3a1b Selective lightweight work | Reopen plan → accept chosen requirement revisions independently → explicitly commit one unscoped action → complete/reopen → actual history/checkpoint/Continue | Add approved unique same-project entity/action mapping, commitment/audit and receipt transaction. Stable knowledge/checkpoint IDs; legacy queries/commands and release INSERT/UPDATE guarded before operational work exists. No silent uncommit/revoke/move. Draft acknowledgement deliberate/revision-bound. Desk Notes works with optional scope Draft; zero releases. Start/focus only with finalized policy; otherwise omit controls. |
| 4 · V3b1 Optional inline organization | Explicit scope activation + chosen scoped commitments → secondary Development stage roadmap ↔ Map/History/inspector → linked Resume | Separate independent scope/stage-instance/membership/lifecycle/revision schema, not release tables. Vivarium one four-stage plan/nine scoped actions + one unscoped; FieldLedger two scopes/shared features/actions counted once. Unresolved workflow Needs review; explicit-null unscoped placement; empty included work Not assessed. No release gate, percentage, schedule or task-priority inference. |
| 5 · V3a2 Local evolution; V6a1/2 attachment/update | Edit working definitions with revisions/source comparison; then explicit legacy binding/additions; later B/L/I update review, Keep local/Accept incoming/Skip | Separate complete paths. No name matching, destructive omission, completion reset or unchanged-graph auto-merge. Bindings detect repeat source immediately; until update ships offer Open existing/Cancel. Preserve confirmed releases/history. Three-way policy remains designed before SQL even though its full UI is later. |
| 6 · V3b2 Lifecycle / V4 development playbooks | Pause/close/reopen/move with audited dispositions; later copy a development-purpose workflow and customize independently | Original lifecycle/reassignment guards, completed-move acknowledgement and atomic affected revisions. Preserve master/source versions and legacy release library/gates; no automatic sync or generic rule engine. |
| 7 · V5b decisions / V5c evidence | Explicit decision acceptance/supersession; planned check → actual observation/provenance → exact-revision assessment | Individually approved transition/freshness policies; no automatic runner. Action done/definition accepted remains separate from verified. |
| Later · other adapters, suggestions, delivery | Explicit versioned Markdown/Obsidian/OpenSpec/Spec Kit capture/interpretation; optional AI review; future MCP; separately protected release snapshots | No implementation now. Native explicit meaning/identity/grants, not truth tiers or required AI. Snapshot policy/schema still deferred. See backlog and ingestion design. |

V3a1a → V5a → V3a1b → V3b1 is the **approved** first useful development sequence. V5a remains immediately after formation, as the user requested; do not bury recovery behind a full scope editor or workflow library. Each row is independently reviewable end to end. The smaller first slice does not claim delivery of every simulated C interaction.

## Schema and command boundaries

The [approved 004 SQL](v3a1a-schema-proposal.md) and [V3a1a contract](v3a1a-implementation-proposal.md) established stable knowledge-only proposals, independent source bindings and receipt-first retries. V3a1b must enforce development/release isolation on inserts and updates when adding operational mappings. [Final comparison](v3a1a-final-design-review.md) gives the table and trigger inventory and adapter extension path.

Keep scope/stage plans as proposals before activation; later instances have independent identities/membership. Source and local revision remain separate. The first receipt uses exact capture/document hashes plus existing narrative-inclusive semantic hash and reviewed choices; a second structural digest is not mandatory without a versioned normalization contract. Count equality cannot establish unchanged meaning.

Formation validates and retains a main-owned snapshot and plan. Apply uses one transaction and checks existing receipts before rejecting expired plans. Future adoption must validate each selected transition and expected revision, use explicit Draft acknowledgements and preserve existing accepted or committed state.

## Verification at each authorized gate

- Rerun the actual baseline before code. Keep typed named IPC, trusted sender/frame/URL, sandbox/context isolation, inert source/CSP, Result envelopes and acknowledged-write/read-only-retry. Use isolated profiles.
- Migration: populated-v3 exact preservation of legacy IDs/text/times/completion, events/checkpoints, workflow origins, active/frozen release stages/evidence/confirmation; backup failure, pending-batch rollback, FK/newer-schema refusal and rebuilt packaged restart.
- Formation/adoption: invalid/stale/cross-project/capture-changed selections; requirement-only/scope-only/unscoped/mixed choices; omitted activation; Draft acknowledgement; cancelled/empty/reopened/no-op batches; fault every graph/history/receipt phase; uncertain acknowledgement and read-after-success failure. No partial project or fabricated legacy events.
- Map: pure typed projection and exact source/derived-route tests, stable viewport/positions, real dragging, accessible outline/search selection, narrow readability/Back/focus, source Escape/removed opener fallback; layout failure/cancellation/stale results and high-degree inputs within supported parser limits. No-overflow is not sufficient acceptance.
- Run Node/Electron/build and relevant rebuilt package/recovery after actual implementation. Verify app:// and ASAR with installed React Flow/ELK/Base UI under current CSP before shipping; do not relax policy to fit a library. Prototype isolated success is not that result.
- User reviews one complete slice before expansion. Update engineering/verification/roadmap/short Obsidian checkpoint; new ADRs follow accepted consequential decisions, never rewrite old ADRs to retroactively approve proposals.

The renderer-only pass from the [consolidated post-V3a1a UX review](post-v3a1a-ux-review.md) is implemented. [Packaged verification and manual acceptance](../v3a1a-stabilization-verification.md).

The [advisory Windows check](../github-ci-proposal.md) is in `main`. V5a and migration 005 retain their design and implementation approval gate. [Deferred workspace and source ideas](visual-engineering-backlog.md).
