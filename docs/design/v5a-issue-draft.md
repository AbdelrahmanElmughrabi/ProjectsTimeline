# V5a issue draft — Resume linked engineering context

Local draft for owner review · proposed label `feature` · [Technical proposal](v5a-linked-development-continuity.md) · [Roadmap](product-implementation-roadmap.md).

## Problem and expected behavior

An ordinary checkpoint records what happened and what to do next. When the note refers to an engineering record, the developer still has to find that record and its source after a restart. Save one deliberate link from a checkpoint to the record under investigation, then resume with the authored context, exact captured source and earlier checkpoints in reach.

**Journey:** Open a formed project from Home → inspect an engineering record on the Map → record what happened and the next step, with optional problem, reasoning and questions → switch projects or quit → Resume Development → see the saved context and record → revisit earlier checkpoints in Journal.

## Scope and constraints

- Reuse Home, the Map inspector, Resume and Journal. The proposed targets are components, features, requirements, proposed actions and proposed decisions. Reviewing or cancelling is read-only.
- Preserve unlinked checkpoints and their ordering. A link identifies one same-project knowledge entity and the definition revision reviewed at Save. Main validates and saves both rows atomically and uses a request key for safe retry. Migration 005 and the typed command are proposals for approval.
- Preserve the distinction between a saved observation and engineering work or evidence. Requirement acceptance, action commitment/completion, scope activation, releases, live files, source attachment, Focus Canvas and saved camera layouts are outside this issue.

## Acceptance and verification

- [ ] Save a linked checkpoint from the Vivarium PetDNA action. After project switching and full Windows app restart, Resume opens that exact checkpoint and reveals the intended record. Its stored source is accessible and the action is still Proposed.
- [ ] A newer unlinked checkpoint remains the latest Resume entry. Earlier linked entries can be opened through Journal. Revised or unavailable targets leave the selected checkpoint readable and explain the fallback. Late reads cannot change the active project.
- [ ] Wrong-project, stale or invalid targets fail with the draft intact. Inject a failure between writes and observe no partial checkpoint. Replaying an identical request after lost acknowledgement returns one checkpoint. After acknowledgement, failed refresh retries only reads.
- [ ] Upgrade populated v4 data with a backup and preserve existing checkpoints, exact captures, workflows and confirmed releases. Run Node, Electron and rebuilt packaged recovery; exercise keyboard focus, compact inspector and source return at 800, 1160 and 1540 px.

## Owner decisions before implementation

1. Use **Record checkpoint** in the inspector and separate **Resume Development** and **Open project** entry points when Home has linked context? Confirm the editor placement on compact windows and whether the pinned target changes only through cancel and reopen.
2. Keep the next step visible and the longer notes expandable? Confirm the optional note labels and whether **Previous checkpoints** opens the existing Journal filtered to that record.
3. Confirm latest checkpoint wins even when unlinked, and a revised or missing target opens the selected Journal entry with the saved revision available where possible. Decide how prominently the revision notice appears.

Separately approve the proposed target kinds, schema and request-key contract in the [technical design](v5a-linked-development-continuity.md). For owner review, trace one Save from the inspector to the named IPC and SQLite transaction. Step through the rollback test between the two inserts and compare the result to a lost acknowledgement after commit.
