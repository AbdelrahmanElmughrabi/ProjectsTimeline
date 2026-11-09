# V5a issue draft — Resume linked engineering context

Local draft for owner review · proposed label `feature` · [Technical proposal](v5a-linked-development-continuity.md) · [Roadmap](product-implementation-roadmap.md). After approval and baseline integration, publish this as a separate issue and base its implementation PR on updated `main`. [Integration sequence](../documentation-audit.md#default-branch-integration-proposal).

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

| Decision for approval | Recommended default and tradeoff |
| --- | --- |
| Editor on wide and compact windows | Use one labelled dialog, centered at a comfortable reading width on wide windows and near full width with its own scroll on compact windows. Reuse the stored-source dialog's focus return. Pin the selected record and revision visibly. Cancel and reopen to change the target. The dialog briefly covers the map and leaves its layout and inspector state intact. |
| Immediate Resume context | Keep **Open project** and add **Resume Development** only when the latest checkpoint is linked. Show its target, timestamp and next step immediately on return to the inspector. Keep the accomplishment and optional problem, reasoning and questions one expansion away. Preserve existing Home summary content and project-level Resume. |
| Linked and unlinked Journal entries | Use one newest-first history. Mark linked entries with the record title and kind. **Previous checkpoints** opens the same Journal with a clearable record filter. A newer unlinked checkpoint wins Resume, while earlier links remain available from Journal. This keeps the latest authored intent and avoids parallel timelines. |
| Changed or unavailable target | Open the selected checkpoint in Journal with a short status notice. Offer **View saved definition** and **Open current record** when those reads are possible. Keep the authored text visible and offer read-only retry for transient failures. The extra step makes revision differences explicit. |
| Map entry point | Add one **Record checkpoint** action near the selected inspector record heading for the five supported kinds, once the record loads. Keep graph nodes and the canvas toolbar dedicated to exploration. This requires selecting a record first and makes the target visible before writing. |

These defaults build on the existing responsive inspector, source dialog, project-level Resume and combined checkpoint history. [Map and inspector](../../src/renderer/knowledge/ProjectKnowledgeWorkspace.tsx) · [Project tools and history](../../src/renderer/App.tsx) · [Resume](../../src/renderer/ResumePanel.tsx).

Separately approve the five target kinds, migration 005, typed IPC and idempotent save contract in the [technical design](v5a-linked-development-continuity.md). For owner review, trace one Save from the inspector to the named IPC and SQLite transaction. Step through the rollback test between the two inserts and compare the result to a lost acknowledgement after commit.
